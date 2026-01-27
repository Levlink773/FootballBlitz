import asyncio
from datetime import datetime

from sqlalchemy import update, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import OperationalError, IntegrityError

from database.models.season_pass import SeasonPass
from database.models.user_bot import UserBot
from database.session import get_session
from logging_config import logger

MONTH_NAMES = {
    1: "Январский", 2: "Февральский", 3: "Мартовский", 4: "Апрельский",
    5: "Майский", 6: "Июньский", 7: "Июльский", 8: "Августовский",
    9: "Сентябрьский", 10: "Октябрьский", 11: "Ноябрьский", 12: "Декабрьский"
}
class SeasonPassService:
    @classmethod
    async def add_points(cls, telegram_user_id: int, points: int):
        """
        Добавляет очки. Если юзера нет — создает.
        Генерирует имя сезона по текущему месяцу.
        Использует внутренний ID юзера (PK) для связи.
        """
        retries = 3
        while retries > 0:
            try:
                async for session in get_session():
                    async with session.begin():

                        # 1. Сначала гарантируем наличие ЮЗЕРА, чтобы получить его внутренний ID (PK)
                        # Ищем по telegram_user_id (который пришел в аргументах)
                        user_stmt = select(UserBot).where(UserBot.user_id == telegram_user_id)
                        user_res = await session.execute(user_stmt)
                        user = user_res.scalars().first()

                        if not user:
                            # Создаем, если нет
                            user = UserBot(user_id=telegram_user_id, user_name="Unknown Player")
                            session.add(user)
                            await session.flush()  # Важно: теперь у user.id есть значение!

                        # Сохраняем внутренний ID для дальнейшей работы
                        internal_db_id = user.id

                        # 2. Теперь ищем ПАСС, используя внутренний ID
                        # (так как SeasonPass.user_id ссылается на users.id)
                        sp_stmt = select(SeasonPass).where(SeasonPass.user_id == internal_db_id)
                        sp_res = await session.execute(sp_stmt)
                        sp = sp_res.scalars().first()

                        if sp:
                            # Оновлюємо очки
                            await session.execute(
                                update(SeasonPass)
                                .where(SeasonPass.id == sp.id)
                                .values(points=SeasonPass.points + points)
                            )
                        else:
                            # 3. Створення нового пасу (якщо не знайдено)

                            # Генеруємо динамічну назву сезону
                            current_month = datetime.now().month
                            season_name_str = f"{MONTH_NAMES.get(current_month, 'Сезонный')} Сезонный пасс"

                            new_sp = SeasonPass(
                                user_id=internal_db_id,  # <--- Берем user.id из базы, а не аргумент метода
                                season_name=season_name_str,  # <--- Динамическое имя
                                points=points
                            )
                            session.add(new_sp)

                logger.info(f"✅ [SeasonPass] Added {points} points for user {telegram_user_id}")
                return

            except OperationalError as e:
                # Проверяем код ошибки безопасно для pymysql/aiomysql
                error_code = None
                if hasattr(e, 'orig') and e.orig:
                    if hasattr(e.orig, 'args') and e.orig.args:
                        error_code = e.orig.args[0]
                    elif isinstance(e.orig, tuple) and len(e.orig) > 0:
                        error_code = e.orig[0]
                
                if error_code == 1213:  # Deadlock
                    retries -= 1
                    if retries == 0:
                        logger.error(f"❌ [SeasonPass] Deadlock failed after 3 retries for user {telegram_user_id}")
                        raise e
                    logger.warning(f"⚠️ [SeasonPass] Deadlock detected for user {telegram_user_id}, retrying... ({3 - retries}/3)")
                    await asyncio.sleep(0.2 + (0.1 * (3 - retries)))  # Progressive backoff
                    continue
                else:
                    logger.error(f"❌ [SeasonPass] OperationalError for user {telegram_user_id}: {e}")
                    raise e
            except IntegrityError as e:
                logger.warning(f"⚠️ [SeasonPass] IntegrityError for user {telegram_user_id}: {e}")
                return

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

