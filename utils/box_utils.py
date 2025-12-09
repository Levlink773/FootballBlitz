import logging

from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

from database.models.types import TypeBox
from database.models.user_bot import STATUS_USER_REGISTER
from loader import bot
from services.user_service import UserService


async def give_scheduled_box(user_id: int, box_type: str = TypeBox.SMALL_BOX, time_box: str = '6'):
    """
    Функция для выдачи бокса планировщиком.
    """
    user = await UserService.get_user(user_id=user_id)
    if user.status_register != STATUS_USER_REGISTER.END_REGISTER:
        logging.error(f"User {user.user_id} give boxz no END_REGISTER")
        return
    try:
        # 1. Текст и логика в зависимости от типа бокса
        name_box = ""
        callback_data = ""


        if box_type == TypeBox.LARGE_BOX:
            await UserService.add_count_of_big_box(user_id, 1)
            name_box = "ВЕЛИКИЙ БОКС"
            callback_data = "open_box:large"  # Твой callback для открытия

        elif box_type == TypeBox.MEDIUM_BOX:
            await UserService.add_count_of_medium_box(user_id, 1)
            name_box = "Середній бокс"
            callback_data = "open_box:medium"

        elif box_type == TypeBox.SMALL_BOX:
            await UserService.add_count_of_small_box(user_id, 1)
            name_box = "Бокс новачка"
            callback_data = "open_box:small"

        # 2. Формируем клавиатуру
        markup = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="Відкрити 🗝️", callback_data=callback_data)]
        ])

        # 3. Текст сообщения
        text = (
            f"🎁 <b>Бонус за активність!</b>\n\n"
            f"Минуло {time_box} годин з моменту реєстрації.\n"
            f"Тобі нараховано: <b>{name_box}</b> 🔥"
        )

        # 4. Отправляем сообщение через бота
        await bot.send_message(
            chat_id=user_id,
            text=text,
            reply_markup=markup
        )

        logging.info(f"Scheduled box ({box_type}) sent to user {user_id}")

    except Exception as e:
        logging.error(f"Error sending scheduled box to {user_id}: {e}")