from aiogram import Router
from .gym_handler import gym_router
from .education_center import education_center_router
from .traning_base_menu import training_base_router

gym_main_router = Router()
gym_main_router.include_routers(
    gym_router,
    education_center_router,
    training_base_router
)