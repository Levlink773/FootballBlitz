# schedulers/scheduler_reward_rating.py
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select, desc, update

from blitz.services.blitz_reward_service import RewardLargeBoxBlitzTeam, RewardMediumBoxBlitzTeam, \
    RewardSmallBoxBlitzTeam
from blitz.services.message_sender.blitz_sender import send_message
from database.models.character import Character
from database.models.user_bot import UserBot
from database.session import get_session

logger = logging.getLogger(__name__)


class SchedulerRewardRating:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self._job_id = "reward_rating_weekly"

    def start(self):
        """Запускаем еженедельный планировщик (например, в воскресенье в 23:30)."""
        self.scheduler.add_job(
            func=self._run_safe,
            trigger=CronTrigger(day_of_week="sun", hour=23, minute=30),
            id=self._job_id,
            replace_existing=True,
            misfire_grace_time=60,
        )
        self.scheduler.start()
        logger.info("SchedulerRewardRating запущен (каждое воскресенье в 23:30)")

    async def _run_safe(self):
        try:
            logger.info("SchedulerRewardRating: старт награждения рейтинга")
            await self.reward_and_reset()
            logger.info("SchedulerRewardRating: завершено")
        except Exception as e:
            logger.exception("Ошибка в SchedulerRewardRating: %s", e)

    async def reward_and_reset(self):
        """Награждает топ-3 и обнуляет рейтинг всем."""
        async for session in get_session():
            # выбираем топ-3 игроков по очкам
            result = await session.execute(
                select(Character)
                .where(Character.characters_user_id.isnot(None))
                .order_by(desc(Character.points))
                .limit(3)
            )
            top_players = result.scalars().all()

            if not top_players:
                logger.info("Нет игроков для награждения")
                return

            # выдаем награды
            for idx, char in enumerate(top_players, start=1):
                user: UserBot = char.owner
                if not user:
                    continue

                if idx == 1:
                    reward = RewardLargeBoxBlitzTeam()
                elif idx == 2:
                    reward = RewardMediumBoxBlitzTeam()
                elif idx == 3:
                    reward = RewardSmallBoxBlitzTeam()
                else:
                    continue

                await reward.reward_blitz_user(user)
                await send_message(
                    user=user,
                    text=f"🏆 Вітаємо! Ви посіли <b>{idx}-е місце</b> у тижневому рейтингу!"
                )

            # обнуляем рейтинг всем
            await session.execute(
                update(Character).values(points=0)
            )
            await session.commit()
            logger.info("Рейтинг обнулён и награды выданы")
