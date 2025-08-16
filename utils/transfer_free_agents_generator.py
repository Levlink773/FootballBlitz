# services/free_agents_service.py
import asyncio
from typing import List

from sqlalchemy import select, delete
from sqlalchemy.exc import IntegrityError

from database.session import get_session
from database.models.character import Character
from database.models.transfer_character import TransferCharacter, TransferType
from database.models.transfer_character import TransferType as TC_Enum  # if needed
from sqlalchemy.orm import selectinload

from utils.generate_character import get_character

DEFAULT_FREE_AGENTS_COUNT = 10


class FreeAgentsService:
    @classmethod
    async def refresh_free_agents(cls, count: int = DEFAULT_FREE_AGENTS_COUNT) -> List[TransferCharacter]:
        """
        Полностью обновляет рынок вільних агентів:
         - удаляет текущие записи transfer_characters с transfer_type = FREE_AGENTS
         - удаляет связанные characters только если у них нет owner (characters_user_id is None)
         - генерирует `count` новых персонажей (через get_character)
         - создаёт TransferCharacter для каждого нового персонажа с transfer_type = FREE_AGENTS и price = int(price * 1.3)
        Возвращает список созданных TransferCharacter (persisted instances).
        """
        created_transfers = []

        async for session in get_session():
            async with session.begin():
                # --- 1) Найти и удалить существующие free agents ---
                result = await session.execute(
                    select(TransferCharacter)
                    .where(TransferCharacter.transfer_type == TransferType.FREE_AGENTS)
                    .options(selectinload(TransferCharacter.character))
                )
                existing_transfers = result.scalars().all()

                for tr in existing_transfers:
                    # если связанный персонаж НЕ имеет владельца -> удалить персонажа
                    char = tr.character
                    if char is not None and (char.characters_user_id is None):
                        await session.delete(char)
                    # затем удалить запись трансфера (если не удалена автоматически)
                    await session.delete(tr)

                # --- 2) Создать новых free agents ---
                # Генерация и вставка в БД последовательно, чтобы избежать дубликатов имён
                attempts = 0
                created = 0
                # Защитный предел, чтобы не уйти в бесконечность
                max_attempts = count * 10

                while created < count and attempts < max_attempts:
                    attempts += 1
                    # get_character — асинхронная функция, возвращает CharacterData (dataclass)
                    char_data = await get_character()

                    # создаём запись Character (owner = None)
                    new_char = Character(
                        characters_user_id=None,
                        name=char_data.name,
                        age=char_data.age,
                        talent=char_data.talent,
                        power=char_data.power,
                        gender=char_data.gender,
                        country=char_data.country
                    )
                    session.add(new_char)
                    try:
                        # flush чтобы получить new_char.id
                        await session.flush()
                    except IntegrityError:
                        # например, уникальное имя — пробуем дальше
                        await session.rollback()
                        continue

                    # вычисляем цену для free agents: фактична вартість * 1.3
                    price = int(char_data.price * 1.3)

                    transfer = TransferCharacter(
                        characters_id=new_char.id,
                        price=price,
                        transfer_type=TransferType.FREE_AGENTS
                    )
                    session.add(transfer)
                    # flush, чтобы transfer.id появился
                    try:
                        await session.flush()
                    except IntegrityError:
                        # если что-то пошло не так (маловероятно) — откатим и удалим персонажа и пробуем снова
                        await session.delete(new_char)
                        await session.rollback()
                        continue

                    created += 1
                    created_transfers.append(transfer)

                # коммит произойдёт на выходе из context

        return created_transfers
