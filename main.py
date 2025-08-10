import asyncio

from loader import bot, dp
from bot.routers.router import main_router
from bot.middlewares import handlers
from load_utils import start_utils

dp.include_router(main_router)


async def start_polling():
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)


async def main():
    await start_utils()
    await asyncio.gather(
        start_polling()
    )


if __name__ == "__main__":
    asyncio.run(main())

"""
alembic revision --autogenerate -m "add new realship to Item"
alembic upgrade head
"""