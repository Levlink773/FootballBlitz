from aiogram import Router
from .routers.create_team import create_character_router
from .routers.get_first_character_router import get_first_character_router

register_user_router = Router(name="register_user_router")

register_user_router.include_routers(
    create_character_router,
    get_first_character_router,
)
