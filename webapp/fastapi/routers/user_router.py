# routers/user_router.py
from __future__ import annotations

import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel, Field
from starlette.responses import JSONResponse

from database.models.user_bot import UserBot, STATUS_USER_REGISTER
from logging_config import logger
from services.user_service import UserService  # поправьте путь если нужно

router = APIRouter(prefix="/users", tags=["users"])


# ИЗМЕНИТЕ ЭТИ МОДЕЛИ
class UserPublic(BaseModel):
    id: int
    user_id: int
    user_name: Optional[str] = None
    user_full_name: Optional[str] = None
    user_time_register: Optional[datetime.datetime] = None
    money: Optional[int] = None
    energy: Optional[int] = None
    team_name: Optional[str] = None
    points: Optional[int] = None
    vip_pass_is_active: bool = False
    status_register: Optional[str] = None
    league: str = "Вища ліга" # <-- ДОБАВЛЕНО ПОЛЕ ЛИГИ

    class Config:
        from_attributes = True


class UserRank(BaseModel):
    user_id: int
    user_name: Optional[str] = None # <-- изменено с username для консистентности
    points: int
    position: int
    total_users: int
    league: str = "Вища ліга" # <-- ДОБАВЛЕНО ПОЛЕ ЛИГИ


# ----------------- Pydantic схемы -----------------
class UserCreate(BaseModel):
    user_id: int
    user_name: Optional[str] = None
    user_full_name: Optional[str] = None
    team_name: Optional[str] = None
    money: Optional[int] = 0
    energy: Optional[int] = 0
    points: Optional[int] = 0


class EditStatus(BaseModel):
    status: STATUS_USER_REGISTER


class EditTeamName(BaseModel):
    team_name: str


class AmountInt(BaseModel):
    amount: int = Field(..., ge=0)


class AddEnergyBody(BaseModel):
    amount: int = Field(...)


class UpdateMainCharacterBody(BaseModel):
    new_main_character_id: int


class AddRatingBody(BaseModel):
    rating_to_add: int = Field(...)


class AddEnergyToUsersBody(BaseModel):
    user_ids: List[int]
    amount: int = Field(...)

# ----------------- helper сериализатор -----------------
def user_to_dict(u: UserBot) -> dict:
    if u is None:
        return {}
    data = {
        "id": getattr(u, "id", None),
        "user_id": getattr(u, "user_id", None),
        "user_name": getattr(u, "user_name", None),
        "user_full_name": getattr(u, "user_full_name", None),
        "user_time_register": getattr(u, "user_time_register").isoformat() if getattr(u, "user_time_register",
                                                                                      None) else None,
        "money": getattr(u, "money", None),
        "energy": getattr(u, "energy", None),
        "team_name": getattr(u, "team_name", None),
        "points": getattr(u, "points", None),
        "vip_pass_expiration_date": getattr(u, "vip_pass_expiration_date").isoformat() if getattr(u,
                                                                                                  "vip_pass_expiration_date",
                                                                                                  None) else None,
        "count_play_blitz": getattr(u, "count_play_blitz", 0),
        "count_rich_semi_final_blitz": getattr(u, "count_rich_semi_final_blitz", 0),
        "count_rich_final_looser_blitz": getattr(u, "count_rich_final_looser_blitz", 0),
        "count_rich_final_winner_blitz": getattr(u, "count_rich_final_winner_blitz", 0),
        "count_go_to_gym": getattr(u, "count_go_to_gym", 0),
        "final_count_of_matches": getattr(u, "final_count_of_matches", 0),
        "final_winner_matches": getattr(u, "final_winner_matches", 0),
        "final_count_of_blitz": getattr(u, "final_count_of_blitz", 0),
        "main_character_id": getattr(u, "main_character_id", None),
        "status_register": getattr(u, "status_register").name if getattr(u, "status_register", None) else None,
    }

    # небольшие удобства
    try:
        data["vip_pass_is_active"] = u.vip_pass_is_active
    except Exception:
        data["vip_pass_is_active"] = False
    try:
        data["precent_winner_matches"] = u.precent_winner_matches
    except Exception:
        data["precent_winner_matches"] = 0

    try:
        data["team_name_user"] = u.team_name_user
    except Exception:
        data["team_name_user"] = data["team_name"]

    return data


