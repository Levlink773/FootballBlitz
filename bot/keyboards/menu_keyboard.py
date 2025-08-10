from aiogram.utils.keyboard import ReplyKeyboardBuilder, InlineKeyboardBuilder
from aiogram.types import ReplyKeyboardRemove

from database.models.user_bot import UserBot, STATUS_USER_REGISTER

from constants import date_is_get_reward_christmas_tree

from ..callbacks.menu_callbacks import NextInstruction

ALL_MAIN_BUTTONS = [
    "🧍‍♂️ Моя команда",
    "🏆 Турніри",
    "🏋️‍♂️ Тренування",
    "🧠 Учбовий центр",
    "⚡ Енергія / Баланс",
    "📊 Рейтинги",
]

AVAILABLE_BUTTONS_BY_STATUS = {
    STATUS_USER_REGISTER.END_REGISTER: ALL_MAIN_BUTTONS
}

def main_menu(user: UserBot):
    keyboard = ReplyKeyboardBuilder()
    if not user.characters:
        keyboard.button(text="⚽️ Створити персонажа")
    else:
        available_buttons = AVAILABLE_BUTTONS_BY_STATUS.get(user.status_register, [])
        for button_text in ALL_MAIN_BUTTONS:
            if button_text in available_buttons:
                if user.status_register != STATUS_USER_REGISTER.END_TRAINING:
                    final_text = f"✅ {button_text} ✅"
                else:
                    final_text = button_text
            else:
                final_text = f"🔒 {button_text}"

            keyboard.button(text=final_text)

    return keyboard.adjust(2).as_markup(resize_keyboard=True)
        
def menu_instruction(index_instruction: int):
    return (InlineKeyboardBuilder()
            .button(text = "➡️ Далі", callback_data=NextInstruction(index_instruction=index_instruction))
            .as_markup()
            )
    
def remove_keyboard():
    return ReplyKeyboardRemove(remove_keyboard=True)
