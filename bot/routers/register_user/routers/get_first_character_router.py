import asyncio
from typing import Optional

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, InputMediaPhoto

from bot.keyboards.menu_keyboard import main_menu
from bot.routers.register_user.config import (
    PHOTO_STAGE_REGISTER_USER,
    TEXT_STAGE_REGISTER_USER
)
from bot.routers.register_user.keyboard.get_character import get_first_character_keyboard
from constants import get_photo_character
from database.models.user_bot import UserBot, STATUS_USER_REGISTER
from services.character_service import CharacterService
from services.reminder_character_service import RemniderCharacterService
from services.user_service import UserService
from utils.generate_character import get_character, CharacterData, character_created_message

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
        user: UserBot
):
    new_status = STATUS_USER_REGISTER.END_REGISTER
    await UserService.edit_status_register(
        user_id=user.user_id,
        status=new_status
    )
    if user.main_character:
        await query.answer("🌟 У вас уже є стартовий персонаж! 🎯", show_alert=True)
        await query.message.edit_media(
            media=InputMediaPhoto(
                media=PHOTO_STAGE_REGISTER_USER[new_status],
                caption=TEXT_STAGE_REGISTER_USER[new_status]
            ),
        )
        await query.message.answer(
            "🌟 У вас уже є стартовий персонаж! 🎯\n"
            "Дбайте про нього та ведіть його до перемог! 🏆🔥",
            reply_markup=main_menu(user)
        )
    character_data: CharacterData = await get_character()
    character = await CharacterService.create_character(character_data, user.user_id)
    await RemniderCharacterService.create_character_reminder(character_id=character.id)
    text = character_created_message(character_data)
    await query.message.edit_media(
        media=InputMediaPhoto(
            media=get_photo_character(character),
            caption=text
        )
    )
    await asyncio.sleep(2)
    user = await UserService.assign_main_character_if_none(user.user_id)
    await query.message.answer(
        text=TEXT_STAGE_REGISTER_USER[new_status],
        reply_markup=main_menu(user)
    )
    await UserService.add_energy_user(user.user_id, 200)
    end_register_text = '''
🎉 Вітаємо! Ви успішно пройшли реєстрацію та отримуєте +200⚡ енергії!
Тепер вперед — досліджуйте світ Football Blitz ⚽, тренуйтеся, змагайтеся та відкривайте для себе нові можливості! 🚀
    '''
    await query.message.answer(end_register_text)
