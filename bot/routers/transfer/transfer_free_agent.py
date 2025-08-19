from aiogram import Router, F, types
from aiogram.types import InputMediaPhoto, InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy import select

from constants import FREE_AGENTS, SUCCESS_BUY_PLAYER, get_photo_character
from database.models.transfer_character import TransferCharacter, TransferType
from database.models.user_bot import UserBot
from database.session import get_session
from services.transfer_service import TransferCharacterService

free_agents_router = Router()


# === Показати список вільних агентів ===
@free_agents_router.message(F.text == "👥 Вільні агенти")
async def show_free_agents(message: types.Message):
    async for session in get_session():
        result = await session.execute(
            select(TransferCharacter)
            .where(TransferCharacter.transfer_type == TransferType.FREE_AGENTS)
        )
        agents = result.scalars().all()

        if not agents:
            await message.answer("⚠ Зараз немає доступних вільних агентів.")
            return

        # выводим список для вибору
        text = "🌟 <b>Список вільних агентів</b>\n\nНатисніть на ім’я, щоб переглянути деталі:"
        kb = InlineKeyboardBuilder()
        for agent in agents:
            char = agent.character
            kb.row(InlineKeyboardButton(
                text=f"{char.name} | {agent.price} 💰",
                callback_data=f"info_free:{agent.id}"
            ))
        await message.answer_photo(photo=FREE_AGENTS, caption=text, reply_markup=kb.as_markup())


# === Показати деталі обраного вільного агента ===
@free_agents_router.callback_query(F.data.startswith("info_free:"))
async def show_free_agent_info(callback: types.CallbackQuery):
    transfer_id = int(callback.data.split(":")[1])
    transfer = await TransferCharacterService.get_by_id(transfer_id)
    if not transfer or transfer.transfer_type != TransferType.FREE_AGENTS:
        await callback.answer("❌ Гравець вже недоступний.", show_alert=True)
        return

    char = transfer.character
    text = (
        f"🏟 <b>{char.name}</b>\n"
        f"📅 Вік: {char.age}\n"
        f"💪 Сила: {char.power}\n"
        f"🌟 Талант: {char.talent}\n"
        f"💰 Ціна: {transfer.price}"
    )

    kb = InlineKeyboardBuilder()
    kb.button(
        text="💰 Купити",
        callback_data=f"buy_free:{transfer.id}"
    )
    kb.button(
        text="🔙 Назад",
        callback_data="back_free_list"
    )

    await callback.message.edit_media(
        media=InputMediaPhoto(media=get_photo_character(char), caption=text),
        reply_markup=kb.as_markup()
    )


# === Повернутися назад до списку ===
@free_agents_router.callback_query(F.data == "back_free_list")
async def back_to_free_list(callback: types.CallbackQuery):
    # просто викликаємо головний список ще раз
    await show_free_agents(callback.message)
    await callback.answer()


# === Покупка вільного агента ===
@free_agents_router.callback_query(F.data.startswith("buy_free:"))
async def buy_free_agent(callback: types.CallbackQuery):
    transfer_id = int(callback.data.split(":")[1])

    transfer = await TransferCharacterService.get_by_id(transfer_id)
    if not transfer or transfer.transfer_type != TransferType.FREE_AGENTS:
        await callback.answer("❌ Гравець вже недоступний.", show_alert=True)
        return

    buyer_id = callback.from_user.id

    async for session in get_session():
        # загружаем игрока и покупателя
        char = transfer.character
        buyer = await session.execute(select(UserBot).where(UserBot.user_id == buyer_id))
        buyer = buyer.scalar_one_or_none()
        if not buyer:
            await callback.answer("❌ Ви ще не зареєстровані у грі.", show_alert=True)
            return

        # проверка денег
        if buyer.money < transfer.price:
            await callback.answer("❌ У вас недостатньо монет.", show_alert=True)
            return

        # списываем деньги
        buyer.money -= transfer.price

        # назначаем нового владельца
        char.characters_user_id = buyer.user_id

        # удаляем из free_agents_market
        await session.delete(transfer)
        await session.commit()
        text = (f"✅ Ви успішно купили гравця {char.name} "
                f"за {transfer.price} монет!")
        await callback.message.edit_media(
            media=InputMediaPhoto(media=SUCCESS_BUY_PLAYER, caption=text)
        )
