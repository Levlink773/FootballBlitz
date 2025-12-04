import asyncio

import uvicorn
from aiohttp import web

from blitz.blitz_match.core.redis_manager import TeamBlitzMatchManager
from config import WEBAPP_HOST, WEBAPP_PORT, CALLBACK_URL_WEBHOOK_BOX_BLITZ, CALLBACK_URL_WEBHOOK_ENERGY_BLITZ, \
    CALLBACK_URL_WEBHOOK_VIP_PASS_BLITZ, CALLBACK_URL_WEBHOOK_MONEY_BLITZ
from loader import bot, dp, app
from bot.routers.router import main_router
from bot.middlewares import handlers
from load_utils import start_utils
from services.user_service import UserService
from webapp.fastapi.app import app_fastapi
from webhook_api.handlers.box_handler import MonoResultBox
from webhook_api.handlers.energy_handler import MonoResultEnergy
from webhook_api.handlers.money_handler import MonoResultMoney
from webhook_api.handlers.vip_pass_handler import MonoResultVipPass

dp.include_router(main_router)

async def start_weebhook():
    add_patch_payments()
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, WEBAPP_HOST, WEBAPP_PORT)
    await site.start()

async def start_fastapi():
    config = uvicorn.Config(app_fastapi, host="0.0.0.0", port=8123, loop="asyncio")
    server = uvicorn.Server(config)
    await server.serve()

def add_patch_payments():
    app.router.add_post("/" + CALLBACK_URL_WEBHOOK_ENERGY_BLITZ.split("/")[-1], MonoResultEnergy.router)
    app.router.add_post("/" + CALLBACK_URL_WEBHOOK_BOX_BLITZ.split("/")[-1], MonoResultBox.router)
    app.router.add_post("/" + CALLBACK_URL_WEBHOOK_VIP_PASS_BLITZ.split("/")[-1], MonoResultVipPass.router)
    app.router.add_post("/" + CALLBACK_URL_WEBHOOK_MONEY_BLITZ.split("/")[-1], MonoResultMoney.router)

async def start_polling():
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)


async def main():
    await start_utils()
    await TeamBlitzMatchManager.clear_matches()
    await UserService.delete_all_bots()
    await asyncio.gather(
        start_polling(),
        start_weebhook(),
        start_fastapi()
    )


if __name__ == "__main__":
    asyncio.run(main())

"""
venv\Scripts\activate
alembic revision --autogenerate -m "add new realship to Item"
alembic upgrade head
"""