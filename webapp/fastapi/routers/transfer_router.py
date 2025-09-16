# routers/transfer_router.py
from __future__ import annotations
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from database.models.transfer_character import TransferType
from logging_config import logger
from services.transfer_service import TransferCharacterService

router = APIRouter(prefix="/transfers", tags=["transfers"])


# ---------- Pydantic схемы ----------
class TransferCreate(BaseModel):
    characters_id: int = Field(..., description="ID персонажа, который выставляют на трансфер")
    price: int = Field(..., ge=0, description="Цена трансфера")
    transfer_type: TransferType


class TransferUpdate(BaseModel):
    characters_id: Optional[int] = None
    price: Optional[int] = Field(None, ge=0)
    transfer_type: Optional[TransferType] = None


# ---------- Сериализатор ----------
def transfer_to_dict(t) -> dict:
    if not t:
        return {}

    character_data = None
    if t.character:  # Проверяем, что связь character существует
        owner_data = None
        if t.character.owner: # Проверяем, что у персонажа есть владелец
            owner_data = {
                "user_id": t.character.owner.user_id,
                # Добавьте сюда другие поля UserBot, которые могут понадобиться, например, username
                "username": getattr(t.character.owner, "username", f"user_{t.character.owner.user_id}")
            }

        character_data = {
            "id": t.character.id,
            "name": t.character.name,
            "age": t.character.age,
            "talent": t.character.talent,
            "power": t.character.power,
            "gender": t.character.gender.name if t.character.gender else None,
            "country": t.character.country.name if t.character.country else None,
            "owner": owner_data
            # Добавьте сюда другие поля Character, если нужно
        }

    return {
        "id": t.id,
        "characters_id": t.characters_id,
        "price": t.price,
        "transfer_type": t.transfer_type.name if t.transfer_type is not None else None,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "character": character_data  # <<< Главное добавление!
    }


# ---------- Endpoints ----------
@router.get("/", response_model=List[dict])
async def get_all_transfers():
    """
    Возвращает все записи TransferCharacter (фильтр уже внутри сервиса — .transfer_type == TransferType.TRANSFER).
    """
    transfers = await TransferCharacterService.get_all()
    if not transfers:
        return []
    return [transfer_to_dict(t) for t in transfers]
@router.get("/free_agents", response_model=List[dict])
async def get_all_transfers():
    """
    Возвращает все записи TransferCharacter (фильтр уже внутри сервиса — .transfer_type == TransferType.TRANSFER).
    """
    transfers = await TransferCharacterService.get_all_free_agents()
    if not transfers:
        return []
    return [transfer_to_dict(t) for t in transfers]

@router.get("/{transfer_id}", response_model=dict)
async def get_transfer_by_id(transfer_id: int):
    transfer = await TransferCharacterService.get_by_id(transfer_id)
    if not transfer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer not found")
    return transfer_to_dict(transfer)


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_transfer(payload: TransferCreate):
    try:
        transfer = await TransferCharacterService.create(
            characters_id=payload.characters_id,
            price=payload.price,
            transfer_type=payload.transfer_type
        )
        if not transfer:
            raise HTTPException(status_code=500, detail="Failed to create transfer")
        return transfer_to_dict(transfer)
    except Exception as e:
        logger.exception("create_transfer failed: %s", e)
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{transfer_id}", response_model=dict)
async def update_transfer(transfer_id: int, payload: TransferUpdate):
    try:
        transfer = await TransferCharacterService.update(
            transfer_id=transfer_id,
            characters_id=payload.characters_id,
            price=payload.price,
            transfer_type=payload.transfer_type
        )
        if transfer is None:
            raise HTTPException(status_code=404, detail="Transfer not found")
        return transfer_to_dict(transfer)
    except Exception as e:
        logger.exception("update_transfer failed: %s", e)
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{transfer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transfer(transfer_id: int):
    try:
        ok = await TransferCharacterService.delete(transfer_id)
        if not ok:
            raise HTTPException(status_code=404, detail="Transfer not found")
        # 204 обычно не возвращает тело
        return
    except Exception as e:
        logger.exception("delete_transfer failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
