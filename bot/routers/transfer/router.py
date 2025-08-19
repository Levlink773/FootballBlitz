from aiogram import Router

from bot.routers.transfer.transfer_character_router import transfer_transfer_router
from bot.routers.transfer.transfer_free_agent import free_agents_router

transfer_router = Router()
transfer_router.include_routers(
    free_agents_router,
    transfer_transfer_router
)
