from aiogram import Router

from .get_new_character import get_new_character_router
from .menu_character import menu_character_router

character_router = Router()
character_router.include_routers(
    menu_character_router,
    get_new_character_router,
)
