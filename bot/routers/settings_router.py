from aiogram import Router, F, types

from bot.keyboards.settings_keyboard import get_settings_keyboard
from services.user_service import UserService

# from app.handlers.main_menu import show_main_menu # <-- Импорт функции главного меню

settings_router = Router()


# --- 1. Вход в меню настроек по тексту "Налаштування" ---
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


# --- 2. Обработка нажатий на Reply-кнопки ---

# Ловим ОБА варианта текста для кнопки "Телеграм мод"
@settings_router.message(F.text.in_({"Увімкнути клавіатуру ✅", "Вимкнути клавіатуру ❌"}))
async def handle_toggle_tg_mode(message: types.Message):
    user_id = message.from_user.id
    user = await UserService.get_user(user_id)
    if not user:
        await message.answer("Помилка! Користувача не знайдено.")
        return

    # Инвертируем значение
    new_status = not user.is_tg_mode
    await UserService.set_tg_mode(user_id, new_status)

    # Получаем обновленного юзера, чтобы сгенерировать новую клавиатуру
    updated_user = await UserService.get_user(user_id)

    status_text = 'УВІМКНЕНО ✅' if new_status else 'ВИМКНЕНО ❌'

    # Отправляем ответ И СРАЗУ ЖЕ обновленную клавиатуру
    await message.answer(
        f"Клавіатура: {status_text}",
        reply_markup=get_settings_keyboard(updated_user)
    )


# Ловим ОБА варианта текста для кнопки "Оповещения"
@settings_router.message(F.text.in_({"Увімкнути повідомлення ✅", "Вимкнути повідомлення ❌"}))
async def handle_toggle_spam(message: types.Message):
    user_id = message.from_user.id
    user = await UserService.get_user(user_id)
    if not user:
        await message.answer("Помилка! Користувача не знайдено.")
        return

    # Инвертируем значение
    new_status = not user.disable_spam
    await UserService.set_disable_spam(user_id, new_status)

    updated_user = await UserService.get_user(user_id)

    # Текст ответа тоже инвертирован
    status_text = 'УВІМКНЕНО ✅' if not new_status else 'ВИМКНЕНО ❌'

    await message.answer(
        f"Оповіщення: {status_text}",
        reply_markup=get_settings_keyboard(updated_user)
    )