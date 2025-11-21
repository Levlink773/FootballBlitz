from aiogram import Router, F, types

from bot.keyboards.settings_keyboard import get_settings_keyboard
from services.user_service import UserService

# from app.handlers.main_menu import show_main_menu # <-- Імпорт функції головного меню (розкоментуйте, якщо потрібно)

settings_router = Router()


# --- 1. Вхід у меню налаштувань за текстом "Налаштування" ---
@settings_router.message(F.text == '⚙️ Налаштування')
async def show_settings_menu(message: types.Message):
    user = await UserService.get_user(message.from_user.id)

    if not user:
        await message.answer("Не вдалося знайти ваші дані. Спробуйте /start")
        return

    await message.answer(
        "⚙️ <b>Налаштування</b> \n\n"
        "Виберіть опцію на клавіатурі:",
        reply_markup=get_settings_keyboard(user)
    )


# --- 2. Обробка натискань на Reply-кнопки ---

# Ловимо ОБИДВА варіанти тексту для кнопки "Телеграм мод"
@settings_router.message(F.text.in_({"Увімкнути клавіатуру ✅", "Вимкнути клавіатуру ❌"}))
async def handle_toggle_tg_mode(message: types.Message):
    user_id = message.from_user.id
    user = await UserService.get_user(user_id)
    if not user:
        await message.answer("Помилка! Користувача не знайдено.")
        return

    # Інвертуємо значення
    # Якщо було True (увімкнено), стане False (вимкнено) і навпаки.
    new_status = not user.is_tg_mode

    # Зберігаємо новий статус у БД
    await UserService.set_tg_mode(user_id, new_status)

    # Отримуємо оновленого користувача, щоб згенерувати нову клавіатуру
    updated_user = await UserService.get_user(user_id)

    # Формуємо текст повідомлення про зміну статусу
    # Якщо new_status == True -> Ми тільки що УВІМКНУЛИ режим.
    status_text = 'УВІМКНЕНО ✅' if new_status else 'ВИМКНЕНО ❌'

    # Відправляємо відповідь І ВІДРАЗУ Ж оновлену клавіатуру
    # Клавіатура згенерується на основі updated_user.
    # Якщо new_status == True (увімкнено), функція get_settings_keyboard побачить is_tg_mode=True
    # і створить кнопку "Вимкнути клавіатуру ❌" (дія для наступного натискання).
    await message.answer(
        f"Клавіатура: {status_text}",
        reply_markup=get_settings_keyboard(updated_user)
    )


# Ловимо ОБИДВА варіанти тексту для кнопки "Оповіщення"
@settings_router.message(F.text.in_({"Увімкнути повідомлення ✅", "Вимкнути повідомлення ❌"}))
async def handle_toggle_spam(message: types.Message):
    user_id = message.from_user.id
    user = await UserService.get_user(user_id)
    if not user:
        await message.answer("Помилка! Користувача не знайдено.")
        return

    # Інвертуємо значення disable_spam
    # Якщо disable_spam було True (повідомлення вимкнені), стане False (повідомлення увімкнені).
    new_disable_status = not user.disable_spam

    await UserService.set_disable_spam(user_id, new_disable_status)

    updated_user = await UserService.get_user(user_id)

    # Логіка тексту статусу:
    # Якщо new_disable_status == True (ми вимкнули спам) -> Статус "ВИМКНЕНО ❌"
    # Якщо new_disable_status == False (ми дозволили спам) -> Статус "УВІМКНЕНО ✅"
    status_text = 'ВИМКНЕНО ❌' if new_disable_status else 'УВІМКНЕНО ✅'

    # Логіка клавіатури (в get_settings_keyboard):
    # Якщо user.disable_spam == True (зараз вимкнено) -> Кнопка "Увімкнути повідомлення ✅"
    # Якщо user.disable_spam == False (зараз увімкнено) -> Кнопка "Вимкнути повідомлення ❌"

    await message.answer(
        f"Оповіщення: {status_text}",
        reply_markup=get_settings_keyboard(updated_user)
    )