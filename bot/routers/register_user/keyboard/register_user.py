from aiogram.types import InlineKeyboardMarkup, ReplyKeyboardMarkup

from aiogram.utils.keyboard import (
    InlineKeyboardBuilder,
    ReplyKeyboardBuilder
)

def create_team() -> ReplyKeyboardMarkup:
    return (
        ReplyKeyboardBuilder()
        .button(
            text="СТВОРИТИ КОМАНДУ"
        )
        .as_markup(resize_keyboard=True)
    )