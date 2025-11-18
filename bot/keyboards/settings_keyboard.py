from aiogram.types import ReplyKeyboardMarkup
from aiogram.types import ReplyKeyboardMarkup
from aiogram.utils.keyboard import ReplyKeyboardBuilder

from database.models.user_bot import UserBot


def get_settings_keyboard(user: UserBot) -> ReplyKeyboardMarkup:
    """
    Генерирует Reply-клавиатуру настроек на основе состояния UserBot.
    """
    builder = ReplyKeyboardBuilder()

    # 1. Кнопка "Телеграм мод"
    tg_mode_text = (
        "Увімкнути клавіатуру ✅" if user.is_tg_mode
        else "Вимкнути клавіатуру ❌"
    )
    builder.button(text=tg_mode_text)

    # 2. Кнопка "Оповещения"
    spam_text = (
        "Увімкнути повідомлення ✅" if user.disable_spam
        else "Вимкнути повідомлення ❌"
    )
    builder.button(text=spam_text)

    # 3. Кнопка "Головна площа"
    builder.button(text="⬅️ Головна площа")

    # Выстраиваем кнопки в один столбец
    builder.adjust(1)

    # Добавляем resize_keyboard=True, чтобы клавиатура была компактной
    return builder.as_markup(resize_keyboard=True)