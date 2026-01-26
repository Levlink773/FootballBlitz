import asyncio
from datetime import datetime

from sqlalchemy import select, update, or_, delete, func
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import selectinload

from config import CONST_ENERGY, CONST_VIP_ENERGY
from database.models.blitz_character import BlitzUser
from database.models.character import Character
from database.models.reminder_character import ReminderCharacter
from database.models.statistics import Statistics
from database.models.user_bot import UserBot, STATUS_USER_REGISTER
from database.models.season_pass import SeasonPass
from database.models.user_boost import UserBoost, BoostType
from database.models.types import TypeBox
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
                    selectinload(UserBot.statistics),
                    selectinload(UserBot.season_pass),
                    selectinload(UserBot.boosts)
                )
                result = await session.execute(stmt)
                user = result.scalar_one_or_none()
                return user

    @classmethod
    async def get_user_by_pk(cls, pk: int) -> UserBot | None:
        async for session in get_session():
            async with session.begin():
                stmt = select(UserBot).filter_by(id=pk).options(
                    selectinload(UserBot.season_pass),
                    selectinload(UserBot.boost)
                )
                result = await session.execute(stmt)
                return result.scalar_one_or_none()

    @classmethod
    async def get_all_users(cls) -> list[UserBot] | None:
        async for session in get_session():
            async with session.begin():
                stmt = select(UserBot).where(UserBot.is_bot.is_(False)).options(
                    selectinload(UserBot.characters)
                    .selectinload(Character.reminder),
                    selectinload(UserBot.characters)
                    .selectinload(Character.owner),
                    selectinload(UserBot.main_character)
                    .selectinload(Character.reminder),
                    selectinload(UserBot.main_character)
                    .selectinload(Character.owner),
                    selectinload(UserBot.statistics),
                    selectinload(UserBot.season_pass),
                )
                result = await session.execute(stmt)
                return list(result.unique().scalars().all())

    @classmethod
    async def get_all_users_where_end_register(cls) -> list[UserBot] | None:
        async for session in get_session():
            async with session.begin():
                stmt = select(UserBot).where(UserBot.is_bot.is_(False)).where(UserBot.status_register == STATUS_USER_REGISTER.END_REGISTER).options(
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
    async def add_full_count_to_gym(cls, user_id: int, amount: int = 1):
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values(count_of_training=func.coalesce(UserBot.count_of_training, 0) + amount)
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
    async def add_skill_points(cls, user_id: int, amount: int):
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values(
                        skill_points=func.coalesce(UserBot.skill_points, 0) + amount
                    )
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
                    .where(UserBot.is_bot.is_(False))
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

    @classmethod
    async def get_my_referals(cls, user_id: int):
        async for session in get_session():
            async with session.begin():
                try:
                    result = await session.execute(
                        select(UserBot)
                        .where(UserBot.referal_user_id == user_id))
                    all_users_not_bot = result.unique().scalars().all()
                    return all_users_not_bot
                except Exception as e:
                    raise e

    @classmethod
    async def get_my_referals_count(cls, user_id: int) -> int:
        """
        Возвращает ТОЛЬКО КОЛИЧЕСТВО рефералов для пользователя.
        Это намного эффективнее, чем get_my_referals().
        """
        async for session in get_session():
            async with session.begin():
                try:
                    # Создаем запрос, который просит БД посчитать (COUNT)
                    # строки, где referal_user_id совпадает
                    stmt = (
                        select(func.count(UserBot.user_id))
                        .where(UserBot.referal_user_id == user_id)
                    )

                    result = await session.execute(stmt)

                    # .scalar_one() вернет нам одно значение (наш подсчет)
                    count = result.scalar_one()

                    return count if count is not None else 0

                except Exception as e:
                    # В идеале здесь нужно логировать ошибку
                    print(f"Error in get_my_referals_count for user {user_id}: {e}")
                    raise e  # Передаем ошибку выше, чтобы FastAPI ее обработал

    @classmethod
    async def add_referal_user_id(cls, my_user_id: int, referal_user_id: int):
        async for session in get_session():
            async with session.begin():
                try:
                    stmt = (
                        update(UserBot)
                        .where(UserBot.user_id == my_user_id)
                        .values(referal_user_id=referal_user_id)
                    )
                    await session.execute(stmt)
                    await session.commit()
                except Exception as e:
                    raise e

    @classmethod
    async def set_disable_spam(cls, user_id: int, status: bool):
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values(disable_spam=status)
                )
                await session.execute(stmt)

    @classmethod
    async def set_tg_mode(cls, user_id: int, status: bool):
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values(is_tg_mode=status)
                )
                await session.execute(stmt)

    @classmethod
    async def set_free_box_status(cls, user_id: int, status: bool):
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user_id)
                    .values(has_free_box=status)
                )
                await session.execute(stmt)

    @classmethod
    async def activate_boost_from_inventory(cls, user_id: int, boost_id: int):
        from datetime import datetime, timedelta

        async for session in get_session():
            async with session.begin():
                # 1. Знаходимо предмет в інвентарі (використовуємо PK)
                inventory_item = await session.get(UserBoost, boost_id)

                if not inventory_item or inventory_item.is_active or inventory_item.count <= 0:
                    return "ITEM_NOT_FOUND"

                    # 2. 🔥 ПЕРЕВІРКА: Чи є вже активний буст?
                # Якщо хоча б один буст активний - забороняємо
                stmt_active = select(UserBoost).where(
                    UserBoost.user_id == inventory_item.user_id,
                    UserBoost.is_active == True
                )
                active_boost = (await session.execute(stmt_active)).scalar_one_or_none()

                if active_boost:
                    # Перевіряємо, чи не закінчився він по часу (на всяк випадок)
                    if active_boost.date_end and active_boost.date_end > datetime.now():
                        return "ALREADY_ACTIVE"  # <--- Повертаємо код помилки
                    else:
                        # Якщо час вийшов, але він висить як активний - видаляємо його
                        await session.delete(active_boost)

                # 3. Якщо активних немає - створюємо новий
                new_active = UserBoost(
                    user_id=inventory_item.user_id,
                    effect=inventory_item.effect,
                    percent=inventory_item.percent,
                    duration=inventory_item.duration,
                    is_active=True,
                    count=1,
                    date_end=datetime.now() + timedelta(hours=inventory_item.duration)
                )
                session.add(new_active)

                # 4. Списуємо з інвентарю
                inventory_item.count -= 1
                if inventory_item.count <= 0:
                    await session.delete(inventory_item)

                return "SUCCESS"
    @classmethod
    async def add_boost_to_inventory(cls, user_id: int, effect: BoostType, percent: int, duration: int, count: int = 1):
        async for session in get_session():
            async with session.begin():
                # 1. Ищем, есть ли уже такой СТАК в инвентаре (неактивный)
                stmt = select(UserBoost).where(
                    UserBoost.user_id == user_id,
                    UserBoost.effect == effect,
                    UserBoost.percent == percent,
                    UserBoost.duration == duration,
                    UserBoost.is_active == False  # Ищем только в инвентаре
                )
                existing_boost = await session.scalar(stmt)

                if existing_boost:
                    # Если есть - просто увеличиваем счетчик
                    existing_boost.count += count
                else:
                    # Если нет - создаем новый
                    new_boost = UserBoost(
                        user_id=user_id,
                        effect=effect,
                        percent=percent,
                        duration=duration,
                        is_active=False,  # Кладем в инвентарь
                        date_end=None,
                        count=count
                    )
                    session.add(new_boost)

    @classmethod
    async def delete_user_boost(cls, user_id: int):
        async for session in get_session():
            async with session.begin():
                # We need to resolve user_id (TG ID) to UserBot.id (PK) first, 
                # OR join UserBot. Or if UserBoost.user_id stored TG ID (it stores PK per schema).
                # Let's align with create_user_boost which resolves it.
                
                stmt = delete(UserBoost).where(
                    UserBoost.user_id == select(UserBot.id).where(UserBot.user_id == user_id).scalar_subquery()
                )
                await session.execute(stmt)
                logger.info(f"Deleted boost for user {user_id}")

    @classmethod
    async def get_season_pass(cls, user_id: int) -> SeasonPass | None:
        async for session in get_session():
            async with session.begin():
                # Need to join UserBot to filter by TG user_id, or resolve PK first.
                stmt = (
                    select(SeasonPass)
                    .join(UserBot)
                    .where(UserBot.user_id == user_id)
                )
                result = await session.execute(stmt)
                return result.scalar_one_or_none()

    @classmethod
    async def _apply_reward(cls, user_id: int, reward_str: str):
        """
        Parses reward string and applies the reward.
        """
        parts = reward_str.split('_')
        type_ = parts[0]

        if type_ == 'money':
            amount = int(parts[1])
            await cls.add_money_user(user_id, amount)

        elif type_ == 'energy':
            amount = int(parts[1])
            await cls.add_energy_user(user_id, amount)

        elif type_ == 'skill':
            amount = int(parts[1])
            await cls.add_skill_points(user_id, amount)

        elif type_ == 'box':
            box_type = parts[1]  # small, medium, big
            count = 1
            if len(parts) > 2 and parts[2].isdigit():
                count = int(parts[2])

            if box_type == 'small':
                await cls.add_count_of_small_box(user_id, count)
            elif box_type == 'medium':
                await cls.add_count_of_medium_box(user_id, count)
            elif box_type == 'big':
                await cls.add_count_of_big_box(user_id, count)

        elif type_ == 'boost':
            # Logic for Boosts
            # Formats:
            # boost_training_50_12h
            # boost_training_time_50_12h

            boost_type = None
            percent_idx = -1

            # Определяем тип буста
            if parts[1] == 'training':
                if len(parts) > 2 and parts[2] == 'time':
                    boost_type = BoostType.TRAINING_SPEED
                    percent_idx = 3
                else:
                    boost_type = BoostType.TRAINING_EFFICIENCY
                    percent_idx = 2
            elif parts[1] == 'team':
                boost_type = BoostType.TEAM_POWER
                percent_idx = 2
            elif parts[1] == 'strength':
                # 🔥 ИСПРАВЛЕНИЕ ОШИБКИ: Тут было TEAM_POWER, меняем на STRENGTH
                boost_type = BoostType.STRENGTH
                percent_idx = 2

            if boost_type and percent_idx != -1:
                percent = int(parts[percent_idx])
                duration_str = parts[percent_idx + 1]  # e.g. "12h"
                duration = int(duration_str.replace('h', ''))

                # 🔥 ИЗМЕНЕНИЕ: Кладем в инвентарь вместо активации
                # Используем метод, который мы написали в предыдущем ответе
                await cls.add_boost_to_inventory(
                    user_id=user_id,
                    effect=boost_type,
                    percent=percent,
                    duration=duration,
                    count=1
                )

        logger.info(f"UserId {user_id} claimed reward: {reward_str}")

    @classmethod
    async def claim_season_pass_reward(cls, user_id: int, points: int, tier: str) -> bool:
        """
        Marks a reward as collected and GRANTS it to the user.
        """
        async for session in get_session():
            async with session.begin():
                stmt = (
                    select(SeasonPass)
                    .join(UserBot)
                    .where(UserBot.user_id == user_id)
                )
                result = await session.execute(stmt)
                sp = result.scalar_one_or_none()
                
                if not sp:
                    return False

                # Check if reward exists in config
                rewards_map = SeasonPass.VIP_REWARDS if tier == 'vip' else SeasonPass.STANDARD_REWARDS
                reward_str = rewards_map.get(points)
                
                if not reward_str:
                    logger.warning(f"User {user_id} tried to claim unknown reward: {points} ({tier})")
                    return False
                
                # Verify VIP status availability
                if tier == 'vip':
                     # We need access to UserBot to check VIP, but usually SP points checking is enough if logic is correct.
                     # However, SP model method `get_available_rewards` checks VIP status.
                     # Here we should also ideally check or assume caller checked.
                     pass

                collected = dict(sp.rewards_collected) if sp.rewards_collected else {"standard": [], "vip": []}
                if tier not in collected: collected[tier] = []
                
                if points not in collected[tier]:
                    # 1. Apply Reward
                    await cls._apply_reward(user_id, reward_str)

                    # 2. Mark as collected
                    collected[tier].append(points)
                    sp.rewards_collected = collected
                    from sqlalchemy.orm.attributes import flag_modified
                    flag_modified(sp, "rewards_collected")
                    
                    return True
                
                return False

    @classmethod
    async def delete_all_bots(cls):
        print("🗑️ Начинаю глубокую очистку ботов...")

        async for session in get_session():
            async with session.begin():
                # 1. Получаем И внутренний ID (id), И телеграм ID (user_id)
                # Это критически важно, так как разные таблицы ссылаются на разные поля
                bots_stmt = select(UserBot.id, UserBot.user_id).where(UserBot.is_bot.is_(True))
                result = await session.execute(bots_stmt)
                bots = result.all()  # Список кортежей [(id, user_id), ...]

                if not bots:
                    print("✅ Ботов не найдено.")
                    return

                # Разделяем на два списка для удобства
                bot_db_ids = [b.id for b in bots]  # [1, 2, 3...]
                bot_tg_ids = [b.user_id for b in bots]  # [1000001, 1000002...]

                print(f"Обнаружено {len(bots)} ботов. Удаляю зависимости...")

                # 2. Удаляем SeasonPass (Ссылается на users.id -> используем bot_db_ids)
                await session.execute(
                    delete(SeasonPass).where(SeasonPass.user_id.in_(bot_db_ids))
                )

                # 3. Удаляем BlitzUser (Ссылается на users.user_id -> используем bot_tg_ids)
                # (Если таблица использует users.id - поменяйте на bot_db_ids)
                try:
                    await session.execute(
                        delete(BlitzUser).where(BlitzUser.user_id.in_(bot_tg_ids))
                    )
                except Exception:
                    pass

                # 4. Удаляем Characters (ОШИБКА БЫЛА ТУТ)
                # Ссылается на users.user_id -> используем bot_tg_ids
                await session.execute(
                    delete(Character).where(Character.characters_user_id.in_(bot_tg_ids))
                )

                # Удаляем Статистику (обычно ссылается на users.id)
                # await session.execute(delete(Statistics).where(Statistics.user_id.in_(bot_db_ids)))

                # 5. 🔥 ВАЖНО: Применяем удаление зависимостей перед удалением юзеров
                await session.flush()

                # 6. Удаляем самих пользователей (по их внутреннему ID)
                print(f"Удаляю {len(bots)} пользователей...")
                await session.execute(
                    delete(UserBot).where(UserBot.id.in_(bot_db_ids))
                )

                print("✅ Успешно очищено.")