from sqlalchemy import select
from database.session import get_session
from database.models.statistics import Statistics
from stats.stat_enum import StatisticsType


class StatisticsService:
    @classmethod
    async def save_statistics(cls, user_id: int, stat_type: StatisticsType):
        async for session in get_session():
            async with session.begin():
                # Проверяем, есть ли уже такая запись
                existing = await session.scalar(
                    select(Statistics)
                    .where(
                        Statistics.user_id == user_id,
                        Statistics.stat_type == stat_type
                    )
                )

                if existing:
                    return  # уже сохранено — ничего не делаем

                # Создаём новую запись
                stat = Statistics(
                    user_id=user_id,
                    stat_type=stat_type
                )
                session.add(stat)
