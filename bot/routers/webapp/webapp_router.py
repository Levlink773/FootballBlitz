from aiogram import Router, F
from aiogram.types import Message, ReplyKeyboardMarkup, KeyboardButton, WebAppInfo

webapp_router = Router()

# обработка кнопки/текста "WebApp"
@webapp_router.message(F.text.regexp(r"(✅\s*)?WebApp(\s*✅)?"))
async def open_webapp(message: Message):
    kb = ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(
                    text="⚽ Открыть WebApp",
                    web_app=WebAppInfo(url="https://9cf1ce01667f.ngrok-free.app/")
                )
            ]
        ],
        resize_keyboard=True
    )

    await message.answer(
        "Открой свой WebApp 👇",
        reply_markup=kb
    )