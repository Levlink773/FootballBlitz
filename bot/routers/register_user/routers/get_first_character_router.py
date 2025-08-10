from typing import Optional

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, InputMediaPhoto
from aiogram.fsm.context import FSMContext

from bot.routers.register_user.config import (
    PHOTO_STAGE_REGISTER_USER,
    TEXT_STAGE_REGISTER_USER
)
from bot.routers.register_user.keyboard.get_character import get_first_character_keyboard

from database.models.user_bot import UserBot, STATUS_USER_REGISTER
from services.user_service import UserService

get_first_character_router = Router()


async def get_first_character_handler(
        user: UserBot,
        query: Optional[CallbackQuery] = None,
        message: Optional[Message] = None
):
    new_status = STATUS_USER_REGISTER.GET_FIRST_CHARACTER
    await UserService.edit_status_register(
        user_id=user.user_id,
        status=new_status
    )
    if query:
        return await query.message.edit_media(
            media=InputMediaPhoto(
                media=PHOTO_STAGE_REGISTER_USER[new_status],
                caption=TEXT_STAGE_REGISTER_USER[new_status]
            ),
            reply_markup=get_first_character_keyboard()
        )

    await message.answer_photo(
        caption=TEXT_STAGE_REGISTER_USER[new_status],
        photo=PHOTO_STAGE_REGISTER_USER[new_status],
        reply_markup=get_first_character_keyboard()
    )


@get_first_character_router.callback_query(
    F.data == 'get_first_character'
)
async def approved_position_handler(
        query: CallbackQuery,
        state: FSMContext,
        user: UserBot
):
    if user.main_character:
        await query.answer("У вас уже есть стартовий персонаж!")
    new_status = STATUS_USER_REGISTER.END_REGISTER
    await UserService.edit_status_register(
        user_id=user.user_id,
        status=new_status
    )
    await query.message.edit_media(
        media=InputMediaPhoto(
            media=PHOTO_STAGE_REGISTER_USER[new_status],
            caption=TEXT_STAGE_REGISTER_USER[new_status]
        ),
        reply_markup=select_role_character(callback_data.gender)
    )
