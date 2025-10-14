# bot/routers/blitz/blitz_menu.py
import datetime
from aiogram import Router, F
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

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
    BlitzType.BLITZ_V4: "Бліц (4)",
}

BLITZ_LIMITS = {
    BlitzType.VIP_BLITZ_V8: 8,
    BlitzType.BLITZ_V8: 8,
    BlitzType.BLITZ_V16: 16,
    BlitzType.BLITZ_V32: 32,
    BlitzType.BLITZ_V64: 64,
    BlitzType.BLITZ_V4: 4,
}

FIXED_SCHEDULE_TEXT = """📋 <b>Розклад бліц-турнірів</b>

🕘 <b>09:00</b> — 🔥 Бліц (8) | Вхід: 30 енергії  
🕚 <b>11:00</b> — 🔥 Бліц (8) | Вхід: 30 енергії  
🕛 <b>12:00</b> — 🔥 Бліц (8) | Вхід: 30 енергії  
🕐 <b>13:00</b> — 🔥 Бліц (8) | Вхід: 30 енергії  
🕒 <b>15:00</b> — 🔥 Бліц (8) | Вхід: 30 енергії  
🕓 <b>16:00</b> — 🔥 Бліц (8) | Вхід: 30 енергії  
🕕 <b>18:00</b> — 🔥 Бліц (8) | Вхід: 30 енергії  
🕖 <b>19:00</b> — 🔥 Бліц (8) | Вхід: 30 енергії  
🕗 <b>20:00</b> — 🔥 Бліц (8) | Вхід: 30 енергії  
🕘 <b>21:00</b> — 🔥 Бліц (8) | Вхід: 30 енергії  
🕙 <b>22:00</b> — 🔥 Бліц (8) | Вхід: 30 енергії  
🕛 <b>00:00</b> — 🔥 Бліц (8) | Вхід: 30 енергії  

⚡ Участь у бліц-турнірах дає енергію, монети та лутбокси.  
👑 VIP-бліц доступний лише з активним VIP-пасом.  

📜 Реєстрація відкривається:
• за 30 хв до VIP-турніру  
• за 20 хв до звичайних турнірів
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
    is_vip_blitz = next_blitz.blitz_type == BlitzType.VIP_BLITZ_V8
    blitz_type_line = (
        f"💎 <b>VIP-бліц</b> — доступно лише з VIP-пасом\n"
        if is_vip_blitz else
        f"⚡ <b>Звичайний бліц</b>\n"
    )

    registration_rules = (
        "Реєстрація відкривається за 30 хв до старту." if is_vip_blitz
        else "Реєстрація відкривається за 20 хв до старту."
    )
    # Текст про ближайший

    blitz_text = (
        f"\n🔥 <b>Найближчий бліц:</b>\n"
        f"🏆 {BLITZ_TYPE_NAMES.get(next_blitz.blitz_type, str(next_blitz.blitz_type))}\n"
        f"🕒 Старт: {next_blitz.start_at.strftime('%d.%m.%Y %H:%M')} ({human_delta(time_left)})\n"
        f"💰 Вартість: {next_blitz.cost} енергії\n"
        f"👥 Учасники: {len(next_blitz.users)}/{BLITZ_LIMITS[next_blitz.blitz_type]}\n\n"
        f"{blitz_type_line}"
        f"📜 {registration_rules}"
    )

    reply_markup = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(
                text="⚽ Увійти у WebApp",
                web_app=WebAppInfo(
                    url=f"https://football-blitz.online/blitz?user_id={user.user_id}")
            )]
        ]
    )
    already_registered = any(bu.user_id == user.user_id for bu in next_blitz.users)
    participants_count = len(next_blitz.users)
    max_participants = BLITZ_LIMITS[next_blitz.blitz_type]
    if (
            not already_registered
            and participants_count < max_participants  # ✅ Проверка на лимит участников
            and (
            minutes_left < 20 or (minutes_left < 30 and user.vip_pass_is_active)
    )
    ):
        if (not is_vip_blitz) or (is_vip_blitz and user.vip_pass_is_active):
            max_chars = BLITZ_LIMITS[next_blitz.blitz_type]
            cb = BlitzRegisterCallback(
                blitz_id=next_blitz.id,
                max_characters=max_chars,
                registration_cost=next_blitz.cost,
                is_scheduler=True,
            ).pack()
            button_text = f"🚀 Зареєструватись"
            reply_markup = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text=button_text, callback_data=cb)],
                [InlineKeyboardButton(
                    text="⚽ Увійти у WebApp",
                    web_app=WebAppInfo(
                        url=f"https://football-blitz.online/blitz?user_id={user.user_id}")
                )]
            ])

    await message.answer_photo(
        photo=BLITZ_SCHEDULER,
        caption=FIXED_SCHEDULE_TEXT + blitz_text,
        reply_markup=reply_markup,
        parse_mode="HTML"
    )
