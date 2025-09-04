from aiogram import Router, F
from aiogram.types import CallbackQuery

from api.monobank.create_payment import CreatePayment

from database.models.character import Character

from bot.callbacks.vip_pass_callbacks import SelectTypeVipPass
from bot.keyboards.vip_pass import (
    select_type_vip_pass,
    buy_vip_pass
)

from services.payment_service import PaymentServise

from constants import VIP_PASS_PHOTO
from config import CALLBACK_URL_WEBHOOK_VIP_PASS_BLITZ

from .types import vip_passes

vip_pass_router = Router()

@vip_pass_router.callback_query(
    F.data == "vip_pass"
)
async def select_type_vip_pass_handler(
    query: CallbackQuery,
):
    text = """
<b>Стати VIP — стань найкращим у грі!</b>

Ти готовий вийти на новий рівень і прокачати свого футболіста? Тоді <b>VIP Pass</b> — це те, що тобі потрібно!

🔥 <b>Що ти отримуєш з VIP Pass:</b>
 - <b>🔋 300 енергії</b> +150 за день! Тепер 300 енергії замість 150 — більше можливостей для досягнення успіху!
 - <b>👥 Двоє персонажів у команді</b> — прокачуй одразу двох героїв та досягай перемог швидше.
 - <b>🏆 Доступ до VIP-турнірів</b> — змагайся з найсильнішими та отримуй унікальні нагороди.
 - <b>💪 +5% успіху на тренуваннях</b> — покращуй свої результати ще швидше.
 - <b>⏰ Раннє сповіщення про Бліц-турнір</b> — отримуй повідомлення за 30 хвилин до початку, щоб бути на крок попереду інших.

💥 <b>Ціна на VIP Pass:</b>
- <b>7 днів</b> — всього 139 грн.
- <b>30 днів</b> — зі <b>знижкою 22%</b> за 390 грн.

Не упусти шанс стати сильнішим і швидшим за інших! Підвищуй свої шанси на перемогу, ставати VIP вже сьогодні! 💎
"""

    await query.message.answer_photo(
        photo = VIP_PASS_PHOTO,
        caption = text,
        reply_markup = select_type_vip_pass()
    )
    
@vip_pass_router.callback_query(
    SelectTypeVipPass.filter()
)
async def selected_type_vip_pass(
    query: CallbackQuery,
    callback_data: SelectTypeVipPass,
    character: Character
):
    current_vip_pass = vip_passes.get(callback_data.type_vip_pass) 
    
    text = """
<b>Ти обрав VIP Pass на {days} днів!</b>

Отримай максимум переваг для гри:
- <b>🔋 300 енергії</b> +150 за день! Тепер 300 енергії замість 150 — більше можливостей для досягнення успіху!
- <b>👥 Двоє персонажів у команді</b> — прокачуй одразу двох героїв та досягай перемог швидше.
- <b>🏆 Доступ до VIP-турнірів</b> — змагайся з найсильнішими та отримуй унікальні нагороди.
- <b>💪 +5% успіху на тренуваннях</b> — покращуй свої результати ще швидше.
- <b>⏰ Раннє сповіщення про Бліц-турнір</b> — отримуй повідомлення за 30 хвилин до початку, щоб бути на крок попереду інших.

💥 <b>Ціна:</b> {price} грн (<b>{daily_price:.0f} грн/день</b>)

Підтверди свій вибір, щоб стати VIP і насолоджуватися новими можливостями у грі! ⚽💎
""".format(
        days = current_vip_pass.duration,
        price = current_vip_pass.price,
        daily_price = current_vip_pass.day_price
    )
    payment = CreatePayment(
        price        = current_vip_pass.price,
        name_product = callback_data.type_vip_pass.name,
        webhook_url  = CALLBACK_URL_WEBHOOK_VIP_PASS_BLITZ
    )
    url_payment_response = await payment.send_request()
    if not url_payment_response:
        return await query.answer("Сталася помилка під час створення платежу")
    
    order_id = url_payment_response['invoiceId']
    url_payment = url_payment_response['pageUrl']
    
    await query.message.edit_caption(
        caption = text,
        reply_markup = buy_vip_pass(
            url_payment = url_payment,
            duration = current_vip_pass.duration
        )
    )

    payment = await PaymentServise.create_payment(
        price    = current_vip_pass.price,
        user_id  = character.characters_user_id,
        order_id = order_id,
    )
    
    await PaymentServise.create_vip_pass_payment(
        order_id = payment.order_id,
        type_vip_pass = callback_data.type_vip_pass
    )    