# ----------------- Endpoints -----------------

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_user(payload: UserCreate):
    """
    Создать пользователя. Все ключи идут напрямую в UserBot конструктор.
    """
    try:
        obj = await UserService.create_user(**payload.dict())
        if not obj:
            raise HTTPException(status_code=500, detail="Не удалось создать пользователя")
        return user_to_dict(obj)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ЗАМЕНИТЕ ЭТОТ ENDPOINT
@router.get("/ranking", response_model=List[UserPublic])
async def users_ranking(limit: Optional[int] = 100, offset: int = 0):
    """
    Возвращает список пользователей, отсортированных по points (desc).
    """
    users = await UserService.get_all_users()
    if not users:
        return []

    # Сортируем пользователей по очкам (points) в порядке убывания
    sorted_users = sorted(users, key=lambda u: (u.points or 0), reverse=True)

    # Берем срез для пагинации
    sliced = sorted_users[offset: offset + limit]

    # FastAPI автоматически преобразует список объектов SQLAlchemy (sliced)
    # в список объектов UserPublic благодаря response_model и Config.from_attributes = True
    return sliced


# ЗАМЕНИТЕ ЭТОТ ENDPOINT
@router.get("/ranking/position", response_model=UserRank)
async def user_position(user_id: Optional[int] = Query(None), username: Optional[str] = Query(None)):
    """
    Возвращает позицию пользователя в рейтинге (1 = первый).
    Можно искать по user_id или по username (передайте хотя бы одно).
    Алгоритм: сортируем по points desc, затем по id asc для детерминированного разрешения ничьих.
    """
    if user_id is None and username is None:
        raise HTTPException(status_code=400, detail="Нужно передать user_id или username")

    users = await UserService.get_all_users()
    if not users:
        raise HTTPException(status_code=404, detail="Пользователей нет")

    # Сортируем: сначала по points (desc), затем по id (asc) чтобы одинаковые очки были детерминированно упорядочены
    # Сразу используем объекты, без конвертации в dict
    sorted_users = sorted(users, key=lambda u: (-(u.points or 0), u.id))

    # Найдём целевого пользователя
    target_user_obj = None
    position = -1
    for i, u in enumerate(sorted_users, start=1):
        if user_id is not None and u.user_id == user_id:
            target_user_obj = u
            position = i
            break
        if username is not None and u.user_name == username:
            target_user_obj = u
            position = i
            break

    if target_user_obj is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    return UserRank(
        user_id=target_user_obj.user_id,
        user_name=target_user_obj.user_name,
        points=target_user_obj.points or 0,
        position=position,
        total_users=len(sorted_users),
        # league уже имеет значение по умолчанию, но можно и так:
        # league="Вища ліга"
    )

@router.get("/", response_model=List[dict])
async def get_all_users():
    users = await UserService.get_all_users()
    if not users:
        return []
    return [user_to_dict(u) for u in users]


@router.get("/end-register", response_model=List[dict])
async def get_all_users_where_end_register():
    users = await UserService.get_all_users_where_end_register()
    if not users:
        return []
    return [user_to_dict(u) for u in users]


@router.get("/{user_id}", response_model=dict)
async def get_user(user_id: int):
    user = await UserService.get_user(user_id=user_id)
    logger.info(f"User: {user}")
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user_to_dict(user)


