from __future__ import annotations
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

# Adjust imports to your project layout
from services.vip_pass_service import VipPassService  # <- adjust path if needed
from services.user_service import UserService  # <- adjust path if needed
from database.models.user_bot import UserBot

router = APIRouter(prefix="/vip", tags=["vip"])


class VipUpdateRequest(BaseModel):
    user_id: int = Field(..., description="Telegram user id")
    day_vip_pass: int = Field(..., ge=1, description="Количество дней VIP для добавления")


def user_to_dict(u: UserBot) -> dict:
    if u is None:
        return {}
    return {
        "user_id": getattr(u, "user_id", None),
        "user_name": getattr(u, "user_name", None),
        "team_name": getattr(u, "team_name", None),
        "vip_pass_expiration_date": getattr(u, "vip_pass_expiration_date").isoformat() if getattr(u, "vip_pass_expiration_date", None) else None,
        "vip_pass_is_active": getattr(u, "vip_pass_expiration_date", None) is not None and getattr(u, "vip_pass_expiration_date") > datetime.now(),
        "energy": getattr(u, "energy", None),
        "points": getattr(u, "points", None),
    }


@router.post("/add-days", status_code=status.HTTP_200_OK)
async def add_vip_days(req: VipUpdateRequest):
    """Добавляет VIP-дней пользователю (увеличивает expiry)."""
    user = await UserService.get_user(req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    try:
        await VipPassService.update_vip_pass_time(user=user, day_vip_pass=req.day_vip_pass)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # return fresh user info
    user_fresh = await UserService.get_user(req.user_id)
    return user_to_dict(user_fresh)


@router.get("/active/{user_id}")
async def check_vip_active(user_id: int):
    """Проверяет активен ли VIP у пользователя и возвращает оставшееся время в секундах."""
    user = await UserService.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    vip_active = user.vip_pass_expiration_date is not None and user.vip_pass_expiration_date > datetime.now()
    seconds_remaining = 0
    if vip_active:
        seconds_remaining = int((user.vip_pass_expiration_date - datetime.now()).total_seconds())
        if seconds_remaining < 0:
            seconds_remaining = 0

    return {
        "user_id": user.user_id,
        "vip_pass_is_active": vip_active,
        "vip_pass_expiration_date": user.vip_pass_expiration_date.isoformat() if user.vip_pass_expiration_date else None,
        "seconds_remaining": seconds_remaining,
    }


@router.get("/active-users", response_model=List[dict])
async def get_vip_active_users():
    """Возвращает список пользователей, у которых VIP активен и энергия <= CONST_VIP_ENERGY (по логике сервиса)."""
    users = await VipPassService.get_have_vip_pass_characters()
    if not users:
        return []
    return [user_to_dict(u) for u in users]
