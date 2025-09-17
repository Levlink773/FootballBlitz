# routers/character_router.py
from __future__ import annotations

from datetime import timedelta
from types import SimpleNamespace
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from database.models.character import Character
from services.character_service import CharacterService  # Path may vary; adjust import to your project layout
from services.user_service import UserService

router = APIRouter(prefix="/characters", tags=["characters"])


# ---------- Pydantic request bodies ----------
class CharacterCreate(BaseModel):
    name: str
    talent: int = Field(0, ge=0)
    age: int = Field(0, ge=0)
    power: float = Field(0.0, ge=0.0)
    gender: Optional[str] = None
    country: Optional[str] = None
    # user id which will be owner (characters_user_id)
    user_id: int


class AddAmount(BaseModel):
    amount: float


class AddAge(BaseModel):
    amount: int


class EducationTimeUpdate(BaseModel):
    # Accept either seconds or minutes (seconds preferred).
    seconds: Optional[int] = None
    minutes: Optional[int] = None


# ---------- Helper serializer ----------
def character_to_dict(ch: Character) -> dict:
    """
    Convert SQLAlchemy Character instance to JSON-serializable dict.
    Tries to get basic relationships when present.
    """
    data = {
        "id": getattr(ch, "id", None),
        "characters_user_id": getattr(ch, "characters_user_id", None),
        "name": getattr(ch, "name", None),
        "age": getattr(ch, "age", None),
        "talent": getattr(ch, "talent", None),
        "power": getattr(ch, "power", None),
        "gender": getattr(ch, "gender").name if getattr(ch, "gender", None) is not None else None,
        "country": getattr(ch, "country").name if getattr(ch, "country", None) is not None else None,
        "created_at": getattr(ch, "created_at").isoformat() if getattr(ch, "created_at", None) else None,
        "training_key": getattr(ch, "training_key", None),
        "time_get_member_bonus": getattr(ch, "time_get_member_bonus").isoformat() if getattr(ch, "time_get_member_bonus", None) else None,
    }

    # optional relationships (owner, reminder, transfer)
    try:
        owner = getattr(ch, "owner", None)
        if owner:
            data["owner"] = {
                "user_id": getattr(owner, "user_id", None),
                "user_name": getattr(owner, "user_name", None),
                "team_name": getattr(owner, "team_name", None),
            }
    except Exception:
        pass

    try:
        reminder = getattr(ch, "reminder", None)
        if reminder:
            data["reminder"] = {
                "id": getattr(reminder, "id", None),
                "education_reward_date": getattr(reminder, "education_reward_date").isoformat() if getattr(reminder, "education_reward_date", None) else None,
            }
    except Exception:
        pass

    try:
        transfer = getattr(ch, "transfer", None)
        if transfer:
            data["transfer"] = {
                "id": getattr(transfer, "id", None),
                # add other transfer fields as needed
            }
    except Exception:
        pass

    # computed properties
    try:
        data["character_price"] = float(getattr(ch, "character_price", None)) if getattr(ch, "character_price", None) is not None else None
    except Exception:
        # property may raise if model incomplete
        data["character_price"] = None

    try:
        data["how_much_power_can_add"] = float(getattr(ch, "how_much_power_can_add", None)) if getattr(ch, "how_much_power_can_add", None) is not None else None
    except Exception:
        data["how_much_power_can_add"] = None

    return data


# ---------- Endpoints ----------

@router.get("/", response_model=List[dict])
async def get_all_characters():
    """Get all characters"""
    chars = await CharacterService.get_all_characters()
    if chars is None:
        return []
    return [character_to_dict(c) for c in chars]


@router.get("/end-training", response_model=List[dict])
async def get_characters_where_end_training():
    """
    Get characters whose owners finished registration and have reminders with education_reward_date >= 30 days ago.
    Mirrors CharacterService.get_all_characters_where_end_training
    """
    chars = await CharacterService.get_all_characters_where_end_training()
    if chars is None:
        return []
    return [character_to_dict(c) for c in chars]