@router.patch("/{user_id}/status", response_model=dict)
async def edit_status_register(user_id: int, body: EditStatus):
    try:
        await UserService.edit_status_register(user_id, body.status)
        user = await UserService.get_user(user_id)
        return user_to_dict(user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{user_id}/assign-main", response_model=dict)
async def assign_main_character_if_none(user_id: int):
    user = await UserService.assign_main_character_if_none(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user_to_dict(user)


@router.patch("/{user_id}/team", response_model=dict)
async def edit_team_name(user_id: int, body: EditTeamName):
    try:
        await UserService.edit_team_name(user_id, body.team_name)
        user = await UserService.get_user(user_id)
        return user_to_dict(user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{user_id}/anulate-statistics", status_code=status.HTTP_204_NO_CONTENT)
async def anulate_statistics(user_id: int):
    try:
        await UserService.anulate_statistics(user_id)
        return {"detail": "ok"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{user_id}/energy/add", response_model=dict)
async def add_energy_user(user_id: int, body: AddEnergyBody):
    user = await UserService.add_energy_user(user_id, body.amount)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user_to_dict(user)


@router.post("/{user_id}/energy/consume", response_model=dict)
async def consume_energy(user_id: int, body: AddEnergyBody):
    user = await UserService.consume_energy(user_id, body.amount)
    if not user:
        raise HTTPException(status_code=400, detail="Энергии не хватило или пользователь не найден")
    return user_to_dict(user)


@router.post("/{user_id}/money/add", response_model=dict)
async def add_money_user(user_id: int, body: AmountInt):
    try:
        await UserService.add_money_user(user_id, body.amount)
        user = await UserService.get_user(user_id)
        return user_to_dict(user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{user_id}/money/consume", response_model=dict)
async def consume_money(user_id: int, body: AmountInt):
    try:
        await UserService.consume_money(user_id, body.amount)
        user = await UserService.get_user(user_id)
        return user_to_dict(user)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{user_id}/rating/add", response_model=dict)
async def add_rating(user_id: int, body: AddRatingBody):
    res = await UserService.add_rating(user_id, body.rating_to_add)
    if not res.get("ok"):
        raise HTTPException(status_code=400, detail="Не удалось добавить рейтинг")
    # отдаем структуру: new_points и т.д.
    return res


@router.post("/{user_id}/counters/play-blitz", status_code=200)
async def add_count_play_blitz_user(user_id: int, body: AmountInt):
    try:
        await UserService.add_count_play_blitz_user(user_id, body.amount)
        return {"detail": "ok"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{user_id}/counters/rich-semi", status_code=200)
async def add_count_rich_semi_final_blitz_user(user_id: int, body: AmountInt):
    try:
        await UserService.add_count_rich_semi_final_blitz_user(user_id, body.amount)
        return {"detail": "ok"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{user_id}/counters/rich-looser", status_code=200)
async def add_count_rich_final_looser_blitz_user(user_id: int, body: AmountInt):
    try:
        await UserService.add_count_rich_final_looser_blitz_user(user_id, body.amount)
        return {"detail": "ok"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{user_id}/counters/rich-winner", status_code=200)
async def add_count_rich_final_winner_blitz_user(user_id: int, body: AmountInt):
    try:
        await UserService.add_count_rich_final_winner_blitz_user(user_id, body.amount)
        return {"detail": "ok"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{user_id}/counters/gym", status_code=200)
async def add_count_go_to_gym_user(user_id: int, body: AmountInt):
    try:
        await UserService.add_count_go_to_gym_user(user_id, body.amount)
        return {"detail": "ok"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{user_id}/main-character", status_code=200)
async def update_main_character(user_id: int, body: UpdateMainCharacterBody):
    try:
        await UserService.update_main_character(user_id, body.new_main_character_id)
        user = await UserService.get_user(user_id)
        return user_to_dict(user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/update-energy-for-non-bots", status_code=204)
async def update_energy_for_non_bots():
    """
    Выполняет массовый апдейт энергии (VIP и обычных) согласно логике в сервисе.
    """
    try:
        await UserService.update_energy_for_non_bots()
        return {"detail": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/add-energy-to-users", status_code=200)
async def add_energy_to_users(body: AddEnergyToUsersBody):
    try:
        await UserService.add_energy_to_users(body.user_ids, body.amount)
        return {"detail": "ok"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/need-energy-update", response_model=List[dict])
async def get_users_how_update_energy():
    users = await UserService.get_users_how_update_energy()
    if not users:
        return []
    return [user_to_dict(u) for u in users]

# ----------------- Доп. ручка: рейтинг (top by points) -----------------
# ----------------- Доп. ручка: рейтинг (top by points) -----------------
