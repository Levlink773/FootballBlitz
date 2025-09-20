# services/publisher.py
import json
import asyncio
import os
from datetime import datetime
import redis.asyncio as redis
from dotenv import load_dotenv

from logging_config import logger
load_dotenv()
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
REDIS_CHANNEL = os.getenv("REDIS_CHANNEL", "events")

# ленивый singleton клиента
_redis_client: redis.Redis | None = None


def get_redis() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        # Можно настроить max_connections по необходимости
        _redis_client = redis.from_url(REDIS_URL, decode_responses=False, max_connections=48)
    return _redis_client


async def publish_event(payload: dict, retries: int = 3, backoff: float = 0.05) -> bool:
    """
    Публикует payload в REDIS_CHANNEL.
    Payload должен быть JSON-сериализуемым словарём.

    Возвращает True если published (успешно), False — при неудаче.
    Делает простые retry с экспоненциальным backoff.
    """
    r = get_redis()
    data = json.dumps(payload)
    attempt = 0
    while attempt < retries:
        try:
            # redis.publish возвращает число подписчиков, получивших сообщение
            await r.publish(REDIS_CHANNEL, data.encode())
            return True
        except Exception as e:
            attempt += 1
            logger.exception("publish_event error attempt=%s payload=%s err=%s", attempt, payload, e)
            await asyncio.sleep(backoff * attempt)
    logger.error("publish_event FAILED after retries payload=%s", payload)
    return False


# Вспомогательная функция для типового payload
def make_payload(event_type: str, user_id: int | None = None, target: dict | None = None,
                 payload: dict | None = None) -> dict:
    """
    Формат:
    {
      "type": "training_started",
      "target": {"user_id": 123} OR {"broadcast": True} OR custom,
      "payload": {...},
      "ts": "ISO timestamp"
    }
    """
    if target is None:
        target = {"user_id": user_id} if user_id is not None else {"broadcast": True}
    return {
        "type": event_type,
        "target": target,
        "payload": payload or {},
        "ts": datetime.utcnow().isoformat() + "Z"
    }


async def publish_batch(payloads: list[dict], batch_size: int = 50) -> list[bool]:
    """
    Публикует payloads пакетами через Redis pipeline.
    Возвращает список bool — успех/неудача для каждого payload.
    Pipeline уменьшает количество TCP round-trips.
    """
    if not payloads:
        return []

    r = get_redis()
    results: list[bool] = []
    # разбиваем на окна
    for i in range(0, len(payloads), batch_size):
        window = payloads[i:i + batch_size]
        pipe = r.pipeline()
        for p in window:
            pipe.publish(REDIS_CHANNEL, json.dumps(p).encode())
        try:
            # execute вернёт list[int] с числом подписчиков для каждой publish
            exec_res = await pipe.execute()
            # True, если команда выполнена (нет исключения)
            results.extend([True] * len(exec_res))
        except Exception as e:
            logger.exception("publish_batch pipeline failed for window start=%s err=%s", i, e)
            # В случае падения pipeline — отмечаем неуспехы. Можно тут реализовать fallback на поэлементную отправку.
            results.extend([False] * len(window))
    return results


async def publish_many_concurrent(payloads: list[dict], max_concurrency: int = 10) -> list[bool]:
    """
    Параллельная публикация с ограничением одновременных задач (Semaphore).
    Полезно, если pipeline по какой-то причине недоступен или вам нужно
    вызвать существующий publish_event (с retry-логикой).
    """
    if not payloads:
        return []

    sem = asyncio.Semaphore(max_concurrency)

    async def _worker(p):
        async with sem:
            try:
                ok = await publish_event(p)
                return bool(ok)
            except Exception as e:
                logger.exception("publish_many_concurrent single publish failed err=%s payload=%s", e, p)
                return False

    tasks = [asyncio.create_task(_worker(p)) for p in payloads]
    gathered = await asyncio.gather(*tasks, return_exceptions=True)
    # convert exceptions to False
    return [bool(r) and not isinstance(r, Exception) for r in gathered]


# Утилита: собрать payloads для списка пользователей (пример)
def make_payloads_for_users(event_type: str, users: list, payload_factory=lambda u: {}):
    """
    users — итерируемый объектов с .user_id или просто id.
    payload_factory(user) -> payload dict
    """
    out = []
    for u in users:
        uid = getattr(u, "user_id", None) or (u if isinstance(u, (int, str)) else None)
        p = make_payload(event_type=event_type, user_id=uid, payload=payload_factory(u))
        out.append(p)
    return out


# --- добавьте в конец services/publisher.py ---

