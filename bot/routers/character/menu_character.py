from aiogram import Router, F
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from constants import get_photo_character
from database.models.character import Character
from utils.character_utils import get_character_text

menu_character_router = Router()

@menu_character_router.message(
    F.text.regexp(r"(✅\s*)?🏃‍♂️ Мій футболіст(\s*✅)?")
)
async def get_my_character(message: Message, state: FSMContext, character: Character):

    await state.clear()
    await message.answer_photo(
        photo=get_photo_character(character),
        caption=get_character_text(character),
        reply_markup=character_keyboard()
    )