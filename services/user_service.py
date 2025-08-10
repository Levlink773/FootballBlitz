from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.orm import selectinload

from config import CONST_ENERGY, CONST_VIP_ENERGY
from database.models.user_bot import UserBot, STATUS_USER_REGISTER
from database.session import get_session


class UserService:

    @classmethod
    async def create_user(cls, **kwargs) -> UserBot | None:
        async for session in get_session():
            async with session.begin():
                obj = UserBot(**kwargs)
                session.add(obj)
                return obj

    @classmethod
    async def get_user(cls, user_id) -> UserBot | None:
        async for session in get_session():
            async with session.begin():
                stmt = select(UserBot).filter_by(user_id=user_id).options(
                    selectinload(UserBot.characters),
                    selectinload(UserBot.main_character)
                )
                result = await session.execute(stmt)
                user = result.scalar_one_or_none()
                return user

    @classmethod
    async def get_all_users(cls) -> list[UserBot] | None:
        async for session in get_session():
            async with session.begin():
                stmt = select(UserBot).options(
                    selectinload(UserBot.characters),
                    selectinload(UserBot.main_character)
                )
                result = await session.execute(stmt)
                return list(result.unique().scalars().all())

    @classmethod
    async def edit_status_register(cls, user_id: int, status: STATUS_USER_REGISTER):
        async for session in get_session():
            async with session.begin():
                try:
                    stmt = (
                        update(UserBot)
                        .where(UserBot.user_id == user_id)
                        .values(status_register=status)
                    )
                    await session.execute(stmt)
                    await session.commit()
                except Exception as e:
                    raise e

    @classmethod
    async def add_energy_user(cls, user_id: int, amount_energy_add: int):
        async for session in get_session():
            async with session.begin():
                stmt_select = select(UserBot).where(UserBot.id == user_id)
                result = await session.execute(stmt_select)
                user: UserBot = result.scalar_one()

                user.energy += amount_energy_add

                session.add(user)
                await session.commit()

    @classmethod
    async def consume_energy(cls, user_id: int, amount_energy_consume: int) -> UserBot | None:
        async for session in get_session():
            async with session.begin():
                stmt_select = select(UserBot).where(UserBot.id == user_id)
                result = await session.execute(stmt_select)
                user: UserBot = result.scalar_one()

                user.energy -= amount_energy_consume

                session.add(user)
                await session.commit()

    @classmethod
    async def add_money_user(cls, user_id: int, amount_money_add: int):
        async for session in get_session():
            async with session.begin():
                stmt_select = select(UserBot).where(UserBot.id == user_id)
                result = await session.execute(stmt_select)
                user: UserBot = result.scalar_one()

                user.money += amount_money_add

                session.add(user)
                await session.commit()

    @classmethod
    async def consume_money(cls, user_id: int, amount_money_consume: int) -> UserBot | None:
        async for session in get_session():
            async with session.begin():
                stmt_select = select(UserBot).where(UserBot.id == user_id)
                result = await session.execute(stmt_select)
                user: UserBot = result.scalar_one()

                user.money -= amount_money_consume

                session.add(user)
                await session.commit()

    @classmethod
    async def get_users_how_update_energy(cls) -> list[UserBot] | None:
        async for session in get_session():
            async with session.begin():
                try:
                    result = await session.execute(
                        select(UserBot)
                        .where(UserBot.energy <= CONST_ENERGY)
                        .where(UserBot.vip_pass_expiration_date <= datetime.now())
                    )
                    all_users_not_bot = result.unique().scalars().all()
                    return list(all_users_not_bot)
                except Exception as e:
                    raise e

    @classmethod
    async def update_energy_for_non_bots(cls):
        async for session in get_session():
            async with session.begin():
                try:
                    stmt = (
                        update(UserBot)
                        .where(UserBot.energy <= CONST_ENERGY)
                        .values(current_energy=CONST_ENERGY)
                    )
                    stmt_vip = (
                        update(UserBot)
                        .where(UserBot.vip_pass_expiration_date > datetime.now())
                        .where(UserBot.energy <= CONST_VIP_ENERGY)
                        .values(current_energy=CONST_VIP_ENERGY)
                    )
                    await session.execute(stmt)
                    await session.execute(stmt_vip)
                    await session.commit()
                except Exception as e:
                    raise e
