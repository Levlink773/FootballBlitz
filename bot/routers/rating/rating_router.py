from aiogram import Router, F
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery, FSInputFile
from aiogram.utils.keyboard import InlineKeyboardBuilder

from constants import RATING
from database.models.character import Character
from services.character_service import CharacterService

rating_router = Router()

ITEMS_PER_PAGE = 10

INFO_TEXT = (
    "🏆 <b>Тижневий рейтинг гравців</b>\n\n"
    "📊 Рейтинг формується за результатами <b>Blitz-турнірів</b>:\n"
    "🥇 1 місце — +3 очки рейтингу\n"
    "🥈 2 місце — +2 очки рейтингу\n"
    "⚔️ Півфіналісти — +1 очко рейтингу\n\n"
    "🔄 Щонеділі о 23:30 рейтинг <b>обнуляється</b>, а перші 10 гравців отримують нагороди:\n\n"
    "📌 Таблиця нагородження:\n"
    "🥇 1 місце — 600 💰, 500 ⚡\n"
    "🥈 2 місце — 500 💰, 400 ⚡\n"
    "🥉 3 місце — 400 💰, 300 ⚡\n"
    "4 місце — 300 💰, 200 ⚡\n"
    "5 місце — 200 💰, 100 ⚡\n"
    "6 місце — 160 💰, 80 ⚡\n"
    "7 місце — 140 💰, 70 ⚡\n"
    "8 місце — 120 💰, 60 ⚡\n"
    "9 місце — 100 💰, 50 ⚡\n"
    "10 місце — 80 💰, 40 ⚡\n\n"
    "Грай активно, щоб піднятися вище у таблиці та здобути цінні нагороди!"
)

def get_medal_emoji(rank: int) -> str:
    return {1: "🥇", 2: "🥈", 3: "🥉"}.get(rank, "🔸")

def build_rating_text(characters: list[Character], page: int) -> str:
    start = (page - 1) * ITEMS_PER_PAGE
    end = start + ITEMS_PER_PAGE
    page_chars = characters[start:end]

    lines = []
    for i, character in enumerate(page_chars, start=start + 1):
        medal = get_medal_emoji(i)
        team_name = character.owner.team_name or "Без команди"
        lines.append(f"{medal} {i}. {character.name} ({team_name}) — {character.points} очок")

    return "\n".join(lines)

def build_pagination_keyboard(page: int, total_pages: int) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    print("Total pages: ", total_pages)
    builder.row(InlineKeyboardButton(text="ℹ️ Інформація про рейтинг", callback_data="rating_info"))
    if page > 1:
        builder.row(InlineKeyboardButton(text="⬅️", callback_data=f"rating_page:{page-1}"))
    if page < total_pages:
        builder.row(InlineKeyboardButton(text="➡️", callback_data=f"rating_page:{page+1}"))

    return builder.as_markup()

@rating_router.message(F.text.regexp(r"(✅\s*)?📊 Рейтинги(\s*✅)?"))
async def show_ratings(message: Message):
    characters = await CharacterService.get_all_characters()
    characters = [ch for ch in characters if ch.owner]
    if not characters:
        await message.answer("Рейтинги поки недоступні.")
        return

    sorted_characters = sorted(characters, key=lambda c: c.points, reverse=True)
    total_pages = (len(sorted_characters) + ITEMS_PER_PAGE - 1) // ITEMS_PER_PAGE

    text = build_rating_text(sorted_characters, page=1)
    keyboard = build_pagination_keyboard(page=1, total_pages=total_pages)

    await message.answer_photo(photo=RATING, caption=text, reply_markup=keyboard)

@rating_router.callback_query(F.data.startswith("rating_page:"))
async def rating_pagination_handler(callback: CallbackQuery):
    page = int(callback.data.split(":")[1])
    characters = await CharacterService.get_all_characters()
    characters = [ch for ch in characters if ch.owner]
    if not characters:
        await callback.answer("Рейтинги поки недоступні.", show_alert=True)
        return

    sorted_characters = sorted(characters, key=lambda c: c.points, reverse=True)
    total_pages = (len(sorted_characters) + ITEMS_PER_PAGE - 1) // ITEMS_PER_PAGE

    if page < 1 or page > total_pages:
        await callback.answer("Невірна сторінка.", show_alert=True)
        return

    text = build_rating_text(sorted_characters, page)
    keyboard = build_pagination_keyboard(page, total_pages)

    await callback.message.edit_caption(caption=text, reply_markup=keyboard)
    await callback.answer()

@rating_router.callback_query(F.data == "rating_info")
async def rating_info_handler(callback: CallbackQuery):
    # показываем текст с информацией и кнопку "Назад"
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="⬅️ Назад", callback_data="rating_page:1")]
        ]
    )
    await callback.answer()
    await callback.message.edit_caption(caption=INFO_TEXT, reply_markup=keyboard)
