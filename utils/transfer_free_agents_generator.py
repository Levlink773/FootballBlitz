# services/free_agents_service.py
from typing import List

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from database.models.character import Character
from database.models.transfer_character import TransferCharacter, TransferType
from database.session import get_session
from utils.generate_character import get_character
from utils.generate_free_agent import get_free_agent

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

                # --- 2) Создать новых free agents (6-3-1) ---
                # 6 Common (1-6), 3 Rare (7-8), 1 Exclusive (9)
                
                # Helper для создания
                async def create_agent(min_t, max_t):
                    attempts = 0
                    while attempts < 10:
                        attempts += 1
                        char_data = await get_free_agent(min_talent=min_t, max_talent=max_t)
                        
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
                            await session.flush()
                        except IntegrityError:
                            await session.rollback()
                            continue
                        
                        price = int(char_data.price) # без мультипликаторов пока, или как было * 1.0 (в исходном было *1.0 фактически, просто int())
                        # В исходном коде: price = int(char_data.price) (без 1.3, хотя в докстринге было написано 1.3)
                        # Оставим как в исходнике (int(char_data.price))
                        
                        transfer = TransferCharacter(
                            characters_id=new_char.id,
                            price=price,
                            transfer_type=TransferType.FREE_AGENTS
                        )
                        session.add(transfer)
                        try:
                            await session.flush()
                            created_transfers.append(transfer)
                            return True
                        except IntegrityError:
                            await session.delete(new_char)
                            await session.rollback()
                            continue
                            
                    return False

                # 6 Common
                for _ in range(6):
                    await create_agent(1, 6)
                
                # 3 Rare
                for _ in range(3):
                    await create_agent(7, 8)
                
                # 1 Exclusive
                for _ in range(1):
                    await create_agent(9, 9)

                # коммит произойдёт на выходе из context

        return created_transfers
