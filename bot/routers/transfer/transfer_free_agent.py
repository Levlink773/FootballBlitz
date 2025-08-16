from aiogram import Router, F, types
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy import select

from database.models.transfer_character import TransferCharacter, TransferType
from database.models.user_bot import UserBot
from database.session import get_session
from services.transfer_service import TransferCharacterService

free_agents_router = Router()


# === Показать список свободных агентов ===
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

        text = "🌟 Список вільних агентів:\n\n"
        kb = InlineKeyboardBuilder()

        for agent in agents:
            char = agent.character
            text += (
                f"🏟 Ім’я: {char.name}\n"
                f"📅 Вік: {char.age}\n"
                f"💪 Сила: {char.power}\n"
                f"🌟 Талант: {char.talent}\n"
                f"💰 Ціна: {agent.price}\n"
                f"──────────────\n"
            )
            kb.button(
                text=f"Купити {char.name} за {agent.price}",
                callback_data=f"buy_free:{agent.id}"
            )

        kb.adjust(1)
        await message.answer(text, reply_markup=kb.as_markup())


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
        buyer: UserBot = await session.get(type(char).owner.mapper.class_, buyer_id)  # UserBot
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

        await callback.message.edit_text(
            f"✅ Ви успішно купили гравця {char.name} "
            f"за {transfer.price} монет!"
        )
