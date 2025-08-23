from datetime import datetime

from sqlalchemy import select, update, or_, delete
from sqlalchemy.orm import selectinload

from config import CONST_ENERGY, CONST_VIP_ENERGY
from database.models.character import Character
from database.models.reminder_character import ReminderCharacter
from database.models.statistics import Statistics
from database.models.user_bot import UserBot, STATUS_USER_REGISTER
from database.session import get_session
from logging_config import logger


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
                    selectinload(UserBot.characters)
                    .selectinload(Character.reminder),
                    selectinload(UserBot.characters)
                    .selectinload(Character.owner),
                    selectinload(UserBot.main_character)
                    .selectinload(Character.reminder),
                    selectinload(UserBot.main_character)
                    .selectinload(Character.owner),
                    selectinload(UserBot.statistics)
                )
                result = await session.execute(stmt)
                user = result.scalar_one_or_none()
                return user

    @classmethod
    async def get_all_users(cls) -> list[UserBot] | None:
        async for session in get_session():
            async with session.begin():
                stmt = select(UserBot).options(
                    selectinload(UserBot.characters)
                    .selectinload(Character.reminder),
                    selectinload(UserBot.characters)
                    .selectinload(Character.owner),
                    selectinload(UserBot.main_character)
                    .selectinload(Character.reminder),
                    selectinload(UserBot.main_character)
                    .selectinload(Character.owner),
                    selectinload(UserBot.statistics)
                )
                result = await session.execute(stmt)
                return list(result.unique().scalars().all())

    @classmethod
    async def get_all_users_where_end_register(cls) -> list[UserBot] | None:
        async for session in get_session():
            async with session.begin():
                stmt = select(UserBot).where(UserBot.status_register == STATUS_USER_REGISTER.END_REGISTER).options(
                    selectinload(UserBot.characters)
                    .selectinload(Character.reminder),
                    selectinload(UserBot.characters)
                    .selectinload(Character.owner),
                    selectinload(UserBot.main_character)
                    .selectinload(Character.reminder),
                    selectinload(UserBot.main_character)
                    .selectinload(Character.owner),
                    selectinload(UserBot.statistics)
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
    async def assign_main_character_if_none(cls, user_id: int) -> "UserBot | None":
        async for session in get_session():
            async with session.begin():
                result = await session.execute(
                    select(UserBot)
                    .where(UserBot.user_id == user_id)
                    .options(
                        selectinload(UserBot.characters),
                        selectinload(UserBot.main_character),
                    )
                )
                user: UserBot = result.scalar_one_or_none()
                if not user:
                    return None  # Пользователь не найден

                # Проверка: если нет main_character или он не принадлежит пользователю
                if (user.main_character is None) or (user.main_character not in user.characters):
                    if user.characters:  # есть хотя бы один игрок
                        main_char_id = user.characters[0].id
                        stmt = (
                            update(UserBot)
                            .where(UserBot.user_id == user_id)
                            .values(main_character_id=main_char_id)
                        )
                        await session.execute(stmt)
                        # обновляем локальный объект
                        user.main_character_id = main_char_id
                        user.main_character = user.characters[0]
                        return user
                    else:
                        # если у юзера нет игроков → сбрасываем main_character
                        stmt = (
                            update(UserBot)
                            .where(UserBot.user_id == user_id)
                            .values(main_character_id=None)
                        )
                        await session.execute(stmt)
                        user.main_character_id = None
                        user.main_character = None
                        return user

                return user
    @classmethod
    async def edit_team_name(cls, user_id: int, team_name: str):
        async for session in get_session():
            async with session.begin():
                try:
                    stmt = (
                        update(UserBot)
                        .where(UserBot.user_id == user_id)
                        .values(team_name=team_name)
                    )
                    await session.execute(stmt)
                    await session.commit()
                except Exception as e:
                    raise e

    @classmethod
    async def anulate_statistics(cls, user_id: int):
        async for session in get_session():
            async with session.begin():
                try:
                    stmt_select = select(UserBot).where(UserBot.user_id == user_id)
                    result = await session.execute(stmt_select)
                    user: UserBot = result.scalar_one_or_none()

                    user.count_go_to_gym = 0
                    user.count_play_blitz = 0
                    user.count_rich_final_looser_blitz = 0
                    user.count_rich_semi_final_blitz = 0
                    user.count_rich_final_winner_blitz = 0

                    stmt = delete(Statistics).where(Statistics.user_id == user_id)
                    await session.execute(stmt)
                except Exception as e:
                    raise e

    @classmethod
    async def add_energy_user(cls, user_id: int, amount_energy_add: int):
        async for session in get_session():
            stmt_select = select(UserBot).where(UserBot.user_id == user_id)
            result = await session.execute(stmt_select)
            user: UserBot = result.scalar_one_or_none()

            if not user:
                logger.warning(f"add_energy_user: user {user_id} не найден")
                return None

            old_energy = user.energy or 0
            user.energy = old_energy + amount_energy_add

            await session.commit()
            await session.refresh(user)

            logger.info(f"User {user.user_id}: energy {old_energy} -> {user.energy}")
            return user

    @classmethod
    async def add_count_play_blitz_user(cls, user_id: int, amount: int):
        async for session in get_session():
            async with session.begin():
                stmt_select = select(UserBot).where(UserBot.user_id == user_id)
                result = await session.execute(stmt_select)
                user: UserBot = result.scalar_one()

                user.count_play_blitz += amount

                session.add(user)
                await session.commit()

    @classmethod
    async def add_count_rich_semi_final_blitz_user(cls, user_id: int, amount: int):
        async for session in get_session():
            async with session.begin():
                stmt_select = select(UserBot).where(UserBot.user_id == user_id)
                result = await session.execute(stmt_select)
                user: UserBot = result.scalar_one()

                user.count_rich_semi_final_blitz += amount

                session.add(user)
                await session.commit()

    @classmethod
    async def add_count_rich_final_looser_blitz_user(cls, user_id: int, amount: int):
        async for session in get_session():
            async with session.begin():
                stmt_select = select(UserBot).where(UserBot.user_id == user_id)
                result = await session.execute(stmt_select)
                user: UserBot = result.scalar_one()

                user.count_rich_final_looser_blitz += amount

                session.add(user)
                await session.commit()

    @classmethod
    async def add_count_rich_final_winner_blitz_user(cls, user_id: int, amount: int):
        async for session in get_session():
            async with session.begin():
                stmt_select = select(UserBot).where(UserBot.user_id == user_id)
                result = await session.execute(stmt_select)
                user: UserBot = result.scalar_one()

                user.count_rich_final_winner_blitz += amount

                session.add(user)
                await session.commit()

    @classmethod
    async def add_count_go_to_gym_user(cls, user_id: int, amount: int):
        async for session in get_session():
            async with session.begin():
                stmt_select = select(UserBot).where(UserBot.user_id == user_id)
                result = await session.execute(stmt_select)
                user: UserBot = result.scalar_one()

                user.count_go_to_gym += amount

                session.add(user)
                await session.commit()

    @classmethod
    async def consume_energy(cls, user_id: int, amount_energy_consume: int) -> UserBot | None:
        async for session in get_session():
            stmt_select = (
                select(UserBot)
                .where(UserBot.user_id == user_id)
                .options(
                    selectinload(UserBot.characters).selectinload(Character.reminder),
                    selectinload(UserBot.characters).selectinload(Character.owner),
                    selectinload(UserBot.main_character).selectinload(Character.reminder),
                    selectinload(UserBot.main_character).selectinload(Character.owner),
                    selectinload(UserBot.statistics)
                )
            )
            result = await session.execute(stmt_select)
            user: UserBot = result.scalar_one_or_none()
            if not user:
                return None

            if user.energy < amount_energy_consume:
                # Логируем попытку списания больше чем есть
                logger.warning(
                    f"⚡ Недостатньо енергії у користувача {user_id}: "
                    f"{user.energy} < {amount_energy_consume}"
                )
                return user

            old_energy = user.energy
            user.energy = max(0, user.energy - amount_energy_consume)

            await session.commit()
            await session.refresh(user)

            logger.info(f"User {user.user_id}: energy {old_energy} -> {user.energy}")
            return user

    @classmethod
    async def add_money_user(cls, user_id: int, amount_money_add: int):
        async for session in get_session():
            async with session.begin():
                stmt_select = select(UserBot).where(UserBot.user_id == user_id)
                result = await session.execute(stmt_select)
                user: UserBot = result.scalar_one()

                user.money += amount_money_add

                session.add(user)
                await session.commit()

    @classmethod
    async def update_main_character(cls, user_id: int, new_main_character_id: int):
        async for session in get_session():
            async with session.begin():
                # Проверяем, что персонаж принадлежит пользователю
                stmt_check = select(Character).where(
                    Character.id == new_main_character_id,
                    Character.characters_user_id == user_id
                )
                result = await session.execute(stmt_check)
                character = result.scalar_one_or_none()
                if not character:
                    raise ValueError("Персонаж не найден или не принадлежит пользователю")

                # Обновляем главного персонажа
                stmt_update = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values(main_character_id=new_main_character_id)
                    .execution_options(synchronize_session="fetch")
                )
                await session.execute(stmt_update)
                await session.commit()

    @classmethod
    async def consume_money(cls, user_id: int, amount_money_consume: int) -> UserBot | None:
        async for session in get_session():
            async with session.begin():
                stmt_select = select(UserBot).where(UserBot.user_id == user_id)
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
                        .where(
                            or_(
                                UserBot.vip_pass_expiration_date <= datetime.now(),
                                UserBot.vip_pass_expiration_date.is_(None)
                            )
                        )
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
                    result = await session.execute(
                        select(Character.owner_id)
                        .join(ReminderCharacter)
                        .where(ReminderCharacter.character_in_training == True)
                    )
                    training_characters = [row[0] for row in result.all()]

                    # апдейт звичайних користувачів
                    stmt = (
                        update(UserBot)
                        .where(UserBot.energy <= CONST_ENERGY)
                        .where(~UserBot.id.in_(training_characters))  # 🔑 ігноруємо тих, хто у тренуванні
                        .values(energy=CONST_ENERGY)
                    )

                    # апдейт vip
                    stmt_vip = (
                        update(UserBot)
                        .where(UserBot.vip_pass_expiration_date > datetime.now())
                        .where(UserBot.energy <= CONST_VIP_ENERGY)
                        .where(~UserBot.id.in_(training_characters))
                        .values(energy=CONST_VIP_ENERGY)
                    )

                    await session.execute(stmt)
                    await session.execute(stmt_vip)
                    await session.commit()
                except Exception as e:
                    raise e

    @classmethod
    async def add_rating(cls, user_id: UserBot, rating_to_add) -> UserBot | None:
        async for session in get_session():
            async with session.begin():
                stmt_select = select(UserBot).where(UserBot.user_id == user_id)
                result = await session.execute(stmt_select)
                user: UserBot = result.scalar_one()
                user.points += rating_to_add
                session.add(user)
                await session.commit()

    @classmethod
    async def add_energy_to_users(clc, user_ids: list[int], amount: int = 10):
        """
        Начисляет энергию пользователям.
        :param user_ids: список user_id (telegram id) пользователей
        :param amount: сколько энергии добавить каждому
        """
        if not user_ids:
            return

        async for session in get_session():
            users = (await session.execute(
                select(UserBot).where(UserBot.user_id.in_(user_ids))
            )).scalars().all()

            for user in users:
                user.energy += amount
                session.add(user)

            await session.commit()
