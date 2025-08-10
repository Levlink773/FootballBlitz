from aiogram import Router
from .routers.create_character import create_character_router
from .routers.get_first_character_router import get_first_character_router
from .routers.new_member_bonus import bonus_new_member_router
from .routers.open_reward_box import open_box_new_member_router

register_user_router = Router(name="register_user_router")

register_user_router.include_routers(
    create_character_router,
    get_first_character_router,
    bonus_new_member_router,
    open_box_new_member_router
)
