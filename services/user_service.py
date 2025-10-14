import asyncio
from datetime import datetime

from sqlalchemy import select, update, or_, delete, func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import selectinload

from config import CONST_ENERGY, CONST_VIP_ENERGY
from database.models.character import Character
from database.models.reminder_character import ReminderCharacter
from database.models.statistics import Statistics
from database.models.user_bot import UserBot, STATUS_USER_REGISTER
from database.session import get_session
from logging_config import logger


class UserService:
    """
    Сервис для работы с пользователями.
    Все методы, изменяющие числовые значения (счетчики, деньги, энергия),
    переписаны для использования атомарных SQL UPDATE операций.
    Это предотвращает состояния гонки и проблему "потерянных обновлений".
    """

    @classmethod
    async def create_user(cls, **kwargs) -> UserBot | None:
        async for session in get_session():
            async with session.begin():
                obj = UserBot(**kwargs)
                session.add(obj)
                return obj

    # --- МЕТОДЫ ЧТЕНИЯ (ОСТАЛИСЬ БЕЗ ИЗМЕНЕНИЙ) ---

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

    # --- МЕТОДЫ ИЗМЕНЕНИЯ (ОТРЕФАКТОРЕНЫ) ---

    @classmethod
    async def edit_status_register(cls, user_id: int, status: STATUS_USER_REGISTER):
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values(status_register=status)
                )
                await session.execute(stmt)

    @classmethod
    async def assign_main_character_if_none(cls, user_id: int) -> "UserBot | None":
        # Этот метод требует чтения перед записью, его логика остается, т.к. она не простаивает долго
        async for session in get_session():
            async with session.begin():
                result = await session.execute(
                    select(UserBot)
                    .where(UserBot.user_id == user_id)
                    .options(selectinload(UserBot.characters), selectinload(UserBot.main_character))
                )
                user: UserBot = result.scalar_one_or_none()
                if not user:
                    return None

                if (user.main_character is None) or (user.main_character not in user.characters):
                    char_id_to_set = user.characters[0].id if user.characters else None
                    stmt = (
                        update(UserBot)
                        .where(UserBot.user_id == user_id)
                        .values(main_character_id=char_id_to_set)
                    )
                    await session.execute(stmt)
                    await session.refresh(user) # Обновляем объект после изменения
                return user

    @classmethod
    async def edit_team_name(cls, user_id: int, team_name: str):
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values(team_name=team_name)
                )
                await session.execute(stmt)

    @classmethod
    async def anulate_statistics(cls, user_id: int):
        # Исправлено: теперь обнуление происходит через атомарный UPDATE
        async for session in get_session():
            async with session.begin():
                stmt_reset_stats = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values(
                        count_go_to_gym=0,
                        count_play_blitz=0,
                        count_rich_final_looser_blitz=0,
                        count_rich_semi_final_blitz=0,
                        count_rich_final_winner_blitz=0
                    )
                )
                await session.execute(stmt_reset_stats)

                stmt_delete_stats = delete(Statistics).where(Statistics.user_id == user_id)
                await session.execute(stmt_delete_stats)

    @classmethod
    async def add_energy_user(cls, user_id: int, amount_energy_add: int):
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values(energy=UserBot.energy + amount_energy_add)
                )
                await session.execute(stmt)

    @classmethod
    async def add_count_play_blitz_user(cls, user_id: int, amount: int):
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values(count_play_blitz=UserBot.count_play_blitz + amount)
                )
                await session.execute(stmt)

    @classmethod
    async def add_count_rich_semi_final_blitz_user(cls, user_id: int, amount: int):
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values(count_rich_semi_final_blitz=UserBot.count_rich_semi_final_blitz + amount)
                )
                await session.execute(stmt)

    @classmethod
    async def add_count_rich_final_looser_blitz_user(cls, user_id: int, amount: int):
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values(count_rich_final_looser_blitz=UserBot.count_rich_final_looser_blitz + amount)
                )
                await session.execute(stmt)

    @classmethod
    async def add_count_rich_final_winner_blitz_user(cls, user_id: int, amount: int):
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values(count_rich_final_winner_blitz=UserBot.count_rich_final_winner_blitz + amount)
                )
                await session.execute(stmt)

    @classmethod
    async def add_count_go_to_gym_user(cls, user_id: int, amount: int):
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values(count_go_to_gym=UserBot.count_go_to_gym + amount)
                )
                await session.execute(stmt)

    @classmethod
    async def add_final_count_blitz(cls, user_id: int, amount: int = 1):
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values(final_count_of_blitz=func.coalesce(UserBot.final_count_of_blitz, 0) + amount)
                )
                await session.execute(stmt)

    @classmethod
    async def add_final_count_matches(cls, user_id: int, amount: int = 1):
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values(final_count_of_matches=func.coalesce(UserBot.final_count_of_matches, 0) + amount)
                )
                await session.execute(stmt)

    @classmethod
    async def add_count_of_big_box(cls, user_id: int, amount: int = 1):
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values(
                        count_of_big_box=func.greatest(
                            func.coalesce(UserBot.count_of_big_box, 0) + amount,
                            0
                        )
                    )
                )
                await session.execute(stmt)

    @classmethod
    async def update_training_time(cls, user_id: int):
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values(
                        last_training=datetime.now(),
                        notified_3h=False,
                        notified_6h=False,
                        notified_12h=False,
                        notified_24h=False,
                    )
                )
                await session.execute(stmt)

    @classmethod
    async def set_notified(cls, user_id: int, field: str, status: bool = True):
        """
        Универсальный метод обновления флагов уведомлений.
        Пример: await UserService.set_notified(user_id, "notified_6h")
        """
        valid_fields = {"notified_3h", "notified_6h", "notified_12h", "notified_24h"}
        if field not in valid_fields:
            raise ValueError(f"Invalid field: {field}")

        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values({field: status})
                )
                await session.execute(stmt)

    @classmethod
    async def add_count_of_medium_box(cls, user_id: int, amount: int = 1):
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values(
                        count_of_medium_box=func.greatest(
                            func.coalesce(UserBot.count_of_medium_box, 0) + amount,
                            0
                        )
                    )
                )
                await session.execute(stmt)

    @classmethod
    async def add_count_of_small_box(cls, user_id: int, amount: int = 1):
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values(
                        count_of_small_box=func.greatest(
                            func.coalesce(UserBot.count_of_small_box, 0) + amount,
                            0
                        )
                    )
                )
                await session.execute(stmt)

    @classmethod
    async def add_final_count_matches_winner(cls, user_id: int, amount: int = 1):
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values(final_winner_matches=func.coalesce(UserBot.final_winner_matches, 0) + amount)
                )
                await session.execute(stmt)

    @classmethod
    async def consume_energy(cls, user_id: int, amount_energy_consume: int) -> bool:
        # Этот метод был написан хорошо, возвращаемое значение изменено на bool для ясности
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .where(UserBot.energy >= amount_energy_consume)
                    .values(energy=UserBot.energy - amount_energy_consume)
                )
                result = await session.execute(stmt)
                if result.rowcount > 0:
                    logger.info(f"User {user_id} consumed {amount_energy_consume} energy.")
                    return True
                logger.warning(f"User {user_id} failed to consume {amount_energy_consume} energy (not enough).")
                return False

    @classmethod
    async def add_money_user(cls, user_id: int, amount_money_add: int):
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values(money=UserBot.money + amount_money_add)
                )
                await session.execute(stmt)

    @classmethod
    async def update_main_character(cls, user_id: int, new_main_character_id: int):
        async for session in get_session():
            async with session.begin():
                # Проверка остается, т.к. это бизнес-логика
                stmt_check = select(Character.id).where(
                    Character.id == new_main_character_id,
                    Character.characters_user_id == user_id
                )
                result = await session.execute(stmt_check)
                if result.scalar_one_or_none() is None:
                    raise ValueError("Персонаж не найден или не принадлежит пользователю")

                stmt_update = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values(main_character_id=new_main_character_id)
                )
                await session.execute(stmt_update)


    @classmethod
    async def consume_money(cls, user_id: int, amount_money_consume: int) -> bool:
        # Переписан по аналогии с consume_energy для безопасности
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .where(UserBot.money >= amount_money_consume)
                    .values(money=UserBot.money - amount_money_consume)
                )
                result = await session.execute(stmt)
                if result.rowcount > 0:
                    logger.info(f"User {user_id} consumed {amount_money_consume} money.")
                    return True
                logger.warning(f"User {user_id} failed to consume {amount_money_consume} money (not enough).")
                return False

    @classmethod
    async def get_users_how_update_energy(cls) -> list[UserBot] | None:
        async for session in get_session():
            async with session.begin():
                # В этом методе нет ошибки, он только для чтения
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
                return list(result.unique().scalars().all())

    @classmethod
    async def update_energy_for_non_bots(cls):
        # Этот метод был написан хорошо, использует атомарные UPDATE
        async for session in get_session():
            async with session.begin():
                stmt_vip = (
                    update(UserBot)
                    .where(UserBot.vip_pass_expiration_date > datetime.utcnow())
                    .where(UserBot.energy < CONST_VIP_ENERGY)
                    .values(energy=CONST_VIP_ENERGY)
                )
                await session.execute(stmt_vip)

                stmt_regular = (
                    update(UserBot)
                    .where(
                        or_(
                            UserBot.vip_pass_expiration_date <= datetime.utcnow(),
                            UserBot.vip_pass_expiration_date.is_(None)
                        )
                    )
                    .where(UserBot.energy < CONST_ENERGY)
                    .values(energy=CONST_ENERGY)
                )
                await session.execute(stmt_regular)


    @classmethod
    async def add_rating(cls, user_id: int, rating_to_add: int, retries: int = 2) -> dict:
        # Этот метод был эталоном, без изменений
        attempt = 0
        while True:
            attempt += 1
            try:
                async for session in get_session():
                    async with session.begin():
                        res = await session.execute(
                            select(UserBot.points)
                            .where(UserBot.user_id == user_id)
                            .with_for_update()
                        )
                        current = res.scalar_one_or_none()

                        if current is None:
                            logger.warning("add_rating_mysql: user not found user_id=%s, creating new one.", user_id)
                            session.add(UserBot(user_id=user_id, points=rating_to_add))
                            await session.flush()
                            return {"ok": True, "rows": 1, "new_points": rating_to_add}

                        new_points = int(current) + int(rating_to_add)

                        await session.execute(
                            update(UserBot)
                            .where(UserBot.user_id == user_id)
                            .values(points=new_points)
                        )

                        logger.info("add_rating_mysql: user_id=%s added %s -> %s", user_id, rating_to_add, new_points)
                        return {"ok": True, "rows": 1, "new_points": new_points}
            except SQLAlchemyError as e:
                logger.exception("add_rating_mysql: SQL error attempt %s for user_id=%s: %s", attempt, user_id, e)
                if attempt <= retries:
                    await asyncio.sleep(0.05 * attempt)
                    continue
                return {"ok": False, "rows": 0, "new_points": None}

    @classmethod
    async def add_energy_to_users(cls, user_ids: list[int], amount: int = 10):
        # Исправлено: заменено на один эффективный и безопасный UPDATE
        if not user_ids:
            return
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id.in_(user_ids))
                    .values(energy=UserBot.energy + amount)
                )
                result = await session.execute(stmt)
                logger.info(f"Added {amount} energy to {result.rowcount} users.")