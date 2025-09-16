# routers/blitz_router.py
from __future__ import annotations
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from blitz.blitz_match.core.manager import TeamBlitzMatchManager
from blitz.services.blitz_service import BlitzService
from logging_config import logger

# Подправь пути импорта под вашу структуру, если нужно
from services.user_service import UserService

from blitz.exception import (
    BlitzCloseError,
    UserExistsInBlitzError,
    MaxUsersInBlitzError,
    UserForbiddenError,
)

from database.models.blitz import BlitzType, Blitz

router = APIRouter(prefix="/blitz", tags=["blitz"])

# Копия маппинга лимитов (как в aiogram router)
BLITZ_LIMITS = {
    BlitzType.VIP_BLITZ_V8: 8,
    BlitzType.BLITZ_V8: 8,
    BlitzType.BLITZ_V16: 16,
    BlitzType.BLITZ_V32: 32,
    BlitzType.BLITZ_V64: 64,
}

BLITZ_TYPE_NAMES = {
    BlitzType.VIP_BLITZ_V8: "VIP Бліц (8)",
    BlitzType.BLITZ_V8: "Бліц (8)",
    BlitzType.BLITZ_V16: "Бліц (16)",
    BlitzType.BLITZ_V32: "Бліц (32)",
    BlitzType.BLITZ_V64: "Бліц (64)",
}


# ---------- Pydantic response/request models ----------
class RegisterRequest(BaseModel):
    user_id: int


class RegisterResponse(BaseModel):
    ok: bool
    message: str
    blitz_id: Optional[int] = None


class ParticipantsResponse(BaseModel):
    blitz_id: Optional[int]
    start_at: Optional[datetime]
    blitz_type: Optional[str]
    participants_count: int = 0
    max_participants: Optional[int] = None


class BlitzResponse(BaseModel):
    seconds_remaining: int
    info: dict[str, str] = {"title": "", "participants": ""}


