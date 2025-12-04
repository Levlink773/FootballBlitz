# schedulers/scheduler_reward_rating.py
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select, desc, update

from blitz.services.blitz_reward_service import RewardEnergyBlitzTeam, RewardMoneyBlitzTeam
from blitz.services.message_sender.blitz_sender import send_message
from database.models.character import Character
from database.models.user_bot import UserBot
from database.session import get_session

logger = logging.getLogger(__name__)


class SchedulerRewardRating:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self._job_id = "reward_rating_weekly"

    async def start(self):
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
                select(UserBot)
                .where(UserBot.is_bot.is_(False))
                .order_by(desc(UserBot.points))
                .limit(10)
            )
            top_players = result.scalars().all()

            if not top_players:
                logger.info("Нет игроков для награждения")
                return

            # выдаем награды
            for idx, user in enumerate(top_players, start=1):
                rewards = []
                if idx == 1:
                    rewards.extend(
                        [RewardEnergyBlitzTeam(600), RewardMoneyBlitzTeam(500)]
                    )
                elif idx == 2:
                    rewards.extend(
                        [RewardEnergyBlitzTeam(500), RewardMoneyBlitzTeam(400)]
                    )
                elif idx == 3:
                    rewards.extend(
                        [RewardEnergyBlitzTeam(400), RewardMoneyBlitzTeam(300)]
                    )
                elif idx == 4:
                    rewards.extend(
                        [RewardEnergyBlitzTeam(300), RewardMoneyBlitzTeam(200)]
                    )
                elif idx == 5:
                    rewards.extend(
                        [RewardEnergyBlitzTeam(200), RewardMoneyBlitzTeam(100)]
                    )
                elif idx == 6:
                    rewards.extend(
                        [RewardEnergyBlitzTeam(160), RewardMoneyBlitzTeam(80)]
                    )
                elif idx == 7:
                    rewards.extend(
                        [RewardEnergyBlitzTeam(140), RewardMoneyBlitzTeam(70)]
                    )
                elif idx == 8:
                    rewards.extend(
                        [RewardEnergyBlitzTeam(120), RewardMoneyBlitzTeam(60)]
                    )
                elif idx == 9:
                    rewards.extend(
                        [RewardEnergyBlitzTeam(100), RewardMoneyBlitzTeam(50)]
                    )
                elif idx == 10:
                    rewards.extend(
                        [RewardEnergyBlitzTeam(80), RewardMoneyBlitzTeam(40)]
                    )
                else:
                    continue
                await send_message(
                    user=user,
                    text=f"🏆 Вітаємо! Ви посіли <b>{idx}-е місце</b> у тижневому рейтингу і отрумуєте!"
                )
                for reward in rewards:
                    await reward.reward_blitz_user(user)

            # обнуляем рейтинг всем
            await session.execute(
                update(UserBot).values(points=0)
            )
            await session.commit()
            logger.error("Рейтинг обнулён и награды выданы")
