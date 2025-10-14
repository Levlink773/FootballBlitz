from aiogram import Router, F
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, CallbackQuery, WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder

from constants import RATING
from database.models.user_bot import UserBot
from services.user_service import UserService

rating_router = Router()

ITEMS_PER_PAGE = 10

# Текст з інформацією про рейтинг сезону
INFO_TEXT_SEASONAL = (
    "🏆 <b>Тижневий рейтинг гравців (рейтинг сезону)</b>\n\n"
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

# Текст з інформацією про рейтинг за відсотком перемог
INFO_TEXT_WIN_RATE = (
    "🎯 <b>Рейтинг за відсотком перемог</b>\n\n"
    "📊 Цей рейтинг сортує гравців за їхнім відсотком перемог у всіх зіграних матчах.\n\n"
    "Формула розрахунку: `(Кількість перемог / Загальна кількість матчів) * 100%`\n\n"
    "⚔️ Враховуються абсолютно всі гравці, навіть ті, хто ще не зіграв жодного матчу.\n\n"
    "Цей показник відображає вашу ефективність та майстерність у грі."
)


def get_medal_emoji(rank: int) -> str:
    return {1: "🥇", 2: "🥈", 3: "🥉"}.get(rank, f"🔸")


# --- БУДІВНИКИ КЛАВІАТУР ТА ТЕКСТУ ---

def build_rating_hub_keyboard(user_id: int) -> InlineKeyboardMarkup:
    """Створює клавіатуру для вибору типу рейтингу."""
    builder = InlineKeyboardBuilder()
    builder.row(InlineKeyboardButton(text="🏆 Рейтинг сезону", callback_data="show_rating:seasonal"))
    builder.row(InlineKeyboardButton(text="🎯 За відсотком перемог", callback_data="show_rating:win_rate"))
    builder.row(InlineKeyboardButton(
                        text="⚽ Дивитись рейтинги у WebApp",
                        web_app=WebAppInfo(
                            url=f"https://football-blitz.online/rating?user_id={user_id}")
                    ))
    return builder.as_markup()


# Функції для рейтингу сезону (за очками)
def build_seasonal_rating_text(users: list[UserBot], page: int) -> str:
    start_index = (page - 1) * ITEMS_PER_PAGE
    page_users = users[start_index: start_index + ITEMS_PER_PAGE]

    lines = [f"🏆 <b>Рейтинг сезону (Топ-{len(users)})</b>\n"]
    for i, user in enumerate(page_users, start=start_index + 1):
        medal = get_medal_emoji(i)
        team_name = user.team_name_user or "Без команди"
        username = f"@{user.user_name}" if user.user_name else user.user_full_name
        lines.append(f"{medal} {i}. {username} ({team_name}) — <b>{user.points} очок</b>")

    return "\n".join(lines)


def build_seasonal_pagination_keyboard(page: int, total_pages: int) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.row(
        InlineKeyboardButton(text="⬅️" if page > 1 else " ",
                             callback_data=f"seasonal_page:{page - 1}" if page > 1 else "none"),
        InlineKeyboardButton(text=f"{page}/{total_pages}", callback_data="none"),
        InlineKeyboardButton(text="➡️" if page < total_pages else " ",
                             callback_data=f"seasonal_page:{page + 1}" if page < total_pages else "none")
    )
    builder.row(InlineKeyboardButton(text="ℹ️ Інформація", callback_data="rating_info:seasonal"))
    builder.row(InlineKeyboardButton(text="⬅️ Назад до вибору", callback_data="back_to_rating_hub"))
    return builder.as_markup()


# Функції для рейтингу за відсотком перемог
def build_win_rate_rating_text(users: list[UserBot], page: int) -> str:
    start_index = (page - 1) * ITEMS_PER_PAGE
    page_users = users[start_index: start_index + ITEMS_PER_PAGE]

    lines = [f"🎯 <b>Рейтинг за % перемог (Топ-{len(users)})</b>\n"]
    for i, user in enumerate(page_users, start=start_index + 1):
        medal = get_medal_emoji(i)
        username = f"@{user.user_name}" if user.user_name else user.user_full_name
        # Забезпечуємо, що None значення відображаються як 0
        winner_matches = user.final_winner_matches or 0
        count_of_matches = user.final_count_of_matches or 0
        lines.append(
            f"{medal} {i}. {username} — <b>{user.precent_winner_matches}%</b> перемог ({winner_matches}/{count_of_matches} ігор)")

    return "\n".join(lines)


def build_win_rate_pagination_keyboard(page: int, total_pages: int) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.row(
        InlineKeyboardButton(text="⬅️" if page > 1 else " ",
                             callback_data=f"win_rate_page:{page - 1}" if page > 1 else "none"),
        InlineKeyboardButton(text=f"{page}/{total_pages}", callback_data="none"),
        InlineKeyboardButton(text="➡️" if page < total_pages else " ",
                             callback_data=f"win_rate_page:{page + 1}" if page < total_pages else "none")
    )
    builder.row(InlineKeyboardButton(text="ℹ️ Інформація", callback_data="rating_info:win_rate"))
    builder.row(InlineKeyboardButton(text="⬅️ Назад до вибору", callback_data="back_to_rating_hub"))
    return builder.as_markup()


# --- ОСНОВНІ ОБРОБНИКИ ---

@rating_router.message(F.text.regexp(r"(✅\s*)?📊 Рейтинги(\s*✅)?"))
async def show_rating_hub(message: Message):
    """Показує головне меню вибору рейтингів."""
    text = "📊 <b>Рейтинги гравців</b>\n\nОберіть тип рейтингу, який вас цікавить:"
    keyboard = build_rating_hub_keyboard(message.from_user.id)
    await message.answer_photo(photo=RATING, caption=text, reply_markup=keyboard)


@rating_router.callback_query(F.data == "back_to_rating_hub")
async def back_to_rating_hub_handler(callback: CallbackQuery):
    """Повертає користувача до меню вибору рейтингів."""
    text = "📊 <b>Рейтинги гравців</b>\n\nОберіть тип рейтингу, який вас цікавить:"
    keyboard = build_rating_hub_keyboard(callback.from_user.id)
    await callback.message.edit_caption(caption=text, reply_markup=keyboard)
    await callback.answer()


# --- ОБРОБНИКИ РЕЙТИНГУ СЕЗОНУ ---

@rating_router.callback_query(F.data.startswith("show_rating:seasonal") | F.data.startswith("seasonal_page:"))
async def show_seasonal_rating_handler(callback: CallbackQuery):
    """Обробляє показ та пагінацію рейтингу сезону."""
    if callback.data.startswith("seasonal_page:"):
        page = int(callback.data.split(":")[1])
    else:  # Якщо це 'show_rating:seasonal'
        page = 1

    users = await UserService.get_all_users()
    sorted_users = sorted(users, key=lambda u: u.points, reverse=True)

    if not sorted_users:
        await callback.answer("Рейтинги поки недоступні.", show_alert=True)
        return

    total_pages = (len(sorted_users) + ITEMS_PER_PAGE - 1) // ITEMS_PER_PAGE
    page = max(1, min(page, total_pages))  # Захист від невірних значень сторінки

    text = build_seasonal_rating_text(sorted_users, page)
    keyboard = build_seasonal_pagination_keyboard(page, total_pages)

    await callback.message.edit_caption(caption=text, reply_markup=keyboard)
    await callback.answer()


# --- ОБРОБНИКИ РЕЙТИНГУ ЗА % ПЕРЕМОГ ---

@rating_router.callback_query(F.data.startswith("show_rating:win_rate") | F.data.startswith("win_rate_page:"))
async def show_win_rate_rating_handler(callback: CallbackQuery):
    """Обробляє показ та пагінацію рейтингу за відсотком перемог."""
    if callback.data.startswith("win_rate_page:"):
        page = int(callback.data.split(":")[1])
    else:  # Якщо це 'show_rating:win_rate'
        page = 1

    users = await UserService.get_all_users()

    # ▼▼▼▼▼ ЗМІНЕНО ТУТ ▼▼▼▼▼
    # Попередня фільтрація видалена. Тепер враховуються всі гравці.

    # Перевіряємо, чи є взагалі гравці в боті
    if not users:
        await callback.answer("В боті ще немає зареєстрованих гравців.", show_alert=True)
        return

    # Сортуємо всіх користувачів
    sorted_users = sorted(users, key=lambda u: u.precent_winner_matches, reverse=True)
    # ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    total_pages = (len(sorted_users) + ITEMS_PER_PAGE - 1) // ITEMS_PER_PAGE
    page = max(1, min(page, total_pages))

    text = build_win_rate_rating_text(sorted_users, page)
    keyboard = build_win_rate_pagination_keyboard(page, total_pages)

    await callback.message.edit_caption(caption=text, reply_markup=keyboard)
    await callback.answer()


# --- ОБРОБНИКИ ІНФОРМАЦІЙНИХ ПОВІДОМЛЕНЬ ---

@rating_router.callback_query(F.data.startswith("rating_info:"))
async def rating_info_handler(callback: CallbackQuery):
    """Показує інформацію про відповідний тип рейтингу."""
    rating_type = callback.data.split(":")[1]

    if rating_type == "seasonal":
        text = INFO_TEXT_SEASONAL
        back_button = InlineKeyboardButton(text="⬅️ Назад", callback_data="show_rating:seasonal")
    elif rating_type == "win_rate":
        text = INFO_TEXT_WIN_RATE
        back_button = InlineKeyboardButton(text="⬅️ Назад", callback_data="show_rating:win_rate")
    else:
        await callback.answer("Невідомий тип інформації.", show_alert=True)
        return

    keyboard = InlineKeyboardMarkup(inline_keyboard=[[back_button]])
    await callback.message.edit_caption(caption=text, reply_markup=keyboard)
    await callback.answer()


# Dummy callback handler for "none" data to prevent "update not answered" errors
@rating_router.callback_query(F.data == "none")
async def dummy_handler(callback: CallbackQuery):
    await callback.answer()