# ---------- Helpers ----------
def _minutes_left_to_start(start_at: datetime) -> int:
    delta = start_at - datetime.now()
    return max(0, int(delta.total_seconds() // 60))

class ActiveBlitzResponse(BaseModel):
    active: bool
    count: int = 0
    match_ids: List[str] = []


@router.get("/active", response_model=ActiveBlitzResponse)
async def blitz_is_active():
    """
    Возвращает информацию, есть ли активные блиц-матчи в TeamBlitzMatchManager.
    active = True, если есть хотя бы один матч.
    count = количество матчей
    match_ids = список blitz_match_id
    """
    if TeamBlitzMatchManager is None:
        # Если менеджер не импортировался — логируем и возвращаем "неактивно"
        logger.warning("TeamBlitzMatchManager not available - cannot determine active blitz matches")
        return ActiveBlitzResponse(active=False, count=0, match_ids=[])

    try:
        matches_dict = getattr(TeamBlitzMatchManager, "all_matches", {}) or {}
        match_ids = list(matches_dict.keys())
        count = len(match_ids)
        return ActiveBlitzResponse(active=count > 0, count=count, match_ids=match_ids)
    except Exception as e:
        logger.exception("Error while checking active blitz matches: %s", e)
        # на ошибке возвращаем безопасный ответ
        return ActiveBlitzResponse(active=False, count=0, match_ids=[])
# ---------- Endpoints ----------
@router.post("/{blitz_id}/register", response_model=RegisterResponse)
async def register_to_blitz(blitz_id: int, body: RegisterRequest):
    """
    Регистрация пользователя в блиц.
    Телo: {"user_id": <telegram_id>}
    """
    user_id = body.user_id

    # Получаем пользователя (включая characters и main_character, UserService.get_user делает selectinload)
    user = await UserService.get_user(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")

    # Проверки как в aiogram handler
    if (not getattr(user, "main_character", None)) or (not getattr(user, "characters", None)):
        return RegisterResponse(ok=False, message="У вас немає головного персонажа!", blitz_id=None)

    # получаем блиц
    blitz = await BlitzService.get_blitz_by_id(blitz_id)
    if not blitz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Бліц з id {blitz_id} не знайдено")

    # проверка времени регистрации: в aiogram использовалась логика minutes_left < 20 (обычно) и <30 для VIP
    minutes_left = _minutes_left_to_start(blitz.start_at)
    is_vip_blitz = blitz.blitz_type == BlitzType.VIP_BLITZ_V8

    can_register_window = (minutes_left < 20) or (minutes_left < 30 and user.vip_pass_is_active)
    if not can_register_window:
        # если регистрация вне окна — вернуть соответствующее сообщение
        return RegisterResponse(ok=False, message="Реєстрація ще не відкрита (або вже закінчилась).", blitz_id=blitz_id)

    # проверка энергии пользователя (в aiogram это делалось ранее)
    cost = getattr(blitz, "cost", 0)
    if getattr(user, "energy", 0) < cost:
        return RegisterResponse(ok=False, message="Недостатньо енергії для реєстрації.", blitz_id=blitz_id)

    # узнаем max participants по типу блица
    max_chars = BLITZ_LIMITS.get(blitz.blitz_type, 16)

    # Попытка добавить пользователя (BlitzService.add_users_to_blitz будет проверять дубликаты, VIP и лимит)
    try:
        await BlitzService.add_users_to_blitz(blitz_id, user, max_chars)
        # Списать энергию
        consumed = await UserService.consume_energy(user.user_id, cost)
        if not consumed:
            # возможно race: добавили в блиц, но не хватило энергии — удалим запись?
            # Лучше откат: вернуть ошибку и (опционально) удалить добавленного BlitzUser.
            # Для простоты возвращаем ошибку и логируем — в реальном продакшне стоит сделать транзакционный outbox/компенсацию.
            logger.error("User added to blitz but failed to consume energy user_id=%s blitz_id=%s", user.user_id, blitz_id)
            raise HTTPException(status_code=500, detail="Не вдалося списати енергію після реєстрації")
    except BlitzCloseError:
        return RegisterResponse(ok=False, message="Реєстрацію на бліц закрито.", blitz_id=blitz_id)
    except UserExistsInBlitzError:
        return RegisterResponse(ok=False, message="Ви вже зареєстровані на цей бліц.", blitz_id=blitz_id)
    except MaxUsersInBlitzError:
        return RegisterResponse(ok=False, message="Реєстрація завершена — кількість учасників досягла максимуму.", blitz_id=blitz_id)
    except UserForbiddenError:
        return RegisterResponse(ok=False, message="Цей бліц доступний лише для VIP-гравців.", blitz_id=blitz_id)
    except Exception as e:
        logger.exception("Unexpected error when registering user %s to blitz %s: %s", user_id, blitz_id, e)
        raise HTTPException(status_code=500, detail="Внутрішня помилка при реєстрації")

    return RegisterResponse(ok=True, message="Успішна реєстрація на бліц", blitz_id=blitz_id)


@router.get("/next/participants", response_model=ParticipantsResponse)
async def next_blitz_participants():
    """
    Возвращает информацию о ближайшем грядущем блице:
    - blitz_id, start_at, blitz_type, participants_count, max_participants
    Если нет будущих блиц -> возвращает поля с None и participants_count 0.
    """
    blitz_list = await BlitzService.get_all_blitz()
    if not blitz_list:
        return ParticipantsResponse(blitz_id=None, start_at=None, blitz_type=None, participants_count=0, max_participants=None)

    now = datetime.now()
    future = [b for b in blitz_list if b.start_at > now]
    if not future:
        return ParticipantsResponse(blitz_id=None, start_at=None, blitz_type=None, participants_count=0, max_participants=None)

    next_blitz = sorted(future, key=lambda b: b.start_at)[0]
    max_part = BLITZ_LIMITS.get(next_blitz.blitz_type, None)
    participants_count = len(getattr(next_blitz, "users", []) or [])

    return ParticipantsResponse(
        blitz_id=next_blitz.id,
        start_at=next_blitz.start_at,
        blitz_type=BLITZ_TYPE_NAMES.get(next_blitz.blitz_type, str(next_blitz.blitz_type)),
        participants_count=participants_count,
        max_participants=max_part
    )


@router.get("/next", response_model=BlitzResponse)
async def seconds_to_next_blitz():
    """
    Возвращает количество секунд до ближайшего грядущего блица.
    Если нет будущих или ближайший уже начался — возвращает 0.
    """
    blitz_list = await BlitzService.get_all_blitz()
    if not blitz_list:
        return BlitzResponse(seconds_remaining=0)

    now = datetime.now()
    future = [b for b in blitz_list if b.start_at > now]
    if not future:
        return BlitzResponse(seconds_remaining=0)

    next_blitz: Blitz = sorted(future, key=lambda b: b.start_at)[0]
    seconds = max(0, int((next_blitz.start_at - now).total_seconds()))
    return BlitzResponse(seconds_remaining=seconds, info={
        "title": BLITZ_TYPE_NAMES.get(next_blitz.blitz_type, str(next_blitz.blitz_type)),
        "participants": f"{len(next_blitz.users)} / {BLITZ_LIMITS.get(next_blitz.blitz_type, None)}",
    })
