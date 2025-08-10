from datetime import datetime, timedelta

from sqlalchemy import select, update, or_
from sqlalchemy.orm import selectinload

from database.models.character import Character
from database.models.reminder_character import ReminderCharacter
from database.models.user_bot import UserBot, STATUS_USER_REGISTER
from database.session import get_session


class CharacterService:
    @classmethod
    async def get_all_characters(cls) -> list[Character] | None:
        async for session in get_session():
            async with session.begin():
                result = await session.execute(
                    select(Character)
                )
                all_characters_not_bot = result.unique().scalars().all()
                return list(all_characters_not_bot)

    @classmethod
    async def get_all_characters_where_end_training(clc) -> list[Character] | None:
        months_ago = datetime.now() - timedelta(days=30)
        async for session in get_session():
            stmt = (
                select(Character)
                .join(Character.owner)  # join по foreign key characters_user_id
                .where(UserBot.status_register == STATUS_USER_REGISTER.END_REGISTER)
                .join(ReminderCharacter)
                .where(
                    or_(
                        ReminderCharacter.education_reward_date >= months_ago,
                        ReminderCharacter.time_to_join_club >= months_ago
                    )
                )
                .options(
                    selectinload(Character.owner),
                    selectinload(Character.reminder),
                )
            )
            result = await session.execute(stmt)
            return list(result.scalars().all())

    @classmethod
    async def get_all_users_not_bot(cls) -> list[Character] | None:
        two_months_ago = datetime.now() - timedelta(days=60)
        async for session in get_session():
            async with session.begin():
                stmt = (
                    select(Character)
                    .join(ReminderCharacter)
                    .where(
                        or_(
                            ReminderCharacter.education_reward_date >= two_months_ago,
                            ReminderCharacter.time_to_join_club >= two_months_ago
                        )
                    )
                )
                result = await session.execute(stmt)
                all_characters_not_bot = result.unique().scalars().all()
                return list(all_characters_not_bot)

    @classmethod
    async def get_character(cls, character_user_id: int) -> Character | None:
        async for session in get_session():
            async with session.begin():
                result = await session.execute(
                    select(Character).where(Character.characters_user_id == character_user_id)
                )
                current_character = result.scalar_one_or_none()
                return current_character

    @classmethod
    async def get_character_by_name(cls, character_name: str) -> Character | None:
        async for session in get_session():
            async with session.begin():
                result = await session.execute(
                    select(Character).where(Character.name == character_name)
                )
                return result.scalar_one_or_none()

    @classmethod
    async def get_character_by_id(cls, character_id: int) -> Character | None:
        async for session in get_session():
            async with session.begin():
                result = await session.execute(
                    select(Character).where(Character.id == character_id)
                )
                current_character = result.scalar_one_or_none()
                return current_character

    @classmethod
    async def create_character(cls, character_obj: Character) -> Character | None:
        character_obj.gender = character_obj.gender.value
        character_obj.position = character_obj.position.value

        async for session in get_session():
            async with session.begin():
                try:
                    session.add(character_obj)
                except:
                    pass
                merged_obj = await session.merge(character_obj)
                await session.commit()
                return merged_obj

    @classmethod
    async def update_power(cls, character_obj: Character, power_to_add) -> Character | None:
        async for session in get_session():
            async with session.begin():
                merged_obj = await session.merge(character_obj)
                merged_obj.power += power_to_add
            return merged_obj

    @classmethod
    async def add_trainin_key(
            cls,
            character_id: int,
    ):
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(Character)
                    .where(Character.id == character_id)
                    .values(training_key=Character.training_key + 1)
                )
                await session.execute(stmt)
                await session.commit()

    @classmethod
    async def remove_training_key(
            cls,
            character_id: int,
    ):
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(Character)
                    .where(Character.id == character_id)
                    .values(training_key=Character.training_key - 1)
                )
                await session.execute(stmt)
                await session.commit()