async def publish_match_state(match_id: str, options: dict | None = None) -> list[bool]:
    """
    Находит матч по match_id в TeamBlitzMatchManager и отправляет каждому пользователю матча
    payload с полями: { state: str, message: str, match_id: str }.

    Возвращает список bool для каждого отправленного payload (успех/неудача).
    """
    from blitz.blitz_match.core.redis_manager import TeamBlitzMatchManager
    # пытаемся найти запись
    options = options or {}
    match_data = await TeamBlitzMatchManager.get_match(match_id)
    state_data = await TeamBlitzMatchManager.get_match_state(match_id)
    await match_data.init_teams()

    # Получаем список user_id в матче
    try:
        user_ids = match_data.all_user_ids_in_match
    except Exception as e:
        logger.exception("publish_match_state: failed to read user ids from match_data: %s", e)
        return []

    if not user_ids:
        logger.info("publish_match_state: no users in match match_id=%s", match_id)
        return []

    # сформировать payloads для каждого пользователя
    def payload_factory(u):
        base = {
            "state": state_data.state.value if hasattr(state_data.state, "value") else str(state_data.state),
            "message": getattr(state_data, "message", "") or "",
            "match_id": match_id,
            "user_id": u,
        }
        # options распаковываем позже, чтобы они могли переопределить базовые поля при необходимости
        return {**base, **options}

    payloads = make_payloads_for_users(event_type="blitz_match_state", users=user_ids, payload_factory=payload_factory)

    # Публикуем пакетно (pipeline) — можно менять на publish_many_concurrent если нужно
    try:
        results = await publish_batch(payloads)
        logger.info("publish_match_state: published %s payloads for match_id=%s", len(results), match_id)
        return results
    except Exception as e:
        logger.exception("publish_match_state: publish_batch failed for match_id=%s err=%s", match_id, e)
        # как fallback — пробуем параллельно
        try:
            results = await publish_many_concurrent(payloads)
            return results
        except Exception as e2:
            logger.exception("publish_match_state: fallback publish_many_concurrent also failed: %s", e2)
            return [False] * len(payloads)


async def publish_all_matches_state() -> dict[str, list[bool]]:
    """
    Для всех матчей в Redis отправляет каждому пользователю матча
    payload с полями: { state: str, message: str, match_id: str }.

    Возвращает dict: { match_id: [bool, bool, ...], ... } — список результатов для каждого матча.
    """
    from blitz.blitz_match.core.redis_manager import TeamBlitzMatchManager

    match_ids = await TeamBlitzMatchManager.get_all_match_ids()
    if not match_ids:
        logger.info("publish_all_matches_state: no matches found")
        return {}

    results_by_match: dict[str, list[bool]] = {}

    for match_id in match_ids:
        storage = await TeamBlitzMatchManager.get_match_storage(match_id)
        if not storage:
            logger.warning("publish_all_matches_state: storage not found for match_id=%s", match_id)
            continue

        match_data = await TeamBlitzMatchManager.get_match(match_id)
        state_data = storage.state_data

        if not match_data:
            logger.warning("publish_all_matches_state: match not restored for match_id=%s", match_id)
            results_by_match[match_id] = []
            continue

        try:
            user_ids = match_data.all_user_ids_in_match
        except Exception as e:
            logger.exception("publish_all_matches_state: failed to get user ids for match_id=%s err=%s", match_id, e)
            results_by_match[match_id] = []
            continue

        if not user_ids:
            logger.info("publish_all_matches_state: no users in match match_id=%s", match_id)
            results_by_match[match_id] = []
            continue

        def payload_factory(u):
            return {
                "state": state_data.state.value if hasattr(state_data.state, "value") else str(state_data.state),
                "message": getattr(state_data, "message", "") or "",
                "match_id": match_id
            }

        payloads = make_payloads_for_users(
            event_type="blitz_match_state",
            users=user_ids,
            payload_factory=payload_factory
        )

        try:
            res = await publish_batch(payloads)
            results_by_match[match_id] = res
            logger.info("publish_all_matches_state: published %s payloads for match_id=%s", len(res), match_id)
        except Exception as e:
            logger.exception("publish_all_matches_state: publish_batch failed for match_id=%s err=%s", match_id, e)
            # fallback на concurrent
            try:
                res = await publish_many_concurrent(payloads)
                results_by_match[match_id] = res
                logger.info("publish_all_matches_state: fallback publish_many_concurrent done for match_id=%s",
                            match_id)
            except Exception as e2:
                logger.exception("publish_all_matches_state: fallback failed for match_id=%s err=%s", match_id, e2)
                results_by_match[match_id] = [False] * len(payloads)

    return results_by_match


async def _delayed_publish(payloads, delay=5):
    await asyncio.sleep(delay)  # не блокирует цикл
    try:
        result = await publish_batch(payloads)
        logger.info("publish_batch finished, result=%s", result)
    except Exception:
        logger.exception("publish_batch failed (delayed)")


async def _delayed_publish_all_match(delay=5):
    await asyncio.sleep(delay)  # не блокирует цикл
    try:
        result = await publish_all_matches_state()
        logger.info("publish_batch finished, result=%s", result)
    except Exception:
        logger.exception("publish_batch failed (delayed)")
