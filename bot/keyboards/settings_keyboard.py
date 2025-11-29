from aiogram.types import ReplyKeyboardMarkup
from aiogram.utils.keyboard import ReplyKeyboardBuilder

from database.models.user_bot import UserBot, STATUS_USER_REGISTER


def get_settings_keyboard(user: UserBot) -> ReplyKeyboardMarkup:
    """
    Генерує Reply-клавіатуру налаштувань на основі стану UserBot.
    """
    builder = ReplyKeyboardBuilder()

    # --- ЛОГИКА БЛОКИРОВКИ ---
    # Проверяем статус пользователя.
    # Если регистрация не закончена (status != "END_REGISTER"), добавляем замочек.
    if user.status_register != STATUS_USER_REGISTER.END_REGISTER:
        prefix = "🔒 "
    else:
        prefix = ""

    # 1. Кнопка "Телеграм мод"
    if user.is_tg_mode:
        tg_mode_text = "Вимкнути клавіатуру ❌"
    else:
        tg_mode_text = "Увімкнути клавіатуру ✅"

    # Добавляем кнопку с учетом префикса
    builder.button(text=f"{prefix}{tg_mode_text}")

    # 2. Кнопка "Оповіщення"
    if user.disable_spam:
        spam_text = "Увімкнути повідомлення ✅"
    else:
        spam_text = "Вимкнути повідомлення ❌"

    # Добавляем кнопку с учетом префикса
    builder.button(text=f"{prefix}{spam_text}")

    # 3. Кнопка "Головна площа"
    # К кнопке выхода/навигации обычно замок не добавляют, чтобы человек мог выйти,
    # но если нужно и сюда — просто добавьте prefix в f-строку.
    builder.button(text="⬅️ Головна площа")

    # Вибудовуємо кнопки в один стовпчик
    builder.adjust(1)

    # Додаємо resize_keyboard=True, щоб клавіатура була компактною
    return builder.as_markup(resize_keyboard=True)