from aiogram.types import ReplyKeyboardRemove
from aiogram.utils.keyboard import ReplyKeyboardBuilder

from database.models.user_bot import UserBot, STATUS_USER_REGISTER

ALL_MAIN_BUTTONS = [
    "🧍‍♂️ Моя команда",
    "🏆 Турніри",
    "🏋️‍♂️ Тренування",
    "🧠 Учбовий центр",
    "⚡ Енергія / Баланс",
    "📊 Рейтинги",
    "🏟 Ринок трансферів",
    "👥 Вільні агенти",
    "🏬 Магазин",
    '🌐 WebApp',
    '⚙️ Налаштування'
]

AVAILABLE_BUTTONS_BY_STATUS = {
    STATUS_USER_REGISTER.END_REGISTER: ALL_MAIN_BUTTONS
}


def main_menu(user: UserBot):
    keyboard = ReplyKeyboardBuilder()
    available_buttons = AVAILABLE_BUTTONS_BY_STATUS.get(user.status_register, [])
    for button_text in ALL_MAIN_BUTTONS:
        if (button_text != '⚙️ Налаштування') and (not user.is_tg_mode):
            continue
        if button_text in available_buttons:
            final_text = button_text
        else:
            final_text = f"🔒 {button_text}"

        keyboard.button(text=final_text)

    return keyboard.adjust(2).as_markup(resize_keyboard=True)


def remove_keyboard():
    return ReplyKeyboardRemove(remove_keyboard=True)
