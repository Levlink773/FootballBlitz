from aiogram.types import InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder

from bot.routers.register_user.callbacks.create_character_callbacks import (
    SelectGender,
)

from config import Gender

def set_gender_keyboard() -> InlineKeyboardMarkup:
    return (InlineKeyboardBuilder()
            .button(text = "👨🏼‍🦱 Чоловік", callback_data = SelectGender(gender=Gender.MAN))
            .button(text = "👩🏼‍🦰 Жінка", callback_data = SelectGender(gender=Gender.WOMAN))
            .adjust(1)
            .as_markup()
            )

