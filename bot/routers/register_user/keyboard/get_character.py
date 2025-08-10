from aiogram.utils.keyboard import InlineKeyboardBuilder


def get_first_character_keyboard():
     return (InlineKeyboardBuilder()
            .button(text = "Отримати першого гравця", callback_data="get_first_character")
            .adjust(1)
            .as_markup()
            )