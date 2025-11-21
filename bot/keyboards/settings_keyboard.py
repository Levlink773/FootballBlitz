from aiogram.types import ReplyKeyboardMarkup
from aiogram.utils.keyboard import ReplyKeyboardBuilder

from database.models.user_bot import UserBot


def get_settings_keyboard(user: UserBot) -> ReplyKeyboardMarkup:
    """
    Генерує Reply-клавіатуру налаштувань на основі стану UserBot.
    """
    builder = ReplyKeyboardBuilder()

    # 1. Кнопка "Телеграм мод"
    # Логіка: Якщо user.is_tg_mode == True, значить режим УВІМКНЕНО.
    # Ми хочемо показати поточний статус або дію.
    # Зазвичай на кнопці пишуть дію: "Вимкнути", якщо зараз увімкнено.
    # Але у вашому прикладі логіка була: "Увімкнути... ✅", якщо is_tg_mode=True.
    # Це виглядає як відображення статусу, а не дії.
    # Давайте зробимо так:
    # Якщо is_tg_mode == True -> Кнопка "Вимкнути клавіатуру ❌"
    # Якщо is_tg_mode == False -> Кнопка "Увімкнути клавіатуру ✅"

    if user.is_tg_mode:
        tg_mode_text = "Вимкнути клавіатуру ❌"
    else:
        tg_mode_text = "Увімкнути клавіатуру ✅"

    builder.button(text=tg_mode_text)

    # 2. Кнопка "Оповіщення"
    # Логіка: disable_spam == True означає, що спам ВИМКНЕНО (оповіщення не приходять).
    # Отже, якщо disable_spam == True -> ми хочемо їх УВІМКНУТИ.
    # Текст кнопки: "Увімкнути повідомлення ✅"

    # Якщо disable_spam == False (оповіщення приходять) -> ми хочемо їх ВИМКНУТИ.
    # Текст кнопки: "Вимкнути повідомлення ❌"

    if user.disable_spam:
        spam_text = "Увімкнути повідомлення ✅"
    else:
        spam_text = "Вимкнути повідомлення ❌"

    builder.button(text=spam_text)

    # 3. Кнопка "Головна площа"
    builder.button(text="⬅️ Головна площа")

    # Вибудовуємо кнопки в один стовпчик
    builder.adjust(1)

    # Додаємо resize_keyboard=True, щоб клавіатура була компактною
    return builder.as_markup(resize_keyboard=True)