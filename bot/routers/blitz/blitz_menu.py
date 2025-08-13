# bot/routers/blitz/blitz_menu.py
import datetime
from aiogram import Router, F
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton

from blitz.services.blitz_service import BlitzService
from bot.callbacks.blitz_callback import BlitzRegisterCallback
from constants import BLITZ_SCHEDULER
from database.models.blitz import BlitzType
from database.models.user_bot import UserBot

blitz_menu_router = Router()

BLITZ_TYPE_NAMES = {
    BlitzType.VIP_BLITZ_V8: "VIP Бліц (8)",
    BlitzType.BLITZ_V8: "Бліц (8)",
    BlitzType.BLITZ_V16: "Бліц (16)",
    BlitzType.BLITZ_V32: "Бліц (32)",
    BlitzType.BLITZ_V64: "Бліц (64)",
}

BLITZ_LIMITS = {
    BlitzType.VIP_BLITZ_V8: 8,
    BlitzType.BLITZ_V8: 8,
    BlitzType.BLITZ_V16: 16,
    BlitzType.BLITZ_V32: 32,
    BlitzType.BLITZ_V64: 64,
}

FIXED_SCHEDULE_TEXT = """📋 <b>Розклад бліц-турнірів</b>

VIP Бліц (8) — тільки для VIP, 8 учасників  
Бліц (8) — відкритий, 8 учасників  
Бліц (16) — відкритий, 16 учасників  
Бліц (32) — відкритий, 32 учасники  
Бліц (64) — відкритий, 64 учасники

"""


def human_delta(td: datetime.timedelta) -> str:
    total_seconds = int(td.total_seconds())
    if total_seconds <= 0:
        return "стартував"
    minutes = total_seconds // 60
    hours = minutes // 60
    minutes %= 60
    if hours:
        return f"{hours} год {minutes} хв"
    return f"{minutes} хв"


@blitz_menu_router.message(F.text.regexp(r"(✅\s*)?🏆 Турніри(\s*✅)?"))
async def blitz_menu_handler(message: Message, user: UserBot):
    blitz_list = await BlitzService.get_all_blitz()
    if not blitz_list:
        await message.answer(FIXED_SCHEDULE_TEXT + "\n🚫 Немає запланованих бліц-турнірів.")
        return

    now = datetime.datetime.now()
    # Берем ближайший (по start_at)
    future_blitz = sorted([b for b in blitz_list if b.start_at > now], key=lambda b: b.start_at)
    if not future_blitz:
        await message.answer(FIXED_SCHEDULE_TEXT + "\n🚫 Немає майбутніх бліц-турнірів.")
        return

    next_blitz = future_blitz[0]
    time_left = next_blitz.start_at - now
    minutes_left = int(time_left.total_seconds() // 60)

    # Текст про ближайший
    blitz_text = (
        f"\n🔥 <b>Найближчий бліц:</b>\n"
        f"🏆 {BLITZ_TYPE_NAMES.get(next_blitz.blitz_type, str(next_blitz.blitz_type))}\n"
        f"🕒 Старт: {next_blitz.start_at.strftime('%d.%m.%Y %H:%M')} ({human_delta(time_left)})\n"
        f"💰 Вартість: {next_blitz.cost} енергії\n"
        f"👥 Учасники: {len(next_blitz.users)}/{BLITZ_LIMITS[next_blitz.blitz_type]}\n\n"
        "Реєстрація відкривається за 30 хв (VIP) або за 20 хв (всі) до старту."
    )

    reply_markup = None
    if minutes_left < 2 or (minutes_left < 3 and user.vip_pass_is_active):
        max_chars = BLITZ_LIMITS[next_blitz.blitz_type]
        cb = BlitzRegisterCallback(
            blitz_id=next_blitz.id,
            max_characters=max_chars,
            registration_cost=next_blitz.cost
        ).pack()
        button_text = f"🚀 Зареєструватись"
        reply_markup = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text=button_text, callback_data=cb)]
        ])

    await message.answer_photo(
        photo=BLITZ_SCHEDULER,
        caption=FIXED_SCHEDULE_TEXT + blitz_text,
        reply_markup=reply_markup,
        parse_mode="HTML"
    )
