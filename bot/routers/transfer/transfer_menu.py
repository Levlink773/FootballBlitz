from aiogram import Router, types, F
from aiogram.utils.keyboard import ReplyKeyboardBuilder

from constants import TRANSFER

transfer_menu_router = Router()

# === Главное меню рынка ===
@transfer_menu_router.message(F.text == "🏟 Ринок трансферів")
async def show_market_menu(message: types.Message):
    kb = ReplyKeyboardBuilder()
    kb.button(text="📊 Ринок трансферів")
    kb.button(text="👥 Вільні агенти")
    kb.button(text="⬅️ Головна площа")
    kb.adjust(1)

    await message.answer_photo(
        photo=TRANSFER,
        caption="Оберіть потрібний ринок:",
        reply_markup=kb.as_markup()
    )