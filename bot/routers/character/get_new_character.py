from aiogram import Router, F
from aiogram.types import CallbackQuery, InputMediaPhoto, Message

from constants import get_photo_character
from database.models.user_bot import UserBot
from services.character_service import CharacterService
from services.reminder_character_service import RemniderCharacterService
from services.user_service import UserService
from utils.generate_character import CharacterData, get_character, character_created_message

get_new_character_router = Router()


@get_new_character_router.message(F.text == "Get Random Character")
async def approved_position_handler(
        message: Message,
        user: UserBot
):
    if (len(user.characters) == 1 and not user.vip_pass_is_active) or (
            user.vip_pass_is_active and len(user.characters) >= 2):
        await message.answer("🌟 У вас уже є максимум персонажів! 🎯", show_alert=True)
        return
    character_data: CharacterData = await get_character()
    character = await CharacterService.create_character(character_data, user.user_id)
    await RemniderCharacterService.create_character_reminder(character_id=character.id)
    text = character_created_message(character_data)
    await message.answer_photo(
        photo=get_photo_character(character),
        caption=text
    )
    await UserService.assign_main_character_if_none(user.user_id)
