from __future__ import annotations

from enum import Enum
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status, Query, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select, delete, func
from sqlalchemy.orm import selectinload

from config import Country, Gender
from database.models.character import Character, Position, CharacterRarity
from database.models.training import CharacterJoinTraining
from database.models.transfer_character import TransferType, TransferCharacter
from database.models.user_bot import UserBot
from database.session import get_session
from loader import bot
from logging_config import logger
from services.transfer_service import TransferCharacterService
from services.user_service import UserService

router = APIRouter(prefix="/transfers", tags=["transfers"])


# ---------- Pydantic схемы ----------
class TransferCreate(BaseModel):
    characters_id: int = Field(..., description="ID персонажа, который выставляют на трансфер")
    price: int = Field(..., ge=0, description="Цена трансфера")
    transfer_type: TransferType = TransferType.TRANSFER


class TransferUpdate(BaseModel):
    characters_id: Optional[int] = None
    price: Optional[int] = Field(None, ge=0)
    transfer_type: Optional[TransferType] = None


class InstantSellRequest(BaseModel):
    character_id: int = Field(..., description="ID персонажа для моментальной продажи")


# Enum для полів сортування
class SortField(str, Enum):
    PRICE = "price"
    POWER = "power"
    TALENT = "talent"
    AGE = "age"
    CREATED_AT = "created_at"  # Час створення (для "закінчується час")


# Enum для напрямку сортування
class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


# Клас для параметрів фільтрації (використовується через Depends)
class TransferFilterParams(BaseModel):
    price_min: Optional[int] = Query(None, ge=0, description="Мінімальна ціна")
    price_max: Optional[int] = Query(None, ge=0, description="Максимальна ціна")

    power_min: Optional[float] = Query(None, ge=0, description="Мінімальна сила")
    power_max: Optional[float] = Query(None, ge=0, description="Максимальна сила")

    talent_min: Optional[int] = Query(None, ge=0, description="Мінімальний талант")
    talent_max: Optional[int] = Query(None, ge=0, description="Максимальний талант")

    age_min: Optional[int] = Query(None, ge=0, description="Мінімальний вік")
    age_max: Optional[int] = Query(None, ge=0, description="Максимальний вік")

    position: Optional[Position] = Query(None, description="Позиція гравця")
    country: Optional[Country] = Query(None, description="Країна")
    gender: Optional[Gender] = Query(None, description="Стать")

    # Сортування
    sort_by: Optional[SortField] = Query(None, description="Поле сортування")
    sort_order: SortOrder = Query(SortOrder.ASC, description="Напрямок сортування (asc/desc)")

    # Пагінація
    limit: int = Query(50, ge=1, le=100, description="Кількість записів")
    offset: int = Query(0, ge=0, description="Зсув")
    rarity: Optional[CharacterRarity] = Query(None, description="Рідкість гравця (STANDARD, RARE, EXCLUSIVE)")

# ---------- Сериализатор ----------
def transfer_to_dict(t) -> dict:
    if not t:
        return {}

    character_data = None
    if t.character:
        owner_data = None
        if t.character.owner:
            owner_data = {
                "user_id": t.character.owner.user_id,
                "username": getattr(t.character.owner, "user_name", f"user_{t.character.owner.user_id}")
            }
        character_data = {
            "id": t.character.id,
            "name": t.character.name,
            "age": t.character.age,
            "talent": t.character.talent,
            "power": t.character.power,
            "gender": t.character.gender.name if t.character.gender else None,
            "country": t.character.country.name if t.character.country else None,
            "price": t.character.character_price,
            "owner": owner_data,
            # 🔥 ВАЖЛИВО: rarity це property, яка повертає Enum, тому беремо .name
            "rarity": getattr(t.character, "rarity").name if getattr(t.character, "rarity", None) is not None else "STANDARD",
        }

    return {
        "id": t.id,
        "characters_id": t.characters_id,
        "price": t.price,
        "transfer_type": t.transfer_type.name if t.transfer_type is not None else None,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "character": character_data
    }


# ---------- Endpoints ----------

@router.get("/", response_model=List[dict])
async def get_all_transfers(params: TransferFilterParams = Depends()):
    """
    Возвращает список трансферов с учетом фильтров.
    """
    # ❌ БЫЛО: transfers = await TransferCharacterService.get_all()

    # ✅ СТАЛО: Передаем params в метод get_filtered
    transfers = await TransferCharacterService.get_filtered(TransferType.TRANSFER, params)

    if not transfers:
        return []
    return [transfer_to_dict(t) for t in transfers]


