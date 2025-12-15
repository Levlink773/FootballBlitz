from aiogram import Router
from aiogram.filters.callback_data import CallbackData
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from database.models.user_bot import BlitzActive, UserBot


# 1. Створюємо фабрику колбеків
class BlitzModeCallback(CallbackData, prefix="set_blitz"):
    mode: str


# 2. Функція для створення клавіатури налаштувань
def get_blitz_settings_keyboard(current_mode: BlitzActive) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()

    # Описи режимів для кнопок
    mode_descriptions = {
        BlitzActive.ACTIVE: "🟢 Активний",
        BlitzActive.SIMPLE: "🟡 Звичайний",
        BlitzActive.WEAK: "🟠 Слабкий",
        BlitzActive.DISABLED: "🔴 Вимкнено",
    }

    for mode in BlitzActive:
        # Додаємо галочку ✅ до поточного обраного режиму
        text = mode_descriptions.get(mode, mode.value)
        if mode == current_mode:
            text = f"✅ {text}"

        builder.button(
            text=text,
            callback_data=BlitzModeCallback(mode=mode.name)
        )

    builder.adjust(1)  # Кнопки в один стовпчик
    return builder.as_markup()



router = Router()


@router.callback_query(BlitzModeCallback.filter())
async def change_blitz_mode_handler(
        query: CallbackQuery,
        callback_data: BlitzModeCallback,
        session: AsyncSession
):
    """
    Обробляє зміну статусу BlitzActive.
    """

    # 1. Отримуємо новий статус з callback_data (конвертуємо рядок в Enum)
    new_mode = BlitzActive[callback_data.mode]

    # 2. Оновлюємо запис в базі даних
    # Використовуємо update для ефективності (не треба робити select)
    stmt = (
        update(UserBot)
        .where(UserBot.user_id == query.from_user.id)
        .values(blitz_mode=new_mode)
    )

    await session.execute(stmt)
    await session.commit()

    # 3. Формуємо текст повідомлення для алерту
    alert_texts = {
        BlitzActive.ACTIVE: "Режим змінено на АКТИВНИЙ! 🚀",
        BlitzActive.SIMPLE: "Режим змінено на ЗВИЧАЙНИЙ. 👌",
        BlitzActive.WEAK: "Режим змінено на СЛАБКИЙ. 🐢",
        BlitzActive.DISABLED: "Бліц-режим вимкнено. 💤",
    }
    response_text = alert_texts.get(new_mode, "Статус успішно змінено!")

    # 4. Відправляємо Alert (спливаюче вікно)
    await query.answer(
        text=response_text,
        show_alert=True
    )

    # (Опціонально) Оновлюємо клавіатуру, щоб переставити галочку ✅
    try:
        new_keyboard = get_blitz_settings_keyboard(current_mode=new_mode)
        if query.message.reply_markup != new_keyboard:
            await query.message.edit_reply_markup(reply_markup=new_keyboard)
    except Exception:
        # Ігноруємо помилки, якщо повідомлення застаріло або не змінилося
        pass