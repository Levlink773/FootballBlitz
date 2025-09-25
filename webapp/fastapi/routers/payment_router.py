from __future__ import annotations
from typing import Optional, Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from api.monobank.create_payment import CreatePayment
from bot.routers.stores.vip_pass.types import VipPassTypes
from services.payment_service import PaymentServise

# Adjust these imports to match your project structure
# The CreatePayment class (wrapper for Monobank) and PaymentServise are defined in your project

router = APIRouter(prefix="/payments", tags=["payments"])


class BasePaymentRequest(BaseModel):
    user_id: int = Field(..., description="Telegram user id (owner)")
    price: int = Field(..., ge=0, description="Price in UAH")
    name_product: str = Field(..., description="Name of product shown in payment")
    webhook_url: str = Field(..., description="Webhook URL that monobank will call on status change")


class MoneyPackRequest(BasePaymentRequest):
    count_money: int = Field(..., ge=0, description="How many coins will be credited")


class BoxRequest(BasePaymentRequest):
    type_box: Any = Field(..., description="Identifier of lootbox type (string/int/enum)")


class EnergyRequest(BasePaymentRequest):
    amount_energy: int = Field(..., ge=0, description="How much energy to add")


class VipPassRequest(BasePaymentRequest):
    type_vip_pass: str = Field(default="standard", description="Identifier of VIP pass (string/int/enum)")


def _prepare_result(url_resp: dict, created_payment) -> dict:
    invoice_id = url_resp.get("invoiceId")
    page_url = url_resp.get("pageUrl")
    return {
        "ok": True,
        "invoice_id": invoice_id,
        "page_url": page_url,
        "payment_db_order_id": getattr(created_payment, "order_id", None)
    }


@router.post("/money", status_code=status.HTTP_201_CREATED)
async def create_money_payment(req: MoneyPackRequest):
    """Create payment link for money pack and persist payment records."""
    payment_api = CreatePayment(price=req.price, name_product=req.name_product, webhook_url=req.webhook_url)
    url_resp = await payment_api.send_request()
    if not url_resp or "invoiceId" not in url_resp:
        raise HTTPException(status_code=500, detail="Не удалось создать платеж в платёжном шлюзе")

    order_id = url_resp["invoiceId"]
    page_url = url_resp.get("pageUrl")

    # persist general payment
    payment_obj = await PaymentServise.create_payment(price=req.price, user_id=req.user_id, order_id=order_id)
    if not payment_obj:
        raise HTTPException(status_code=500, detail="Не удалось сохранить запись платежа в БД")

    # persist money-specific record
    await PaymentServise.create_money_payment(order_id=payment_obj.order_id, count_money=req.count_money)

    return _prepare_result(url_resp, payment_obj)


@router.post("/box", status_code=status.HTTP_201_CREATED)
async def create_box_payment(req: BoxRequest):
    """Create payment link for lootbox and persist payment records."""
    payment_api = CreatePayment(price=req.price, name_product=req.name_product, webhook_url=req.webhook_url)
    url_resp = await payment_api.send_request()
    if not url_resp or "invoiceId" not in url_resp:
        raise HTTPException(status_code=500, detail="Не удалось создать платеж в платёжном шлюзе")

    order_id = url_resp["invoiceId"]

    payment_obj = await PaymentServise.create_payment(price=req.price, user_id=req.user_id, order_id=order_id)
    if not payment_obj:

        raise HTTPException(status_code=500, detail="Не удалось сохранить запись платежа в БД")

    await PaymentServise.create_box_payment(order_id=payment_obj.order_id, type_box=req.type_box)

    return _prepare_result(url_resp, payment_obj)


@router.post("/energy", status_code=status.HTTP_201_CREATED)
async def create_energy_payment(req: EnergyRequest):
    """Create payment link for energy and persist payment records."""
    payment_api = CreatePayment(price=req.price, name_product=req.name_product, webhook_url=req.webhook_url)
    url_resp = await payment_api.send_request()
    if not url_resp or "invoiceId" not in url_resp:
        raise HTTPException(status_code=500, detail="Не удалось создать платеж в платёжном шлюзе")

    order_id = url_resp["invoiceId"]

    payment_obj = await PaymentServise.create_payment(price=req.price, user_id=req.user_id, order_id=order_id)
    if not payment_obj:
        raise HTTPException(status_code=500, detail="Не удалось сохранить запись платежа в БД")

    await PaymentServise.create_energy_payment(order_id=payment_obj.order_id, amount_energy=req.amount_energy)

    return _prepare_result(url_resp, payment_obj)


@router.post("/vip", status_code=status.HTTP_201_CREATED)
async def create_vip_payment(req: VipPassRequest):
    """Create payment link for VIP pass and persist payment records."""
    payment_api = CreatePayment(price=req.price, name_product=req.name_product, webhook_url=req.webhook_url)
    url_resp = await payment_api.send_request()
    if not url_resp or "invoiceId" not in url_resp:
        raise HTTPException(status_code=500, detail="Не удалось создать платеж в платёжном шлюзе")

    order_id = url_resp["invoiceId"]

    payment_obj = await PaymentServise.create_payment(price=req.price, user_id=req.user_id, order_id=order_id)
    if not payment_obj:
        raise HTTPException(status_code=500, detail="Не удалось сохранить запись платежа в БД")
    type_vip_pass = VipPassTypes.seven_days_pass
    if req.type_vip_pass == 'standard':
        type_vip_pass = VipPassTypes.month_pass
    await PaymentServise.create_vip_pass_payment(order_id=payment_obj.order_id, type_vip_pass=type_vip_pass)

    return _prepare_result(url_resp, payment_obj)
