from aiogram import Router, F
from aiogram.fsm.context import FSMContext
from aiogram.types import Message

from database.models.user_bot import UserBot

balance_router = Router()


@balance_router.message(F.text == '⚡ Енергія / Баланс')
async def start_command_handler(
        message: Message,
        user: UserBot,
):
    text = (
        f"💰 <b>Баланс</b>: {user.money} монет\n"
        f"⚡ <b>Енергія</b>: {user.energy} ед.\n\n"
    )
    await message.answer(text, parse_mode="HTML")