# services/publisher.py
import json
import asyncio
import os
from datetime import datetime
import redis.asyncio as redis
from logging_config import logger

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
REDIS_CHANNEL = os.getenv("REDIS_CHANNEL", "events")

# ленивый singleton клиента
_redis_client: redis.Redis | None = None

def get_redis() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(REDIS_URL, decode_responses=False)  # мы отправляем байты
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
def make_payload(event_type: str, user_id: int | None = None, target: dict | None = None, payload: dict | None = None) -> dict:
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