@router.get("/free_agents", response_model=List[dict])
async def get_free_agents(params: TransferFilterParams = Depends()):
    """
    Возвращает свободных агентов с учетом фильтров.
    """
    # ❌ БЫЛО: transfers = await TransferCharacterService.get_all_free_agents()

    # ✅ СТАЛО:
    transfers = await TransferCharacterService.get_filtered(TransferType.FREE_AGENTS, params)

    if not transfers:
        return []
    return [transfer_to_dict(t) for t in transfers]


@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_transfer(payload: TransferCreate):
    """
    Виставити гравця на трансфер.
    Перевіряє, чи не є гравець останнім у користувача.
    """
    logger.info("create_transfer received payload: %s", payload)

    async for session in get_session():
        # 1. Знаходимо персонажа
        char = await session.get(Character, payload.characters_id)
        if not char:
            raise HTTPException(status_code=404, detail="❌ Персонажа не знайдено.")

        # 2. Перевіряємо кількість персонажів у власника
        # Рахуємо, скільки всього персонажів у цього юзера
        count_query = select(func.count(Character.id)).where(Character.characters_user_id == char.characters_user_id)
        user_char_count = await session.scalar(count_query)

        if user_char_count <= 1:
            raise HTTPException(
                status_code=400,
                detail="⚠️ Ви не можете продати свого останнього гравця! Спочатку купіть нового."
            )

    # Якщо перевірка пройдена, створюємо трансфер через сервіс
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


# @router.get("/free_agents", response_model=List[dict])
# async def get_free_agents():
#     """
#     Возвращает список свободных агентов.
#     """
#     transfers = await TransferCharacterService.get_all_free_agents()
#     if not transfers:
#         return []
#     return [transfer_to_dict(t) for t in transfers]


@router.get("/{transfer_id}", response_model=dict)
async def get_transfer_by_id(transfer_id: int):
    transfer = await TransferCharacterService.get_by_id(transfer_id)
    if not transfer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer not found")
    return transfer_to_dict(transfer)


