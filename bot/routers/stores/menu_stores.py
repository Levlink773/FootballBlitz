from aiogram import Router, F
from aiogram.types import Message, CallbackQuery

from bot.keyboards.magazine_keyboard import (
    menu_stores,
    select_box
)
from constants import (
    MAGAZINE_PHOTO,
    BOXES_PHOTO,
)
from database.models.user_bot import (
    UserBot
)

menu_magazine_router = Router()

@menu_magazine_router.message(
    F.text.regexp(r"(✅\s*)?🏬 Торговий квартал(\s*✅)?")
)
async def magazine_handler(
    message: Message,
    user: UserBot
):
    await message.answer_photo(
        photo=MAGAZINE_PHOTO, 
        caption=(
    "🏬 Ласкаво просимо до <b>Торгового кварталу!</b> "
    "Тут ви знайдете все необхідне: <b>речі, бокси та приємні пропозиції</b>\n"
    "Розпочніть свої покупки просто зараз!"
),
        reply_markup = menu_stores(user)
    )

@menu_magazine_router.callback_query(F.data == "store_boxes")
async def magazine_handler(query: CallbackQuery):
    
    await query.message.answer_photo(
        photo   = BOXES_PHOTO,
        caption = (
            "💥 Ласкаво просимо до магазину лутбоксів! 🎁⚽\n"
            "Тут на тебе чекають захопливі сюрпризи: відкривай бокси та "
            "отримуй монети, досвід і рідкісні футбольні нагороди! 🪙📈✨\n"
            "Грай, відкривай і ставай справжньою легендою! 🏆🔓"
            ), 
            reply_markup=select_box())

    
