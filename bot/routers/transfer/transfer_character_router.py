from aiogram import Router, F, types
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import StatesGroup, State
from aiogram.types import InputMediaPhoto
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy import select

from constants import TRANSFER, SUCCESS_BUY_PLAYER, SUCCESS_EXHIBITED_TRANSFER
from database.models.character import Character
from database.models.transfer_character import TransferType
from database.models.user_bot import UserBot
from database.session import get_session
from services.transfer_service import TransferCharacterService
from services.user_service import UserService

transfer_transfer_router = Router()

# === Хэндлер: список игроков на трансфере ===
@transfer_transfer_router.message(F.text == "📊 Ринок трансферів")
async def show_transfer_market(message: types.Message, state: FSMContext):
    # сохраняем начальные настройки: сортировка и страница
    await state.update_data(sort="price_asc", page=1)
    await send_transfer_page(message, state)


async def send_transfer_page(message_or_callback, state: FSMContext):
    data = await state.get_data()
    sort = data.get("sort", "price_asc")
    page = data.get("page", 1)

    # загружаем все трансферы
    transfers = await TransferCharacterService.get_all()
    if not transfers:
        if isinstance(message_or_callback, types.Message):
            await message_or_callback.answer("❌ На ринку поки що немає гравців.")
        else:
            await message_or_callback.message.edit_text("❌ На ринку поки що немає гравців.")
        return

    # сортировка
    if sort == "price_asc":
        transfers.sort(key=lambda t: t.price)
    elif sort == "price_desc":
        transfers.sort(key=lambda t: t.price, reverse=True)
    elif sort == "power_asc":
        transfers.sort(key=lambda t: t.character.power)
    elif sort == "power_desc":
        transfers.sort(key=lambda t: t.character.power, reverse=True)

    # пагинация
    per_page = 5
    start = (page - 1) * per_page
    end = start + per_page
    page_items = transfers[start:end]

    # формируем вывод
    text = f"📊 Ринок трансферів (сторінка {page})\nСортування: {sort}\n\n"
    kb = InlineKeyboardBuilder()

    for transfer in page_items:
        char = transfer.character
        text += (
            f"🏟 Ім’я: {char.name}\n"
            f"📅 Вік: {char.age}\n"
            f"💪 Сила: {char.power}\n"
            f"🌟 Талант: {char.talent}\n"
            f"💰 Ціна: {transfer.price}\n"
            f"👤 Продавець: {char.characters_user_id}\n\n"
        )
        kb.button(
            text=f"💰 Купити {char.name} ({transfer.price})",
            callback_data=f"buy:{transfer.id}"
        )

    # кнопки сортировки
    kb.row(
        types.InlineKeyboardButton(text="⬆ Ціна", callback_data="sort:price_asc"),
        types.InlineKeyboardButton(text="⬇ Ціна", callback_data="sort:price_desc"),
    )
    kb.row(
        types.InlineKeyboardButton(text="⬆ Сила", callback_data="sort:power_asc"),
        types.InlineKeyboardButton(text="⬇ Сила", callback_data="sort:power_desc"),
    )

    # кнопки пагинации
    if page > 1:
        kb.button(text="⬅️ Назад", callback_data=f"page:{page-1}")
    if end < len(transfers):
        kb.button(text="➡️ Далі", callback_data=f"page:{page+1}")

    if isinstance(message_or_callback, types.Message):
        await message_or_callback.edit_media(
            media=InputMediaPhoto(media=TRANSFER,caption=text),
            reply_markup=kb.as_markup()
        )
    else:
        await message_or_callback.message.edit_caption(caption=text, reply_markup=kb.as_markup())


# === Хэндлер: смена сортировки ===
@transfer_transfer_router.callback_query(F.data.startswith("sort:"))
async def change_sort(callback: types.CallbackQuery, state: FSMContext):
    sort = callback.data.split(":")[1]
    await state.update_data(sort=sort, page=1)
    await send_transfer_page(callback, state)
    await callback.answer()


# === Хэндлер: смена страницы ===
@transfer_transfer_router.callback_query(F.data.startswith("page:"))
async def change_page(callback: types.CallbackQuery, state: FSMContext):
    page = int(callback.data.split(":")[1])
    await state.update_data(page=page)
    await send_transfer_page(callback, state)
    await callback.answer()



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
    await UserService.assign_main_character_if_none(buyer_id)
    await callback.message.edit_media(
        media=InputMediaPhoto(
            media=SUCCESS_BUY_PLAYER, caption=f"✅ Ви купили гравця {char.name} за {transfer.price} монет!"
        )
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

    await message.answer_photo(
        photo=SUCCESS_EXHIBITED_TRANSFER,
        caption=f"✅ Гравця успішно виставлено на трансфер за {price} монет!"
    )
