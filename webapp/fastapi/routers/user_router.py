# routers/user_router.py
from __future__ import annotations

import datetime
import random
from typing import List, Optional, Literal

from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel, Field
from starlette.responses import JSONResponse

from config import Country
from constants import lootboxes
from database.models.character import Character
from database.models.types import TypeBox
from database.models.user_bot import UserBot, STATUS_USER_REGISTER
from logging_config import logger
from services.character_service import CharacterService
from services.user_service import UserService  # поправьте путь если нужно
from utils.generate_character import get_character, CharacterData
from utils.referal_utils import reward_referal

router = APIRouter(prefix="/users", tags=["users"])

class CharacterPublic(BaseModel):
    id: int
    name: str
    age: int
    talent: int
    power: float
    country: Country
    # ... other character fields you want to show

    class Config:
        from_attributes = True


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
    # Додані поля для рейтингу за перемогами
    precent_winner_matches: Optional[float] = 0.0
    final_winner_matches: Optional[int] = 0
    final_count_of_matches: Optional[int] = 0

    class Config:
        from_attributes = True
class UserPublicWithCharacter(UserPublic):
    main_character: Optional[CharacterPublic] = None

class UserPositionResponse(BaseModel):
    """
    Модель для відповіді про позицію користувача в рейтингу.
    """
    user_id: int
    user_name: Optional[str] = None
    position: int
    total_users: int
    # Поля для відображення статистики
    points: Optional[int] = 0
    precent_winner_matches: Optional[float] = 0.0
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
class ReferralCountResponse(BaseModel):
    count: int

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
        "referal_user_id": getattr(u, "referal_user_id", None),
        "team_name": getattr(u, "team_name", None),
        "points": getattr(u, "points", None),
        "vip_pass_expiration_date": getattr(u, "vip_pass_expiration_date").isoformat() if getattr(u,
                                                                                                  "vip_pass_expiration_date",
                                                                                                  None) else None,
        "count_play_blitz": getattr(u, "count_play_blitz", 0),
        "count_rich_semi_final_blitz": getattr(u, "count_rich_semi_final_blitz", 0),
        "count_rich_final_looser_blitz": getattr(u, "count_rich_final_looser_blitz", 0),
        "count_rich_final_winner_blitz": getattr(u, "count_rich_final_winner_blitz", 0),
        "count_of_small_box": getattr(u, "count_of_small_box", 0),
        "count_of_medium_box": getattr(u, "count_of_medium_box", 0),
        "count_of_big_box": getattr(u, "count_of_big_box", 0),
        "count_go_to_gym": getattr(u, "count_go_to_gym", 0),
        "final_count_of_matches": getattr(u, "final_count_of_matches", 0),
        "final_winner_matches": getattr(u, "final_winner_matches", 0),
        "final_count_of_blitz": getattr(u, "final_count_of_blitz", 0),
        "main_character_id": getattr(u, "main_character_id", None),
        "status_register": getattr(u, "status_register").name if getattr(u, "status_register", None) else None,
        "count_of_training": getattr(u, "count_of_training", 0),
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


# --- НОВІ ЕНДПОІНТИ ДЛЯ РЕЙТИНГІВ ---

@router.get("/ranking/seasonal", response_model=List[UserPublic])
async def get_seasonal_ranking(limit: int = 100, offset: int = 0):
    """
    Повертає список користувачів, відсортованих за очками (рейтинг сезону).
    Сортування: за `points` (спадання), для однакових значень - за `id` (зростання).
    """
    users = await UserService.get_all_users()
    if not users:
        return []

    # Сортуємо в пам'яті. Для великих баз даних краще використовувати сортування на рівні запиту до БД.
    sorted_users = sorted(users, key=lambda u: (-(u.points or 0), u.id))

    return sorted_users[offset: offset + limit]


@router.get("/ranking/win-rate", response_model=List[UserPublic])
async def get_win_rate_ranking(limit: int = 100, offset: int = 0):
    """
    Повертає список користувачів, відсортованих за відсотком перемог.
    Сортування: за `precent_winner_matches` (спадання),
                 потім за `final_count_of_matches` (спадання),
                 для однакових значень - за `id` (зростання).
    """
    users = await UserService.get_all_users()
    if not users:
        return []

    # Використовуємо @property `precent_winner_matches` для сортування
    sorted_users = sorted(
        users,
        key=lambda u: (
            -u.precent_winner_matches,
            -(u.final_count_of_matches or 0),
            u.id
        ),
    )

    return sorted_users[offset: offset + limit]


