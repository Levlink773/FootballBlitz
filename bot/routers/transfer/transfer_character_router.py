from aiogram import Router, F, types
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import StatesGroup, State
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy import select

from database.models.character import Character
from database.models.transfer_character import TransferType
from database.models.user_bot import UserBot
from database.session import get_session
from services.transfer_service import TransferCharacterService

transfer_transfer_router = Router()

# === Хэндлер: список игроков на трансфере ===
@transfer_transfer_router.message(F.text == "📊 Ринок трансферів")
async def show_transfer_market(message: types.Message):
    transfers = await TransferCharacterService.get_all()
    if not transfers:
        await message.answer("❌ На ринку поки що немає гравців.")
        return

    for transfer in transfers:
        char = transfer.character
        kb = InlineKeyboardBuilder()
        kb.button(text=f"💰 Купити за {transfer.price}",
                  callback_data=f"buy:{transfer.id}")
        await message.answer(
            f"🏟 Ім’я: {char.name}\n"
            f"📅 Вік: {char.age}\n"
            f"💪 Сила: {char.power}\n"
            f"🌟 Талант: {char.talent}\n"
            f"💰 Ціна: {transfer.price}\n"
            f"👤 Продавець: {char.characters_user_id}",
            reply_markup=kb.as_markup()
        )


# === Хэндлер: покупка игрока ===
@transfer_transfer_router.callback_query(F.data.startswith("buy:"))
async def buy_player(callback: types.CallbackQuery):
    transfer_id = int(callback.data.split(":")[1])
    transfer = await TransferCharacterService.get_by_id(transfer_id)

    if not transfer:
        await callback.answer("❌ Гравець вже проданий або знятий з ринку.", show_alert=True)
        return

    char = transfer.character

    buyer_id = callback.from_user.id
    seller_id = char.characters_user_id

    # запрет покупать своего игрока
    if buyer_id == seller_id:
        await callback.answer("❌ Ви не можете купити свого гравця.", show_alert=True)
        return

    # проверка денег у покупателя
    async for session in get_session():
        buyer = await session.get(UserBot, buyer_id)
        seller = await session.get(UserBot, seller_id)

        if buyer.money < transfer.price:
            await callback.answer("💸 Недостатньо коштів.", show_alert=True)
            return

        # транзакция: списать и зачислить деньги
        buyer.money -= transfer.price
        seller.money += transfer.price

        # смена владельца игрока
        char.characters_user_id = buyer_id

        # удалить с трансфера
        await session.delete(transfer)
        await session.commit()

    await callback.message.edit_text(
        f"✅ Ви купили гравця {char.name} за {transfer.price} монет!"
    )


# === Хэндлер: выставить игрока ===
@transfer_transfer_router.message(F.text == "➕ Виставити гравця")
async def list_my_players(message: types.Message):
    user_id = message.from_user.id
    async for session in get_session():
        chars = await session.execute(
            select(Character).where(Character.characters_user_id == user_id)
        )
        chars = chars.scalars().all()

        if not chars:
            await message.answer("❌ У вас немає гравців.")
            return

        for char in chars:
            kb = InlineKeyboardBuilder()
            kb.button(
                text="📤 Виставити на трансфер",
                callback_data=f"sell:{char.id}"
            )
            await message.answer(
                f"🏟 {char.name} | 💪 {char.power} | 🌟 {char.talent} | 📅 {char.age}\n"
                f"Мінімальна ціна: {int(char.character_price * 0.5)}",
                reply_markup=kb.as_markup()
            )


# === FSM для выставления игрока ===
class SellPlayerFSM(StatesGroup):
    waiting_for_price = State()
    selected_char_id = State()


# === Хэндлер: пользователь нажал "Виставити на трансфер" ===
@transfer_transfer_router.callback_query(F.data.startswith("sell:"))
async def sell_player(callback: types.CallbackQuery, state: FSMContext):
    char_id = int(callback.data.split(":")[1])

    async for session in get_session():
        char = await session.get(Character, char_id)
        if not char:
            await callback.answer("❌ Гравця не знайдено.", show_alert=True)
            return

        min_price = int(char.character_price * 0.5)

        # сохраняем в state id игрока и минимальную цену
        await state.update_data(char_id=char_id, min_price=min_price)

        await state.set_state(SellPlayerFSM.waiting_for_price)

        await callback.message.edit_text(
            f"💡 Вкажіть ціну для гравця *{char.name}*\n"
            f"Мінімальна допустима ціна: {min_price} монет",
            parse_mode="Markdown"
        )


# === Хэндлер: ввод цены ===
@transfer_transfer_router.message(SellPlayerFSM.waiting_for_price)
async def set_price(message: types.Message, state: FSMContext):
    data = await state.get_data()
    char_id = data["char_id"]
    min_price = data["min_price"]

    # проверяем, что пользователь ввёл число
    try:
        price = int(message.text)
    except ValueError:
        await message.answer("❌ Введіть число (вартість у монетах).")
        return

    if price < min_price:
        await message.answer(
            f"⚠ Мінімальна ціна для цього гравця {min_price}. "
            f"Спробуйте ще раз."
        )
        return

    # добавляем игрока на трансфер
    await TransferCharacterService.create(
        characters_id=char_id,
        price=price,
        transfer_type=TransferType.TRANSFER
    )

    await state.clear()

    await message.answer(
        f"✅ Гравця успішно виставлено на трансфер за {price} монет!"
    )
