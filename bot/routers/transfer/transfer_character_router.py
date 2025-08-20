from aiogram import Router, F, types
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import StatesGroup, State
from aiogram.types import InputMediaPhoto, InlineKeyboardButton
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from constants import SUCCESS_BUY_PLAYER, SUCCESS_EXHIBITED_TRANSFER, TRANSFER, get_photo_character, MY_TRANSFERS
from database.models.character import Character
from database.models.transfer_character import TransferType, TransferCharacter
from database.models.user_bot import UserBot
from database.session import get_session
from services.character_service import CharacterService
from services.transfer_service import TransferCharacterService
from services.user_service import UserService

transfer_transfer_router = Router()
sort_titles = {
    "price_asc": "ціна (від дешевих до дорогих)",
    "price_desc": "ціна (від дорогих до дешевих)",
    "power_asc": "сила (від слабких до сильних)",
    "power_desc": "сила (від сильних до слабких)"
}

# === Хэндлер: список игроков на трансфере ===
@transfer_transfer_router.message(F.text == "🏟 Ринок трансферів")
async def show_transfer_market(message: types.Message, state: FSMContext):
    await state.update_data(sort="price_asc", page=1)
    await send_transfer_page(message, state)


async def send_transfer_page(message_or_callback, state: FSMContext):
    data = await state.get_data()
    sort = data.get("sort", "price_asc")
    page = data.get("page", 1)

    transfers = await TransferCharacterService.get_all()

    kb = InlineKeyboardBuilder()
    kb.row(
        InlineKeyboardButton(text='⚽ Управління та виставлення гравців', callback_data='exhibited_character')
    )

    if not transfers:
        msg = "❌ На ринку поки що немає гравців."
        if isinstance(message_or_callback, types.Message):
            await message_or_callback.answer_photo(
                photo=TRANSFER,
                caption=msg,
                reply_markup=kb.as_markup()
            )
        else:
            await message_or_callback.message.edit_media(
                media=InputMediaPhoto(media=TRANSFER, caption=msg),
                reply_markup=kb.as_markup()
            )
        return

    # --- сортировка ---
    if sort == "price_asc":
        transfers.sort(key=lambda t: t.price)
    elif sort == "price_desc":
        transfers.sort(key=lambda t: t.price, reverse=True)
    elif sort == "power_asc":
        transfers.sort(key=lambda t: t.character.power)
    elif sort == "power_desc":
        transfers.sort(key=lambda t: t.character.power, reverse=True)

    per_page = 5
    start = (page - 1) * per_page
    end = start + per_page
    page_items = transfers[start:end]

    # --- текст ---
    text = f"📊 <b>Ринок трансферів</b>  (сторінка {page})\n"
    text += f"🔎 <i>Сортування:</i> {sort_titles.get(sort, sort)}\n\n"
    text += "👤 Натисніть на ім’я, щоб переглянути деталі:\n\n"

    # --- клавиатура ---
    for transfer in page_items:
        char = transfer.character
        kb.row(
            InlineKeyboardButton(
                text=f"{char.name} | {transfer.price} 💰",
                callback_data=f"info:{transfer.id}"
            )
        )

    # сортировка (2 кнопки)
    price_text = "💰 Ціна ⬆" if sort != "price_desc" else "💰 Ціна ⬇"
    power_text = "💪 Сила ⬆" if sort != "power_desc" else "💪 Сила ⬇"
    kb.row(
        InlineKeyboardButton(text=price_text, callback_data="sort:price"),
        InlineKeyboardButton(text=power_text, callback_data="sort:power"),
    )

    # пагинация
    nav_row = []
    if page > 1:
        nav_row.append(types.InlineKeyboardButton(text="⬅️", callback_data=f"page:{page - 1}"))
    if end < len(transfers):
        nav_row.append(types.InlineKeyboardButton(text="➡️", callback_data=f"page:{page + 1}"))
    if nav_row:
        kb.row(*nav_row)

    if isinstance(message_or_callback, types.Message):
        await message_or_callback.answer_photo(
            photo=TRANSFER,
            caption=text,
            reply_markup=kb.as_markup(),
        )
    else:
        await message_or_callback.message.edit_media(
            media=InputMediaPhoto(media=TRANSFER, caption=text),
            reply_markup=kb.as_markup()
        )



