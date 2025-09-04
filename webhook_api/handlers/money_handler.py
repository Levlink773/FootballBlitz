from aiogram import Bot
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiohttp.web import Response

from config import BOT_TOKEN
from database.models.payment.money_payment import MoneyPayment
from services.payment_service import PaymentServise
from services.user_service import UserService
from webhook_api.schemas import MonoResultSchema
from ..base_endpoint import EndPoint, HTTPMethod


class MonoResultMoney(EndPoint):
    schema = MonoResultSchema
    data: MonoResultSchema
    method = HTTPMethod.POST
    bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))

    TEXT_TEMPLATE = """
<b>Ви оплатили замовлення, вам нараховано</b>: {amount_money} 💵
    """

    async def handle_request(self) -> Response:
        payment: MoneyPayment = await PaymentServise.get_payment(
            order_id=self.data.invoiceId,
            type_payment=MoneyPayment
        )

        if not payment:
            return

        if self.data.status != "success":
            return

        if payment.payment.status:
            return

        user = await UserService.get_user(payment.payment.user_id)

        await UserService.add_money_user(
            user_id=user.user_id,
            amount_money_add=payment.count_money
        )
        await self.bot.send_message(
            chat_id=payment.payment.user_id,
            text=self.TEXT_TEMPLATE.format(amount_money=payment.count_money)
        )
        await PaymentServise.change_payment_status(order_id=self.data.invoiceId)
        raise self.OK()
