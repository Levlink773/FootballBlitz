from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton, WebAppInfo

from database.models.user_bot import UserBot
from logging_config import logger
from webapp.fastapi.publisher import make_payload, publish_event

webapp_router = Router()

@webapp_router.message(Command("ws"))
async def ws(message: Message, user: UserBot):
    """
        Приймає запит від іншого сервісу (напр. Telegram-бота)
        і публікує подію в Redis для відправки через WebSocket.
        """
    logger.info(f"Received internal request to send WS message to user")
    # Створюємо payload для події
    event_payload = make_payload(
        event_type="show_alert",
        user_id=user.user_id,
        payload={
            "message": f"Привіт, {user.user_name}! Це тестове повідомлення з Telegram. 👋"
        }
    )

    # Публікуємо подію в Redis
    success = await publish_event(event_payload)

    if not success:
        await message.answer("НЕ УСПЕШНО")
        return
    await message.answer(f"Event event type published for user_id {user.user_id}")


# обработка кнопки/текста "WebApp"
@webapp_router.message(F.text.regexp(r"(✅\s*)?WebApp(\s*✅)?"))
async def open_webapp(message: Message):
    kb = ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(
                    text="⚽ Открыть WebApp",
                    web_app=WebAppInfo(url=f"https://football-blitz.online/?user_id={message.from_user.id}")
                )
            ]
        ],
        resize_keyboard=True
    )

    await message.answer(
        "Открой свой WebApp 👇",
        reply_markup=kb
    )