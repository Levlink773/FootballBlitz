from sqlalchemy import select, desc, asc, and_, or_
from sqlalchemy.orm import selectinload

from database.models.character import Character
from database.models.transfer_character import TransferCharacter, TransferType
from database.session import get_session


class TransferCharacterService:
    @classmethod
    async def get_all(cls) -> list[TransferCharacter] | None:
        async for session in get_session():
            async with session.begin():
                result = await session.execute(select(TransferCharacter).where(TransferCharacter.transfer_type == TransferType.TRANSFER))
                return list(result.scalars().all())

    @classmethod
    async def get_all_free_agents(cls) -> list[TransferCharacter] | None:
        async for session in get_session():
            async with session.begin():
                result = await session.execute(
                    select(TransferCharacter).where(TransferCharacter.transfer_type == TransferType.FREE_AGENTS))
                return list(result.scalars().all())

    @classmethod
    async def get_by_id(cls, transfer_id: int) -> TransferCharacter | None:
        async for session in get_session():
            async with session.begin():
                result = await session.execute(
                    select(TransferCharacter).where(TransferCharacter.id == transfer_id)
                )
                return result.scalar_one_or_none()

    @classmethod
    async def create(
        cls,
        characters_id: int,
        price: int,
        transfer_type,
    ) -> TransferCharacter | None:
        async for session in get_session():
            async with session.begin():
                transfer = TransferCharacter(
                    characters_id=characters_id,
                    price=price,
                    transfer_type=transfer_type
                )
                session.add(transfer)
                await session.flush()
                q = (
                    select(TransferCharacter)
                    .options(
                        selectinload(TransferCharacter.character)
                        .selectinload(Character.owner)  # подгрузим owner у character
                    )
                    .where(TransferCharacter.id == transfer.id)
                )
                result = await session.scalar(q)
                return result

    @classmethod
    async def update(
        cls,
        transfer_id: int,
        characters_id: int | None = None,
        price: int | None = None,
        transfer_type=None,
    ) -> type[TransferCharacter] | None:
        async for session in get_session():
            async with session.begin():
                transfer = await session.get(TransferCharacter, transfer_id)
                if not transfer:
                    return None

                if characters_id is not None:
                    transfer.characters_id = characters_id
                if price is not None:
                    transfer.price = price
                if transfer_type is not None:
                    transfer.transfer_type = transfer_type

                await session.flush()
                return transfer

    @classmethod
    async def delete(cls, transfer_id: int) -> bool | None:
        async for session in get_session():
            async with session.begin():
                transfer = await session.get(TransferCharacter, transfer_id)
                if not transfer:
                    return False
                await session.delete(transfer)
                return True

    @classmethod
    async def get_filtered(cls, transfer_type: TransferType, params) -> list[TransferCharacter]:
        """
        Отримання трансферів з фільтрацією, сортуванням та пагінацією.
        Використовує передану структуру сесії.
        """
        async for session in get_session():
            async with session.begin():
                # 1. Базовий запит із підвантаженням зв'язків
                query = (
                    select(TransferCharacter)
                    .join(TransferCharacter.character)
                    .options(
                        selectinload(TransferCharacter.character).selectinload(Character.owner)
                    )
                    .where(TransferCharacter.transfer_type == transfer_type)
                )
                # 🔥 НОВА ЛОГІКА ДЛЯ RARITY 🔥
                if params.rarity:
                    # Логіка має збігатися з вашою @property rarity в моделі Character

                    if params.rarity.name == "STANDARD":
                        # Talent <= 6
                        query = query.where(Character.talent <= 6)

                    elif params.rarity.name == "EXCLUSIVE":
                        # Talent >= 9 AND Age <= 30
                        query = query.where(
                            and_(Character.talent >= 9, Character.age <= 30)
                        )

                    elif params.rarity.name == "RARE":
                        # (Talent 7-8) OR (Talent >= 9 AND Age > 30)
                        condition_mid = and_(Character.talent >= 7, Character.talent <= 8)
                        condition_old_top = and_(Character.talent >= 9, Character.age > 30)

                        query = query.where(or_(condition_mid, condition_old_top))

                # 2. --- Фільтрація ---

                # Ціна
                if params.price_min is not None:
                    query = query.where(TransferCharacter.price >= params.price_min)
                if params.price_max is not None:
                    query = query.where(TransferCharacter.price <= params.price_max)

                # Характеристики гравця
                if params.power_min is not None:
                    query = query.where(Character.power >= params.power_min)
                if params.power_max is not None:
                    query = query.where(Character.power <= params.power_max)

                if params.talent_min is not None:
                    query = query.where(Character.talent >= params.talent_min)
                if params.talent_max is not None:
                    query = query.where(Character.talent <= params.talent_max)

                if params.age_min is not None:
                    query = query.where(Character.age >= params.age_min)
                if params.age_max is not None:
                    query = query.where(Character.age <= params.age_max)

                # Enum поля
                if params.position:
                    query = query.where(Character.position == params.position)
                if params.country:
                    query = query.where(Character.country == params.country)
                if params.gender:
                    query = query.where(Character.gender == params.gender)

                # 3. --- Сортування ---

                sort_column = None

                # Мапінг параметра sort_by на реальну колонку БД
                if params.sort_by == "price":
                    sort_column = TransferCharacter.price
                elif params.sort_by == "created_at":
                    sort_column = TransferCharacter.created_at
                elif params.sort_by == "power":
                    sort_column = Character.power
                elif params.sort_by == "talent":
                    sort_column = Character.talent
                elif params.sort_by == "age":
                    sort_column = Character.age

                # Логіка сортування за замовчуванням (якщо користувач не вибрав)
                if sort_column is None:
                    if transfer_type == TransferType.FREE_AGENTS:
                        # Вільні агенти: за замовчуванням старіші зверху (у кого закінчується час)
                        sort_column = TransferCharacter.created_at
                        # Якщо користувач не вказав порядок явно, форсуємо ASC
                        if params.sort_by is None:
                            params.sort_order = "asc"
                    else:
                        # Звичайний ринок: нові зверху
                        sort_column = TransferCharacter.created_at
                        if params.sort_by is None:
                            params.sort_order = "desc"

                # Застосування сортування (ASC або DESC)
                if params.sort_order == "desc":
                    query = query.order_by(desc(sort_column))
                else:
                    query = query.order_by(asc(sort_column))

                # 4. --- Пагінація ---
                query = query.limit(params.limit).offset(params.offset)

                # 5. Виконання
                result = await session.execute(query)
                return list(result.scalars().all())
