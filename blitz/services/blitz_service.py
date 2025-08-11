from typing import Any, Callable

from sqlalchemy import select, delete, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from blitz.exception import BlitzCloseError, UserExistsInBlitzError, MaxUsersInBlitzError
from database.models.blitz import Blitz, BlitzType
from database.models.blitz_character import BlitzUser
from database.models.character import Character
from database.models.user_bot import UserBot
from database.session import get_session


class BlitzService:
    @classmethod
    async def get_or_create_blitz_by_start(cls, start_datetime, cost: int, blitz_type: BlitzType) -> Blitz | None:
        async for session in get_session():
            async with session.begin():
                result = await session.execute(select(Blitz).where(Blitz.start_at == start_datetime))
                blitz: Blitz = result.scalar_one_or_none()

                if not blitz:
                    new_blitz = Blitz(
                        start_at=start_datetime,
                        cost=cost,
                        blitz_type=blitz_type
                    )
                    try:
                       session.add(new_blitz)
                       await session.flush()
                       return new_blitz
                    except IntegrityError:
                        await session.rollback()
                        result = await session.execute(select(Blitz).where(Blitz.start_at == start_datetime))
                        blitz = result.scalar_one()
                        return blitz

                return blitz

    @classmethod
    async def add_users_to_blitz(cls, blitz_id: int, user: UserBot,
                                     max_users: int) -> BlitzUser | None:
        async for session in get_session():
            async with session.begin():
                # Получаем блиц
                result = await session.execute(
                    select(Blitz).where(Blitz.id == blitz_id).with_for_update()
                )
                blitz: Blitz = result.scalar_one_or_none()
                if not blitz:
                    raise ValueError(f"Blitz with id {blitz_id} does not exist")
                if not blitz.can_register:
                    raise BlitzCloseError(f"Blitz with id {blitz_id} is not registered")

                # Проверка — уже есть такой персонаж в блице?
                result = await session.execute(
                    select(BlitzUser).where(
                        BlitzUser.user_id == user.user_id,
                        BlitzUser.blitz_id == blitz_id
                    )
                )
                existing: BlitzUser = result.scalar_one_or_none()
                if existing:
                    raise UserExistsInBlitzError(f"Blitz User with id {existing.id} already exists!")

                # Получаем текущее количество персонажей в блице
                result = await session.execute(
                    select(func.count()).select_from(BlitzUser).where(
                        BlitzUser.blitz_id == blitz_id).with_for_update()
                )
                current_count = result.scalar_one()
                if current_count >= max_users:
                    raise MaxUsersInBlitzError(
                        f"Blitz with id {blitz_id} already has {current_count} users. Max is {max_users}.")

                # Добавляем персонажа
                try:
                    blitz_user = BlitzUser(user_id=user.user_id, blitz_id=blitz_id)
                    session.add(blitz_user)
                    await session.flush()
                    return blitz_user
                except IntegrityError as e:
                    # второй уровень защиты от дубликата
                    raise UserExistsInBlitzError(str(e)) from e

    @classmethod
    async def get_blitz_by_id(cls, blitz_id: int) -> Blitz | None:
        async for session in get_session():
            result = await session.execute(select(Blitz).where(Blitz.id == blitz_id).options(selectinload(Blitz.users)))
            return result.scalar_one_or_none()

    @classmethod
    async def get_all_blitz(cls) -> list[Blitz] | None:
        async for session in get_session():
            result = await session.execute(select(Blitz).options(selectinload(Blitz.users)))
            return list(result.scalars().all())

    @classmethod
    async def remove_blitz_by_id(cls, blitz_id: int) -> Any | None:
        async for session in get_session():
            async with session.begin():
                result = await session.execute(
                    delete(Blitz).where(Blitz.id == blitz_id)
                )
                if result.rowcount == 0:
                    raise ValueError(f"Blitz with ID {blitz_id} not found.")
                return result.rowcount

    @classmethod
    async def remove_all_blitzes(cls) -> Callable[[], int] | None:
        async for session in get_session():
            async with session.begin():
                result = await session.execute(delete(Blitz))
                return result.rowcount

    @classmethod
    async def get_blitz_user(cls, blitz_id: int) -> list[BlitzUser]:
        blitz: Blitz = await cls.get_blitz_by_id(blitz_id)
        return blitz.users

    @classmethod
    async def get_users_from_blitz_users(cls, blitz_id: int) -> None | list[Any] | list[Character]:
        blitz_users: list[BlitzUser] = await cls.get_blitz_user(blitz_id)
        users_ids = [bc.user_id for bc in blitz_users]

        if not users_ids:
            return []

        async for session in get_session():
            result = await session.execute(
                select(UserBot)
                .where(UserBot.user_id.in_(users_ids))
                .options(selectinload(UserBot.characters), selectinload(UserBot.main_character))
            )
            characters = result.scalars().all()
            return list(characters)
    
