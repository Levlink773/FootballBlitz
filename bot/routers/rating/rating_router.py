from aiogram import Router, F
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery, FSInputFile

from constants import RATING
from database.models.character import Character
from services.character_service import CharacterService

rating_router = Router()

ITEMS_PER_PAGE = 10

def get_medal_emoji(rank: int) -> str:
    return {
        1: "🥇",
        2: "🥈",
        3: "🥉"
    }.get(rank, "🔸")

def build_rating_text(characters: list[Character], page: int) -> str:
    start = (page - 1) * ITEMS_PER_PAGE
    end = start + ITEMS_PER_PAGE
    page_chars = characters[start:end]

    header = (
        "🏆 <b>Тижневий рейтинг гравців</b>\n\n"
        "📊 Рейтинг формується за результатами <b>Blitz-турнірів</b>:\n"
        "🥇 1 місце — +3 очки рейтингу\n"
        "🥈 2 місце — +2 очки рейтингу\n"
        "⚔️ Півфіналісти — +1 очко рейтингу\n\n"
        "🔄 Щонеділі рейтинг <b>обнуляється</b>, а ТОП-3 гравці отримують нагороди:\n"
        "🥇 1 місце — Великий лутбокс 🎁\n"
        "🥈 2 місце — Середній лутбокс 🎁\n"
        "🥉 3 місце — Маленький лутбокс 🎁\n\n"
        "Грай активно, щоб піднятися вище у таблиці та здобути цінні подарунки!\n\n"
        "📌 Поточний список:\n"
    )

    lines = []
    for i, character in enumerate(page_chars, start=start + 1):
        medal = get_medal_emoji(i)
        team_name = character.owner.team_name or "Без команди"
        lines.append(f"{medal} {i}. {character.name} ({team_name}) — {character.points} очок")

    return header + "\n".join(lines)

def build_pagination_keyboard(page: int, total_pages: int) -> InlineKeyboardMarkup:
    buttons = []
    if page > 1:
        buttons.append(InlineKeyboardButton(text="⬅️", callback_data=f"rating_page:{page-1}"))
    if page < total_pages:
        buttons.append(InlineKeyboardButton(text="➡️", callback_data=f"rating_page:{page+1}"))
    return InlineKeyboardMarkup(inline_keyboard=[buttons]) if buttons else None

@rating_router.message(F.text.regexp(r"(✅\s*)?📊 Рейтинги(\s*✅)?"))
async def show_ratings(message: Message):
    characters = await CharacterService.get_all_characters()
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
