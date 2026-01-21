import asyncio

from sqlalchemy import update, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import OperationalError

from database.models.season_pass import SeasonPass
from database.models.user_bot import UserBot
from database.session import get_session
from logging_config import logger


class SeasonPassService:
    @classmethod
    async def add_points(cls, user_id: int, points: int):
        """
        Додає очки до сезонного пропуску.
        Має захист від Deadlock (помилка 1213).
        Робить 3 спроби перед тим, як впасти.
        """
        retries = 3
        while retries > 0:
            try:
                async for session in get_session():
                    async with session.begin():
                        # 1. Шукаємо існуючий пас
                        stmt = select(SeasonPass).where(SeasonPass.user_id == user_id)
                        result = await session.execute(stmt)
                        sp = result.scalars().first()

                        if sp:
                            # Оновлюємо очки
                            # Використовуємо атомарний апдейт (SQL рівень) для надійності
                            await session.execute(
                                update(SeasonPass)
                                .where(SeasonPass.id == sp.id)
                                .values(points=SeasonPass.points + points)
                            )
                        else:
                            # Якщо пасу немає - створюємо (рідкісний кейс, але можливий)
                            # Тут був INSERT, який викликав помилку в логах
                            new_sp = SeasonPass(
                                user_id=user_id,
                                season_name="Current Season",  # Або логіка визначення імені
                                points=points
                            )
                            session.add(new_sp)

                # Якщо дійшли сюди без помилок - виходимо з циклу
                return

            except OperationalError as e:
                # Перевіряємо, чи це Deadlock (код 1213)
                if e.orig.args[0] == 1213:
                    retries -= 1
                    if retries == 0:
                        print(f"❌ [SeasonPass] Deadlock failed after 3 retries for user {user_id}")
                        raise e  # Віддаємо помилку далі, якщо не змогли пробитися

                    print(f"⚠️ [SeasonPass] Deadlock detected (1213). Retrying... ({3 - retries}/3)")
                    await asyncio.sleep(0.2)  # Чекаємо 200мс перед повтором
                    continue
                else:
                    # Якщо це інша помилка (не дедлок) - падаємо відразу
                    raise e

    @classmethod
    async def claim_reward(cls, user_id: int, points_milestone: int, tier: str) -> bool:
        """
        :param user_id: Telegram User ID
        :param points_milestone: The point milestone to claim (e.g. 20, 40)
        :param tier: 'standard' or 'vip'
        """
        async for session in get_session():
            async with session.begin():
                # 1. Fetch SeasonPass + UserBot (to check VIP status)
                # Use selectinload to eagerly load the user relationship
                from sqlalchemy.orm import selectinload
                stmt = (
                    select(SeasonPass)
                    .join(UserBot)
                    .where(UserBot.user_id == user_id)
                    .options(selectinload(SeasonPass.user))
                )
                
                result = await session.execute(stmt)
                sp = result.scalar_one_or_none()
                
                if not sp:
                    logger.warning(f"SeasonPass not found for user {user_id}")
                    return False

                # 2. Check if locked
                if sp.points < points_milestone:
                    return False
                
                # 3. Check if already collected
                rewards = sp.rewards_collected or {"standard": [], "vip": []}
                # Ensure dict structure
                if "standard" not in rewards: rewards["standard"] = []
                if "vip" not in rewards: rewards["vip"] = []
                
                if points_milestone in rewards[tier]:
                    return False # Already collected

                # 4. Check VIP status if tier is vip
                if tier == 'vip':
                     if not sp.user or not sp.user.vip_pass_is_active:
                         return False
                
                # 5. Get reward string
                reward_map = SeasonPass.VIP_REWARDS if tier == 'vip' else SeasonPass.STANDARD_REWARDS
                reward_str = reward_map.get(points_milestone)
                
                if not reward_str:
                    return False
                
                # 6. Apply reward
                from services.user_service import UserService
                await UserService._apply_reward(user_id, reward_str)
                
                # 7. Update Collected
                rewards[tier].append(points_milestone)
                
                # Force update the JSON column
                stmt_update = (
                    update(SeasonPass)
                    .where(SeasonPass.id == sp.id)
                    .values(rewards_collected=rewards)
                )
                await session.execute(stmt_update)
                
                return True

    @classmethod
    async def get_pass_info(cls, user_id: int):
        from database.models.season_pass import SeasonPass
        async for session in get_session():
            async with session.begin():
                stmt = select(SeasonPass).join(UserBot).where(UserBot.user_id == user_id)
                result = await session.execute(stmt)
                sp = result.scalar_one_or_none()
                return sp

