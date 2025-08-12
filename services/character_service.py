from datetime import datetime, timedelta
from typing import Any, Coroutine

from sqlalchemy import select, update, Row, RowMapping
from sqlalchemy.orm import selectinload

from database.models.character import Character
from database.models.reminder_character import ReminderCharacter
from database.models.user_bot import UserBot, STATUS_USER_REGISTER
from database.session import get_session
from utils.generate_character import CharacterData, generate_talent, generate_power


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
                    ReminderCharacter.education_reward_date >= months_ago
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
                        ReminderCharacter.education_reward_date >= two_months_ago
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
    async def create_character(cls, data: CharacterData, user_id: int) -> Character | None:
        async for session in get_session():
            ch = Character(
                characters_user_id=user_id,
                name=data.name,
                talent=data.talent,
                age=data.age,
                power=data.power,
                gender=data.gender,
                country=data.country
            )
            session.add(ch)
            await session.commit()
            await session.refresh(ch)
            return ch

    @classmethod
    async def update_power(cls, character_obj: Character, power_to_add) -> Character | None:
        async for session in get_session():
            async with session.begin():
                merged_obj = await session.merge(character_obj)
                merged_obj.power += power_to_add
            return merged_obj

    @classmethod
    async def add_rating(cls, character_obj: Character, rating_to_add) -> Character | None:
        async for session in get_session():
            async with session.begin():
                merged_obj = await session.merge(character_obj)
                merged_obj.points += rating_to_add
            return merged_obj

    @classmethod
    async def update_age(cls, character_obj: Character, age_to_add: int) -> Character | None:
        async for session in get_session():
            async with session.begin():
                merged_obj = await session.merge(character_obj)
                merged_obj.age += age_to_add
            return merged_obj
    @classmethod
    async def update_age_characters(cls):
        async for session in get_session():
            async with session.begin():
                result = await session.execute(select(Character))
                characters = result.scalars().all()
                old_characters = []

                for character in characters:
                    character.age += 1
                    if character.age >= 40:
                        old_characters.append(character)

                # Обновляем старых персонажей в рамках той же транзакции
                for old_character in old_characters:
                    old_character.age = 18
                    old_character.talent = generate_talent()
                    old_character.power = generate_power()
                return old_characters
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

    @classmethod
    async def update_character_education_time(cls, character: Character, amount_add_time: timedelta):
        async for session in get_session():
            async with session.begin():
                try:
                    session.add(character)
                except:
                    pass
                character.reminder.education_reward_date = datetime.now() + amount_add_time
                merged_obj = await session.merge(character)
                await session.commit()
                return merged_obj
