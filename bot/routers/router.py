from aiogram import Router

from .blitz.router import blitz_router
from .commands.router import commands_router
from .character.router import character_router
from .gym.router import gym_main_router
from .communication.router import communication_main_router
from .commands.admins_functional.newsletter import admin_newsletter_commands
from .commands.admins_functional.info_new_members import admin_info_new_member_router
from bot.training.routers.answer_stage import answer_etap_router
from bot.training.routers.joined_in_training import join_trainig_router
from bot.training.routers.qte_stage import qte_router
from bot.training.routers.end_training import end_training_router
from bot.training.routers.buy_training_key import buy_training_key_router
from bot.training.routers.duel_stage import training_duel_router
from bot.routers.register_user.router import register_user_router
from .commands.block_users import block_uses_router
from .resources_router.routers import user_balance_router

main_router = Router()
main_router.include_routers(
    block_uses_router,
    commands_router,
    register_user_router,
    character_router,
    gym_main_router,
    blitz_router, # blitz_router
    communication_main_router,
    admin_newsletter_commands,
    admin_info_new_member_router,
    join_trainig_router,
    answer_etap_router,
    qte_router,
    end_training_router,
    buy_training_key_router,
    training_duel_router,
    user_balance_router,
)
