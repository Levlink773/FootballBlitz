from aiogram import Router, F
from aiogram.types import Message, CallbackQuery

from api.monobank.create_payment import CreatePayment
from bot.keyboards.gym_keyboard import menu_massage_room, send_payment_keyboard
from bot.callbacks.massage_room_callbacks import SelectCountGetEnergy

from constants import CONST_PRICE_ENERGY, ENERGY_STORE_PHOTO
from config import CALLBACK_URL_WEBHOOK_ENERGY_BLITZ
from database.models.character import Character

from services.payment_service import PaymentServise


buy_energy_router = Router()

@buy_energy_router.message(F.text == "🏪🔋 Крамниця енергії")
async def massage_room_handler(message: Message):
    await message.answer_photo(
        photo=ENERGY_STORE_PHOTO,
        caption = (
        "⚡ Вітаємо у Крамниці Енергії! ⚡\n"
        "Тут ви можете придбати енергію для вашого персонажа 💪.\n"
        "Оновіть сили і продовжуйте свою подорож! 🌟"
        ), 
        reply_markup=menu_massage_room()
    )
    
@buy_energy_router.callback_query(F.data == "massage_room")
async def message_room_handler(query: CallbackQuery):
    await query.message.answer_photo(
        photo=ENERGY_STORE_PHOTO,
        caption = (
            "⚡ Вітаємо у Крамниці Енергії! ⚡\n"
            "Тут ви можете придбати енергію для вашого персонажа 💪.\n"
            "Оновіть сили і продовжуйте свою подорож! 🌟"
        ), 
        reply_markup=menu_massage_room()
    )

    
@buy_energy_router.callback_query(SelectCountGetEnergy.filter())
async def select_count_add_energy_handler(query: CallbackQuery, character: Character, callback_data: SelectCountGetEnergy):
    price_energy = CONST_PRICE_ENERGY[callback_data.count_energy]
    payment = CreatePayment(
        price=price_energy,
        name_product=f"Buy {callback_data.count_energy} energy",
        webhook_url = CALLBACK_URL_WEBHOOK_ENERGY_BLITZ
    )
    url_payment_response = await payment.send_request()
    if not url_payment_response:
        return await query.answer("Произошла ошибка при создании платежа")
    
    order_id = url_payment_response['invoiceId']
    url_payment = url_payment_response['pageUrl']
    payment = await PaymentServise.create_payment(
        price=price_energy,
        user_id=character.characters_user_id,
        order_id=order_id
    )    
    await PaymentServise.create_energy_payment(
        order_id = payment.order_id,
        amount_energy = callback_data.count_energy
    )
    
    await query.message.answer(f"Купить 🔋 {callback_data.count_energy} за {price_energy} UAH",
                               reply_markup=send_payment_keyboard(url_payment))
