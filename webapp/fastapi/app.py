# main.py
import asyncio
import traceback
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketDisconnect, WebSocket

from logging_config import logger
from services.user_service import UserService
from webapp.fastapi.ws_manager import redis_listener, manager


# lifecycle
@asynccontextmanager
async def lifespan(app_fastapi: FastAPI):
    # стартуем redis_listener в фоне с авто-reconnect
    # loop = asyncio.get_event_loop()
    # app_fastapi.state._redis_task = loop.create_task(_run_redis_listener_with_retries())
    print("STARTED")
    yield
    # shutdown listener
    # app_fastapi.state._redis_task.cancel()
    # try:
    #     await app_fastapi.state._redis_task
    # except asyncio.CancelledError:
    #     pass

async def _run_redis_listener_with_retries():
    backoff = 0.5
    while True:
        try:
            await redis_listener()
        except asyncio.CancelledError:
            break
        except Exception as e:
            traceback.print_exc()
            # лог и экспоненциальный бэк-оф
            logger.error("redis_listener crashed, reconnecting...")
            await asyncio.sleep(backoff)
            backoff = min(backoff * 2, 10)


app_fastapi = FastAPI(lifespan=lifespan)
# (опционально) CORS, если нужен доступ из браузера
app_fastapi.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # ограничьте в prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# импорт роутеров — поправьте пути, если у вас структура другая
from webapp.fastapi.routers.character_router import router as character_router
from webapp.fastapi.routers.user_router import router as user_router
from webapp.fastapi.routers.training_router import router as training_router
from webapp.fastapi.routers.transfer_router import router as transfer_router
from webapp.fastapi.routers.payment_router import router as payment_router
from webapp.fastapi.routers.vip_router import router as vip_router
from webapp.fastapi.routers.stat_router import router as statistics_router
from webapp.fastapi.routers.education_centre_router import router as education_centre_router
from webapp.fastapi.routers.blitz_router import router as blitz_router

# регистрация роутеров
app_fastapi.include_router(character_router)
app_fastapi.include_router(user_router)
app_fastapi.include_router(training_router)
app_fastapi.include_router(transfer_router)
app_fastapi.include_router(payment_router)
app_fastapi.include_router(vip_router)
app_fastapi.include_router(statistics_router)
app_fastapi.include_router(education_centre_router)
app_fastapi.include_router(blitz_router)


@app_fastapi.get("/")
async def root():
    return {"message": "Hello World"}
@app_fastapi.websocket("/ws")
async def websocket_endpoint(ws: WebSocket, user_id: int = Query(None)):
    # Validate token and find user_id. В вашем проекте лучше проверять токен JWT или сессии.
    user = await UserService.get_user(user_id)  # реализуйте или используйте user_id param
    if not user:
        await ws.close(code=4401)
        return
    user_id = user.user_id

    await manager.connect(ws, user_id)
    try:
        while True:
            # Если вам не нужны входящие сообщения — можно await ws.receive_text() или await ws.receive_json()
            await ws.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(ws, user_id)
    except Exception:
        await manager.disconnect(ws, user_id)