# === Хендлер: показать подробную карточку игрока ===
@transfer_transfer_router.callback_query(F.data.startswith("info:"))
async def show_player_info(callback: types.CallbackQuery):
    transfer_id = int(callback.data.split(":")[1])
    transfer = await TransferCharacterService.get_by_id(transfer_id)
    if not transfer:
        await callback.answer("❌ Гравця не знайдено.", show_alert=True)
        return

    char = transfer.character
    seller_user = await UserService.get_user(char.characters_user_id)
    seller = "Не найден"
    if seller_user:
        seller = f'@{seller_user.user_name}' or seller_user.user_full_name or seller_user.user_id
    text = (
        f"🏟 <b>{char.name}</b>\n"
        f"📅 Вік: {char.age}\n"
        f"💪 Сила: {char.power}\n"
        f"🌟 Талант: {char.talent}\n"
        f"💰 Ціна: {transfer.price}\n"
        f"👤 Продавець: {seller}"
    )

    kb = InlineKeyboardBuilder()
    kb.button(
        text=f"💰 Купити за {transfer.price}",
        callback_data=f"buy:{transfer.id}"
    )
    kb.button(text="🔙 Назад до списку", callback_data="back_to_list")

    await callback.message.edit_media(
        media=InputMediaPhoto(media=get_photo_character(char), caption=text),
        reply_markup=kb.as_markup()
    )


# === Вернуться назад к списку после просмотра карточки ===
@transfer_transfer_router.callback_query(F.data == "back_to_list")
async def back_to_list(callback: types.CallbackQuery, state: FSMContext):
    await send_transfer_page(callback, state)
    await callback.answer()


@transfer_transfer_router.callback_query(F.data.startswith("sort:"))
async def change_sort(callback: types.CallbackQuery, state: FSMContext):
    sort_type = callback.data.split(":")[1]
    data = await state.get_data()
    current_sort = data.get("sort", "price_asc")

    if sort_type == "price":
        new_sort = "price_desc" if current_sort == "price_asc" else "price_asc"
    elif sort_type == "power":
        new_sort = "power_desc" if current_sort == "power_asc" else "power_asc"
    else:
        new_sort = "price_asc"

    await state.update_data(sort=new_sort)
    await send_transfer_page(callback, state)


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
        char: Character = await session.scalar(
            select(Character).where(Character.id == char.id).options(selectinload(Character.transfer))
        )
        transfer: TransferCharacter = await session.scalar(
            select(TransferCharacter).where(TransferCharacter.id == transfer.id)
        )
        buyer: UserBot = await session.scalar(
            select(UserBot).where(UserBot.user_id == buyer_id).options(
                selectinload(UserBot.characters),
                selectinload(UserBot.main_character),
            )
        )
        seller: UserBot = await session.scalar(select(UserBot).where(UserBot.user_id == seller_id))
        if buyer.money < transfer.price:
            await callback.answer("💸 Недостатньо коштів.", show_alert=True)
            return
        if (not buyer.vip_pass_is_active and len(buyer.characters) >= 1) or (
                buyer.vip_pass_is_active and len(buyer.characters) >= 2):
            t = '⚠️ Ви вже досягли максимальної кількості гравців. 🧍‍♂️️ Продайте одного з існуючих, щоб придбати нового.'
            await callback.answer(t, show_alert=True)
            return
        # смена владельца игрока
        char.characters_user_id = buyer_id

        # транзакция: списать и зачислить деньги
        buyer.money -= transfer.price
        session.add(buyer)
        if seller:
            seller.money += transfer.price
            session.add(seller)

        # удалить с трансфера
        await session.delete(transfer)
        await session.commit()
    await UserService.assign_main_character_if_none(buyer_id)
    await callback.message.edit_media(
        media=InputMediaPhoto(
            media=SUCCESS_BUY_PLAYER, caption=f"✅ Ви купили гравця {char.name} за {transfer.price} монет!"
        )
    )
    await callback.bot.send_message(
        chat_id=seller_id,
        text=f"Вітаємо! 🎉\n💰 Вашого гравця <b>{char.name}</b> купили за {transfer.price} монет!\n\n"
             f"Баланс поповнено на <b>{transfer.price}</b> монет."
    )


