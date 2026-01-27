import asyncio
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database.models.season_pass import SeasonPass
from database.models.user_bot import UserBot
from database.session import get_session
from logging_config import logger

# Названия месяцев для красоты
MONTH_NAMES = {
    1: "Январский", 2: "Февральский", 3: "Мартовский", 4: "Апрельский",
    5: "Майский", 6: "Июньский", 7: "Июльский", 8: "Августовский",
    9: "Сентябрьский", 10: "Октябрьский", 11: "Ноябрьский", 12: "Декабрьский"
}


async def ensure_all_users_have_pass():
    """
    Проверяет всех юзеров при старте. Если нет SeasonPass — создает.
    """
    logger.info("🛠 [Startup] Checking Season Passes for all users...")

    current_month = datetime.now().month
    season_name = f"{MONTH_NAMES.get(current_month, 'Сезонный')} Сезонный пасс"

    # Получаем сессию
    async for session in get_session():
        async with session.begin():
            # Берем всех реальных юзеров и подгружаем их пассы
            stmt = select(UserBot).where(UserBot.is_bot.is_(False)).options(
                selectinload(UserBot.season_pass)
            )
            result = await session.execute(stmt)
            users = result.scalars().all()

            created_count = 0

            for user in users:
                if not user.season_pass:
                    # Создаем дефолтный пасс
                    new_pass = SeasonPass(
                        user_id=user.id,
                        season_name=season_name,
                        points=0,
                        rewards_collected={"standard": [], "vip": []}
                    )
                    session.add(new_pass)
                    created_count += 1

            if created_count > 0:
                await session.commit()
                logger.success(f"✅ [Startup] Created {created_count} missing Season Passes!")
            else:
                logger.info("✅ [Startup] All users already have Season Passes.")

        # Нам достаточно одного прохода, выходим из генератора сессии
        break