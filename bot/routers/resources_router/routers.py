from aiogram import Router

from bot.routers.resources_router.balance_router import balance_router

user_balance_router = Router(name="user_balance_router")

user_balance_router.include_routers(
    balance_router,
)