# Цей ендпоінт замінює старий /ranking/position. Він більш гнучкий.
@router.get("/ranking/my-position", response_model=UserPositionResponse)
async def get_my_position_in_ranking(user_id: int, rating_type: Literal['seasonal', 'win_rate']):
    """
    Знаходить та повертає позицію конкретного користувача у вказаному типі рейтингу.
    """
    users = await UserService.get_all_users()
    if not users:
        raise HTTPException(status_code=404, detail="В системі ще немає користувачів")

    if rating_type == 'seasonal':
        sorted_users = sorted(users, key=lambda u: (-(u.points or 0), u.id))
    elif rating_type == 'win_rate':
        sorted_users = sorted(
            users,
            key=lambda u: (-u.precent_winner_matches, -(u.final_count_of_matches or 0), u.id),
        )
    else:
        raise HTTPException(status_code=400, detail="Невірний тип рейтингу. Використовуйте 'seasonal' або 'win_rate'")

    position = -1
    target_user = None
    for i, u in enumerate(sorted_users, start=1):
        if u.user_id == user_id:
            position = i
            target_user = u
            break

    if not target_user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено в рейтингу")

    return UserPositionResponse(
        user_id=target_user.user_id,
        user_name=target_user.user_name,
        position=position,
        total_users=len(sorted_users),
        points=target_user.points,
        precent_winner_matches=target_user.precent_winner_matches
    )

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
@router.post("/{user_id}/claim-first-character", response_model=UserPublicWithCharacter, status_code=status.HTTP_200_OK)
async def claim_first_character_endpoint(user_id: int):
    """
    Generates and assigns the first character to the user and ends registration.
    """
    user = await UserService.get_user(user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.main_character:
        raise HTTPException(status_code=400, detail="User already has a character")

    # This logic is copied from your aiogram handler
    # 1. Create character
    character_data: CharacterData = await get_character() # Assuming this function is available
    character: Character = await CharacterService.create_character(character_data, user.user_id)
    # await RemniderCharacterService.create_character_reminder(character_id=character.id) # Optional reminder logic

    # 2. Assign as main character and update status
    user = await UserService.assign_main_character_if_none(user.user_id)
    await UserService.edit_status_register(user_id, STATUS_USER_REGISTER.FIRST_TRAINING)

    # 3. Add energy bonus
    await UserService.add_energy_user(user.user_id, 200)

    # 4. Fetch the final user state with the character loaded for the response
    final_user = await UserService.get_user(user_id=user.user_id) # Refetch to get populated relationships
    if not final_user:
        raise HTTPException(status_code=500, detail="Could not retrieve final user state")

    # Manually serialize to include character details if your helper doesn't
    # But using a proper Pydantic response model is better.
    # To use UserPublicWithCharacter, ensure your UserService.get_user loads the relationship.
    # The `lazy="selectin"` in your UserBot model should handle this.
    return final_user


class OpenBoxRequest(BaseModel):
    box_type: str  # e.g., "SMALL_BOX", "MEDIUM_BOX", "LARGE_BOX"


# In a separate service file (e.g., services/box_service.py)
async def open_box_for_webapp(user_id: int, box_type_str: str):
    # 1. Get user and validate box type
    user = await UserService.get_user(user_id=user_id)
    try:
        box_type_enum = TypeBox[box_type_str]
    except KeyError:
        raise HTTPException(status_code=400, detail="Invalid box type")

    # 2. Check if user has the box
    if box_type_enum == TypeBox.SMALL_BOX and (user.count_of_small_box or 0) <= 0:
        raise HTTPException(status_code=400, detail="No small boxes left")
    elif box_type_enum == TypeBox.MEDIUM_BOX and (user.count_of_medium_box or 0) <= 0:
        raise HTTPException(status_code=400, detail="No medium boxes left")
    elif box_type_enum == TypeBox.LARGE_BOX and (user.count_of_big_box or 0) <= 0:
        raise HTTPException(status_code=400, detail="No large boxes left")

    # 3. Calculate rewards (using your existing logic)
    info_lootbox = lootboxes.get(box_type_enum)
    energy_reward = random.randint(info_lootbox["min_energy"], info_lootbox["max_energy"])
    money_reward = random.randint(info_lootbox["min_money"], info_lootbox["max_money"])

    await UserService.add_money_user(
        user_id=user.user_id,
        amount_money_add=money_reward,
    )
    await UserService.add_energy_user(
        user_id=user.user_id,
        amount_energy_add=energy_reward,
    )
    if box_type_enum == TypeBox.LARGE_BOX:
        await UserService.add_count_of_big_box(user.user_id, -1)
    elif box_type_enum == TypeBox.MEDIUM_BOX:
        await UserService.add_count_of_medium_box(user.user_id, -1)
    elif box_type_enum == TypeBox.SMALL_BOX:
        await UserService.add_count_of_small_box(user.user_id, -1)
    user = await UserService.get_user(user_id=user_id)
    # 5. Return the fully updated user object
    return user


# --- Define API Route ---
@router.post("/{user_id}/open-box", response_model=dict)  # Assuming you have a Pydantic schema for the user
async def handle_open_box(user_id: int, request: OpenBoxRequest):
    updated_user = await open_box_for_webapp(user_id, request.box_type)
    return user_to_dict(updated_user)


# ✨ НОВИЙ ЕНДПОІНТ: Отримати всіх персонажів користувача
@router.get("/{user_id}/all", response_model=List[CharacterPublic])
async def get_all_characters_for_user(user_id: int):
    """
    Повертає список усіх персонажів, що належать вказаному користувачеві.
    """
    user = await UserService.get_user(user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    # SQLAlchemy relationship 'characters' автоматично завантажить їх
    return user.characters

class SetMainCharacterRequest(BaseModel):
    character_id: int
# ✨ НОВИЙ ЕНДПОІНТ: Встановити головного персонажа
@router.post("/{user_id}/set-main", response_model=dict)
async def set_main_character(user_id: int, body: SetMainCharacterRequest):
    """
    Встановлює нового головного персонажа для користувача.
    """
    user = await UserService.get_user(user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    # Перевірка, чи належить персонаж цьому користувачу
    character_ids = [c.id for c in user.characters]
    if body.character_id not in character_ids:
        raise HTTPException(status_code=403, detail="Цей персонаж не належить вам")

    user.main_character_id = body.character_id
    await UserService.update_main_character(user.user_id, body.character_id)

    # Повертаємо оновлений об'єкт користувача
    return user_to_dict(user)  # Використовуємо ваш існуючий серіалізатор


@router.get(
    "/{user_id}/count_of_ref",  # Используем путь из твоего React-кода (с опечаткой "coutn")
    response_model=ReferralCountResponse,
    summary="Get referral count for a user"
)
async def get_user_referral_count(user_id: int):
    """
    Получает общее количество рефералов для указанного user_id.
    """
    try:
        # Вызываем новый, эффективный метод сервиса
        count = await UserService.get_my_referals_count(user_id)

        # Возвращаем ответ в формате {"count": <число>}
        return ReferralCountResponse(count=count)

    except Exception as e:
        # Если в методе сервиса произошла ошибка, ловим ее
        # и возвращаем клиенту стандартную ошибку 500
        print(f"Failed to get referral count for user {user_id}: {e}")  # Логирование
        raise HTTPException(
            status_code=500,
            detail="Could not fetch referral count."
        )


@router.post("/{user_id}/trigger-referral-reward", status_code=status.HTTP_200_OK)
async def trigger_referral_reward(user_id: int):
    """
    Ручка для ручного або автоматичного виклику нагороди рефералу.
    Приймає ID користувача (нового гравця), знаходить його реферера і нагороджує.
    """
    # 1. Знаходимо користувача
    user = await UserService.get_user(user_id=user_id)

    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    if not user.referal_user_id:
        raise HTTPException(status_code=400, detail="Цей користувач не має реферера (referal_user_id is None)")

    # 2. Викликаємо логіку нагороди
    await reward_referal(user)

    return {"status": "success", "message": f"Referral logic triggered for user {user_id}"}