# === Хэндлер: список игроков ===
@transfer_transfer_router.callback_query(F.data == 'exhibited_character')
async def list_my_players(query: types.CallbackQuery, state: FSMContext):
    user_id = query.from_user.id
    async for session in get_session():
        chars = await session.execute(
            select(Character)
            .where(Character.characters_user_id == user_id)
        )
        chars = chars.scalars().all()

        if not chars:
            await query.answer("❌ У вас немає гравців, яких можна продати.", show_alert=True)
            return

        kb = InlineKeyboardBuilder()
        for char in chars:
            kb.button(
                text=f"⚽ {char.name}",
                callback_data=f"show_char:{char.id}"
            )
        kb.row(
            InlineKeyboardButton(text="🔙 Назад", callback_data="back_to_list")
        )
        kb.adjust(1)
        await query.message.edit_media(
            media=InputMediaPhoto(
                media=MY_TRANSFERS,
                caption="📋 Оберіть гравця для продажу:"
            ),
            reply_markup=kb.as_markup()
        )


# === Хэндлер: показать инфу о выбранном игроке ===
@transfer_transfer_router.callback_query(F.data.startswith("show_char:"))
async def show_character(callback: types.CallbackQuery):
    char_id = int(callback.data.split(":")[1])

    async for session in get_session():
        char = await session.get(Character, char_id)
        if not char:
            await callback.answer("❌ Гравця не знайдено.", show_alert=True)
            return

        min_price = int(char.character_price * 0.8)
        fact_price = char.character_price

        text = (
            f"🏟 {char.name}\n"
            f"💪 Сила: {char.power}\n"
            f"🌟 Талант: {char.talent}\n"
            f"📅 Вік: {char.age}\n"
            f"💰 Фактична ціна: {fact_price}\n"
            f"🪙 Мінімальна ціна: {min_price}"
        )

        kb = InlineKeyboardBuilder()
        # Если уже есть трансфер => показываем кнопку "Зняти"
        if char.transfer:
            kb.button(
                text="❌ Зняти з трансферу",
                callback_data=f"remove_transfer:{char.transfer.id}"
            )
        else:
            # иначе — "Виставити"
            kb.button(
                text="📤 Виставити на трансфер",
                callback_data=f"sell:{char.id}"
            )

        kb.button(text="🔙 Назад", callback_data="exhibited_character")
        kb.adjust(1, 1)

        await callback.message.edit_media(
            media=InputMediaPhoto(media=MY_TRANSFERS, caption=text),
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

        min_price = int(char.character_price * 0.8)

        # сохраняем в state id игрока и минимальную цену
        await state.update_data(char_id=char_id, min_price=min_price)

        await state.set_state(SellPlayerFSM.waiting_for_price)

        await callback.message.answer(
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
    try:
        # добавляем игрока на трансфер
        await TransferCharacterService.create(
            characters_id=char_id,
            price=price,
            transfer_type=TransferType.TRANSFER
        )
    except IntegrityError:
        await message.answer("гравця вже виставлено на трансфері")
        return

    await state.clear()

    await message.answer_photo(
        photo=SUCCESS_EXHIBITED_TRANSFER,
        caption=f"✅ Гравця успішно виставлено на трансфер за {price} монет!"
    )
# === Зняти трансфер ===
@transfer_transfer_router.callback_query(F.data.startswith("remove_transfer:"))
async def remove_my_transfer(callback: types.CallbackQuery):
    transfer_id = int(callback.data.split(":")[1])
    transfer = await TransferCharacterService.get_by_id(transfer_id)
    user_id = callback.from_user.id

    if not transfer or transfer.character.characters_user_id != user_id:
        await callback.answer("❌ Неможливо зняти цей трансфер.", show_alert=True)
        return
    await TransferCharacterService.delete(transfer.id)

    await callback.answer("✅ Гравця знято з трансферу.", show_alert=True)