@router.post("/instant_sell", response_model=dict)
async def instant_sell_api(payload: InstantSellRequest):
    """
    Моментальная продажа персонажа.
    НОВА ЛОГІКА: Заборонено продавати, якщо у користувача <= 1 персонажа.
    """
    async for session in get_session():
        # Получаем персонажа
        char = await session.get(Character, payload.character_id)
        if not char:
            raise HTTPException(status_code=404, detail="❌ Персонаж не найден.")

        # Проверяем наличие владельца и загружаем его персонажей для подсчета
        user = await session.scalar(
            select(UserBot)
            .where(UserBot.user_id == char.characters_user_id)
            .options(selectinload(UserBot.characters))
        )

        if not user:
            raise HTTPException(status_code=404, detail="❌ Владелец персонажа не найден.")

        # --- НОВАЯ ПРОВЕРКА ---
        if len(user.characters) <= 1:
            raise HTTPException(
                status_code=400,
                detail="⚠️ Ви не можете продати свого останнього гравця!"
            )
        # ----------------------

        fact_price = char.character_price

        # Удаляем все записи тренировок, связанные с этим персонажем
        await session.execute(
            delete(CharacterJoinTraining).where(CharacterJoinTraining.character_id == char.id)
        )

        # Удаляем персонажа
        await session.delete(char)

        # Начисляем пользователю деньги
        user.money += fact_price
        session.add(user)

        await session.commit()

        return {
            "message": "✅ Персонаж моментально продан.",
            "character_id": payload.character_id,
            "price_received": fact_price,
            "user_id": user.user_id,
            "user_balance": user.money
        }


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
        return
    except Exception as e:
        logger.exception("delete_transfer failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# --- Pydantic запросы/ответы ---
class BuyRequest(BaseModel):
    buyer_user_id: int = Field(..., description="User ID покупателя (user_id из UserBot)")


class BuyResponse(BaseModel):
    message: str
    transfer_id: int
    character_id: int
    price: int
    buyer_id: int
    seller_id: Optional[int] = None
    buyer_balance: int
    seller_balance: Optional[int] = None


class WithdrawRequest(BaseModel):
    owner_user_id: int = Field(..., description="User ID владельца, который снимает трансфер")


class WithdrawResponse(BaseModel):
    message: str
    transfer_id: int
    character_id: int
    owner_id: int


# ---------- Endpoint: купить трансфер (или свободного агента) ----------
@router.post("/{transfer_id}/buy", response_model=BuyResponse)
async def buy_transfer(transfer_id: int, payload: BuyRequest):
    buyer_id = payload.buyer_user_id

    # Проверяем что трансфер существует
    transfer: Optional[TransferCharacter] = await TransferCharacterService.get_by_id(transfer_id)
    if not transfer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="❌ Трансфер не найден или уже продан/снят с рынка.")

    async for session in get_session():
        # Подгружаем персонажа
        char: Character = await session.scalar(
            select(Character)
            .where(Character.id == transfer.characters_id)
            .options(selectinload(Character.transfer))
        )
        if not char:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="❌ Персонаж не найден.")

        # Получаем свежую запись transfer
        transfer_db: TransferCharacter = await session.scalar(
            select(TransferCharacter).where(TransferCharacter.id == transfer_id)
        )
        if not transfer_db:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail="❌ Трансфер уже отменён или продан.")

        seller_id = char.characters_user_id

        # Запрет покупать своего же игрока
        if buyer_id == seller_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="❌ Ви не можете купити свого гравця.")

        # Получаем покупателя со списком персонажей
        buyer: UserBot = await session.scalar(
            select(UserBot).where(UserBot.user_id == buyer_id).options(
                selectinload(UserBot.characters),
                selectinload(UserBot.main_character),
            )
        )
        if buyer is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="❌ Покупець не знайдений.")

        seller: Optional[UserBot] = await session.scalar(
            select(UserBot).where(UserBot.user_id == seller_id)
        )

        price = transfer_db.price

        # 1. Проверяем средства
        if buyer.money < price:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="💸 Недостатньо коштів.")

        # 2. --- НОВАЯ ПРОВЕРКА: ЛИМИТ 11 ИГРОКОВ ---
        # Старая логика с VIP удалена
        current_char_count = len(buyer.characters) if buyer.characters else 0
        if current_char_count >= 11:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="⚠️ Ви досягли ліміту в 11 гравців! 🚫 Продайте когось, щоб купити нового."
            )
        # -------------------------------------------

        # Выполняем перевод
        char.characters_user_id = buyer_id
        session.add(char)

        # Списываем и зачисляем деньги
        buyer.money -= price
        session.add(buyer)

        if seller:
            seller.money += price
            session.add(seller)

        # Удаляем запись трансфера
        await session.delete(transfer_db)

        await session.commit()

        # Гарантируем, что у покупателя есть основной персонаж
        await UserService.assign_main_character_if_none(buyer_id)

        response = BuyResponse(
            message=f"✅ Ви купили гравця {char.name} за {price} монет!",
            transfer_id=transfer_id,
            character_id=char.id,
            price=price,
            buyer_id=buyer_id,
            seller_id=seller_id if seller else None,
            buyer_balance=buyer.money,
            seller_balance=seller.money if seller else None
        )

        # Отправка уведомления продавцу (через бот)
        if seller_id and isinstance(seller_id, int):
            try:
                await bot.send_message(
                    chat_id=seller_id,
                    text=f"Вітаємо! 🎉\n💰 Вашого гравця <b>{char.name}</b> купили за {transfer.price} монет!\n\n"
                         f"Баланс поповнено на <b>{transfer.price}</b> монет."
                )
            except Exception as e:
                logger.error(f"Failed to send notification to seller {seller_id}: {e}")

        return response


# ---------- Endpoint: снять трансфер с продажи (withdraw) ----------
@router.post("/{transfer_id}/withdraw", response_model=WithdrawResponse)
async def withdraw_transfer(transfer_id: int, payload: WithdrawRequest):
    owner_id = payload.owner_user_id

    transfer: Optional[TransferCharacter] = await TransferCharacterService.get_by_id(transfer_id)
    if not transfer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="❌ Трансфер не найден или уже продан/знят з ринку.")

    async for session in get_session():
        # Подгружаем персонажа, чтобы сверить владельца
        char: Character = await session.scalar(
            select(Character).where(Character.id == transfer.characters_id)
        )
        if not char:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="❌ Персонаж не знайдений.")

        if char.characters_user_id != owner_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                                detail="❌ Тільки власник може зняти персонажа з трансферу.")

        # Удаляем запись трансфера
        await session.delete(transfer)
        await session.commit()

        return WithdrawResponse(
            message="✅ Трансфер успішно знято з продажу.",
            transfer_id=transfer_id,
            character_id=char.id,
            owner_id=owner_id
        )