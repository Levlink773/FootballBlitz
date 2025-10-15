from aiogram import Router, F
from aiogram.types import Message, FSInputFile, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

from constants import BALANCE
from database.models.user_bot import UserBot

balance_router = Router()


@balance_router.message(F.text.regexp(r"(✅\s*)?⚡ Енергія / Баланс(\s*✅)?"))
async def start_command_handler(
        message: Message,
        user: UserBot,
):
    text = (
        "💰 <b>Ваш баланс та енергія</b>\n\n"
        f"💵 <b>Монети</b>: {user.money}\n"
        "Монети використовуються для покупки нових футболістів "
        "та, в майбутньому, для придбання предметів у магазині.\n\n"
        f"⚡ <b>Енергія</b>: {user.energy}\n"
        "Енергія потрібна для тренувань та участі в турнірах.\n"
        "Щодня о <b>01:00</b> нараховується 200 енергії (максимум)\n\n"
        "📌 Додатково енергію можна заробити у турнірах або "
        "виконуючи завдання в Учбовому центрі."
    )
    await message.answer_photo(photo=BALANCE, caption=text, reply_markup=InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="⚽ Увійти у Додаток",
                        web_app=WebAppInfo(
                            url=f"https://football-blitz.online/?user_id={user.user_id}")
                    )
                ]
            ]
        ), parse_mode="HTML")