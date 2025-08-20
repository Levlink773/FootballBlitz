from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardButton, InputMediaPhoto
from aiogram.utils.keyboard import InlineKeyboardBuilder

from constants import MENU_TEAM, get_photo_character
from database.models.character import Character
from database.models.user_bot import UserBot
from logging_config import logger
from services.user_service import UserService
from utils.generate_character import COUNTRY_FLAGS

menu_character_router = Router()


# Ключ для callback_data — чтобы передавать id персонажа и действие
def make_character_cb(character_id: int, action: str = "view"):
    return f"character:{character_id}:{action}"


@menu_character_router.message(
    F.text.regexp(r"(✅\s*)?🧍‍♂️ Моя команда(\s*✅)?")
)
async def show_team(
        message: Message,
        user: UserBot,
        character: Character,
):
    vip_status = "🟢 Активний" if user.vip_pass_is_active else "🔴 Неактивний"
    logger.info(f"Main: {character.name}")
    text = (
        f"💰 Гроші: <b>{user.money}</b>\n"
        f"⚡ Енергія: <b>{user.energy}</b>\n"
        f"🎟 VIP статус: <b>{vip_status}</b>\n"
        f"🏷 Назва команди: <b>{user.team_name or 'Без назви'}</b>\n\n"
        "📋 Ваші персонажі (натисніть на ім'я, щоб побачити деталі):"
    )

    kb = InlineKeyboardBuilder()
    characters: list[Character] = user.characters
    for c in characters:
        name_button = f"⚪ {c.name}"
        if user.main_character_id == c.id:
            name_button = f"{c.name} 🌟 (головний)"
        kb.add(InlineKeyboardButton(text=name_button, callback_data=make_character_cb(c.id)))
    kb.adjust(1)
    await message.answer_photo(
        photo=MENU_TEAM,
        caption=text,
        reply_markup=kb.as_markup()
    )


@menu_character_router.callback_query(F.data.startswith("character:"))
async def handle_character_callback(callback: CallbackQuery, user: UserBot):
    data = callback.data.split(":")
    character_id = int(data[1])
    action = data[2] if len(data) > 2 else "view"

    character: Character = next((c for c in user.characters if c.id == character_id), None)
    if not character:
        await callback.answer("Гравець не знайден ❌", show_alert=True)
        return

    if action == "view":
        # Показываем детали персонажа
        price = max(character.character_price, 0)
        is_main = (user.main_character_id == character.id)
        main_text = "⭐ <b>Головний герой</b>" if is_main else "⚪ <b>Не головний</b>"
        country_flag = COUNTRY_FLAGS.get(character.country)
        text = (
            f"🧍 Iм'я: <b>{character.name} {country_flag}</b>\n"
            f"🎂 Вік: {character.age}\n"
            f"💪 Сила: {round(character.power)}\n"
            f"🎯 Талант: {character.talent}\n"
            f"🌍 Національність: {character.country.name.capitalize()} {country_flag}\n"
            f"💰 Ціна: {round(price)} монет\n"
            f"📌 Статус: {main_text}"
        )

        kb = InlineKeyboardBuilder()

        if user.vip_pass_is_active and not is_main:
            kb.add(
                InlineKeyboardButton(
                    text="🔄 Зробити головним",
                    callback_data=make_character_cb(character.id, "set_main")
                )
            )
        kb.row(InlineKeyboardButton(text="⬅ Назад", callback_data="back_to_team"))
        await callback.message.edit_media(
            media=InputMediaPhoto(media=get_photo_character(character), caption=text),
            reply_markup=kb.as_markup()
        )
        await callback.answer()

    elif action == "set_main":
        # Меняем главного персонажа
        if not user.vip_pass_is_active:
            await callback.answer("Тільки для VIP користувачів!", show_alert=True)
            return
        await UserService.update_main_character(user.user_id, character_id)

        await callback.answer(f"🌟 {character.name} тепер головний гравець вашої команди!", show_alert=True)
        country_flag = COUNTRY_FLAGS.get(character.country)
        # Показываем обновленные детали
        price = max(character.character_price, 0)
        text = (
            f"🧍 Ім'я: <b>{character.name} {country_flag}</b>\n"
            f"🎂 Вік: {character.age}\n"
            f"💪 Сила: {round(character.power, 3)}\n"
            f"🎯 Талант: {character.talent}\n"
            f"🌍 Національність: {character.country.name.capitalize()} {country_flag}\n"
            f"💰 Ціна: {round(price)} монет\n"
            f"📌 Статус: 🌟 Головний персонаж "
        )
        kb = InlineKeyboardBuilder()
        kb.add(InlineKeyboardButton(text="⬅ Назад", callback_data="back_to_team"))

        await callback.message.edit_media(
            media=InputMediaPhoto(media=get_photo_character(character), caption=text),
            reply_markup=kb.as_markup()
        )


@menu_character_router.callback_query(F.data == "back_to_team")
async def back_to_team_handler(callback: CallbackQuery, user: UserBot):
    # Вернемся к списку персонажей (повторим функцию show_team)
    vip_status = "🟢 Активний" if user.vip_pass_is_active else "🔴 Неактивний"
    text = (
        f"💰 Гроші: <b>{user.money}</b>\n"
        f"⚡ Енергія: <b>{user.energy}</b>\n"
        f"🎟 VIP статус: <b>{vip_status}</b>\n"
        f"🏷 Назва команди: <b>{user.team_name or 'Без назви'}</b>\n\n"
        "📋 Ваші персонажі (натисніть на ім'я, щоб побачити деталі):"
    )

    kb = InlineKeyboardBuilder()
    for c in user.characters:
        name_button = f"{c.name}"
        if user.main_character_id == c.id:
            name_button += " ⭐ (головний)"
        kb.add(InlineKeyboardButton(text=name_button, callback_data=make_character_cb(c.id)))
    kb.adjust(1)
    await callback.message.edit_media(
        media=InputMediaPhoto(media=MENU_TEAM, caption=text),
        reply_markup=kb.as_markup()
    )
    await callback.answer()
