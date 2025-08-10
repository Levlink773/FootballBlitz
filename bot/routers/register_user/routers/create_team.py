import asyncio

from aiogram import Router, F
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from bot.routers.register_user.config import (
    PHOTO_STAGE_REGISTER_USER,
    TEXT_STAGE_REGISTER_USER
)
from bot.routers.register_user.state.register_user_state import RegisterUserState
from database.models.user_bot import UserBot, STATUS_USER_REGISTER
from services.character_service import CharacterService
from services.user_service import UserService
from .get_first_character_router import get_first_character_handler

create_character_router = Router()


@create_character_router.message(
    F.text == "СТВОРИТИ КОМАНДУ"
)
async def start_command_handler(
        message: Message,
        state: FSMContext,
        user: UserBot,
):
    new_status = STATUS_USER_REGISTER.SEND_NAME_TEAM

    await UserService.edit_status_register(
        user_id=user.user_id,
        status=new_status
    )
    await message.answer_photo(
        caption=TEXT_STAGE_REGISTER_USER[new_status],
        photo=PHOTO_STAGE_REGISTER_USER[new_status],
    )

    await state.set_state(RegisterUserState.send_team_name)


@create_character_router.message(
    RegisterUserState.send_team_name
)
async def save_name_handler(
        message: Message,
        state: FSMContext,
        user: UserBot,
):
    character = await CharacterService.get_character(
        character_user_id=user.user_id
    )
    if character and user.team_name:
        return await message.answer(
            text="Ви вже маєте Команду!"
        )

    await state.update_data(
        name_character=message.text
    )
    await message.answer(
        text=f"🔹 <b>Тренер:</b> Запам’ятай, <b>{message.text}</b> — цю назву можуть скандувати тисячі фанатів, якщо ваша команда покаже, на що здатна! 🏆⚽"
    )
    await UserService.edit_team_name(user_id=user.user_id, team_name=message.text)
    await asyncio.sleep(1)
    await get_first_character_handler(message=message, user=user)
    return None
