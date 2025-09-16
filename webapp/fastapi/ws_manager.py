# app/ws_manager.py
import asyncio
import json
from typing import Dict, Set

from fastapi import WebSocket
import redis.asyncio as redis
from logging_config import logger

REDIS_URL = "redis://localhost:6379/0"
REDIS_CHANNEL = "events"

class ConnectionManager:
    """
    Хранит отображение user_id -> set(WebSocket)
    При подключении клиент указывает token (или user_id), сервер проверяет и записывает.
    """
    def __init__(self):
        self.user_connections: Dict[int, Set[WebSocket]] = {}
        self.lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        async with self.lock:
            conns = self.user_connections.setdefault(user_id, set())
            conns.add(websocket)
            logger.info("WS connect user=%s total=%s", user_id, len(conns))

    async def disconnect(self, websocket: WebSocket, user_id: int):
        async with self.lock:
            conns = self.user_connections.get(user_id)
            if not conns:
                return
            conns.discard(websocket)
            if not conns:
                self.user_connections.pop(user_id, None)
            logger.info("WS disconnect user=%s remaining=%s", user_id, len(conns) if conns else 0)

    async def send_to_user(self, user_id: int, message: dict):
        async with self.lock:
            conns = list(self.user_connections.get(user_id, []))
        if not conns:
            return
        data = json.dumps(message)
        for ws in conns:
            try:
                await ws.send_text(data)
            except Exception:
                # если не получилось — безопасно удалить
                await self._safe_close_ws(ws, user_id)

    async def broadcast(self, message: dict):
        async with self.lock:
            all_conns = [ws for conns in self.user_connections.values() for ws in conns]
        data = json.dumps(message)
        for ws in list(all_conns):
            try:
                await ws.send_text(data)
            except Exception:
                # не знаем user_id здесь — попытаемся закрыть ws
                try:
                    await ws.close()
                except:
                    pass

    async def _safe_close_ws(self, ws: WebSocket, user_id: int):
        try:
            await ws.close()
        except:
            pass
        await self.disconnect(ws, user_id)

manager = ConnectionManager()

# Redis listener — подписка и пересылка
async def redis_listener():
    r = redis.from_url(REDIS_URL)
    pubsub = r.pubsub()
    await pubsub.subscribe(REDIS_CHANNEL)
    logger.info("Subscribed to redis channel %s", REDIS_CHANNEL)

    try:
        async for message in pubsub.listen():
            # message: dict like {"type":"message","pattern":None,"channel":b"events","data":b"..."}
            if not message:
                continue
            if message.get("type") != "message":
                continue
            data = message.get("data")
            if isinstance(data, (bytes, bytearray)):
                try:
                    payload = json.loads(data.decode())
                except Exception:
                    logger.exception("Failed to parse redis message")
                    continue
            elif isinstance(data, str):
                payload = json.loads(data)
            else:
                payload = data

            # payload must contain 'target' and 'type'
            # Example: {"type":"training_started","target":{"user_id":123},"payload":{...}}
            try:
                target = payload.get("target", {})
                # send by user_id if present
                if "user_id" in target:
                    await manager.send_to_user(int(target["user_id"]), payload)
                elif "broadcast" in target and target["broadcast"]:
                    await manager.broadcast(payload)
                else:
                    # optionally route by other targets: room_id, team_id, etc.
                    logger.debug("Unhandled target in payload: %s", target)
            except Exception:
                logger.exception("Error handling redis message: %s", payload)
    except asyncio.CancelledError:
        # graceful shutdown
        await pubsub.unsubscribe(REDIS_CHANNEL)
        await r.close()
        raise
    except Exception:
        logger.exception("redis_listener crashed, reconnecting...")
        # Т.к. listen может вылететь, делаем retry loop ниже in startup