@router.get("/recent-education", response_model=List[dict])
async def get_all_users_not_bot():
    """Get characters with reminder.education_reward_date >= 60 days ago"""
    chars = await CharacterService.get_all_users_not_bot()
    if chars is None:
        return []
    return [character_to_dict(c) for c in chars]


@router.get("/by-user/{user_id}", response_model=list[dict])
async def get_characters_by_user(user_id: int):
    """
    Get character by characters_user_id (owner id).
    Returns single character or 404.
    """
    chs = await CharacterService.get_characters(user_id)
    return [character_to_dict(ch) for ch in chs]
@router.get("/by-user-main/{user_id}", response_model=dict)
async def get_character_by_user(user_id: int):
    """
    Get character by characters_user_id (owner id).
    Returns single character or 404.
    """
    user = await UserService.get_user(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found for given user_id")
    return character_to_dict(user.main_character)

@router.get("/by-name/{character_name}", response_model=dict)
async def get_character_by_name(character_name: str):
    ch = await CharacterService.get_character_by_name(character_name)
    if not ch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found")
    return character_to_dict(ch)


@router.get("/{character_id}", response_model=dict)
async def get_character_by_id(character_id: int):
    ch = await CharacterService.get_character_by_id(character_id)
    if not ch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found")
    return character_to_dict(ch)


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_character(payload: CharacterCreate):
    """
    Create character.
    payload.user_id is required (the owner).
    """
    # Build a minimal object compatible with CharacterData used in service.
    data_obj = SimpleNamespace(
        name=payload.name,
        talent=payload.talent,
        age=payload.age,
        power=payload.power,
        gender=payload.gender,
        country=payload.country
    )
    try:
        ch = await CharacterService.create_character(data_obj, payload.user_id)
    except Exception as e:
        # bubble up a 400 with message
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    if not ch:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create character")
    return character_to_dict(ch)


@router.patch("/{character_id}/power", response_model=dict)
async def update_power(character_id: int, body: AddAmount):
    """Add power_to_add to character.power"""
    ch = await CharacterService.get_character_by_id(character_id)
    if not ch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found")
    updated = await CharacterService.update_power(ch, body.amount)
    return character_to_dict(updated)


@router.patch("/{character_id}/age", response_model=dict)
async def update_age(character_id: int, body: AddAge):
    ch = await CharacterService.get_character_by_id(character_id)
    if not ch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found")
    updated = await CharacterService.update_age(ch, body.amount)
    return character_to_dict(updated)


@router.post("/update-age-batch", response_model=List[dict])
async def update_age_characters():
    """
    Run the batch job that increments age for all characters and resets those >= 40.
    Returns list of characters that were considered 'old' and reset.
    """
    old_characters = await CharacterService.update_age_characters()
    if not old_characters:
        return []
    return [character_to_dict(c) for c in old_characters]


@router.post("/{character_id}/training-key/add", status_code=status.HTTP_204_NO_CONTENT)
async def add_training_key(character_id: int):
    """Increase training_key by 1"""
    await CharacterService.add_trainin_key(character_id)
    return {"detail": "ok"}


@router.post("/{character_id}/training-key/remove", status_code=status.HTTP_204_NO_CONTENT)
async def remove_training_key(character_id: int):
    """Decrease training_key by 1"""
    await CharacterService.remove_training_key(character_id)
    return {"detail": "ok"}


@router.post("/{character_id}/education-time", response_model=dict)
async def update_character_education_time(character_id: int, body: EducationTimeUpdate):
    """
    Update reminder.education_reward_date by adding provided time.
    Provide either 'seconds' or 'minutes' (seconds preferred).
    """
    ch = await CharacterService.get_character_by_id(character_id)
    if not ch:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Character not found")

    if body.seconds is None and body.minutes is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Provide 'seconds' or 'minutes'")

    seconds = body.seconds if body.seconds is not None else body.minutes * 60
    td = timedelta(seconds=seconds)

    merged = await CharacterService.update_character_education_time(ch, td)
    return character_to_dict(merged)
