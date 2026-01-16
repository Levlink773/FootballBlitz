from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import update

from database.models.user_bot import UserBot
from database.session import get_session

class DailyBoxScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()

    async def start(self):
        self.scheduler.add_job(
            func=self.reset_daily_boxes,
            trigger=CronTrigger(hour=22, minute=0),
            misfire_grace_time=60
        )
        self.scheduler.start()

    async def reset_daily_boxes(self):
        """
        Resets 'has_free_box' to True for all users.
        """
        print(f"🔄 [Scheduler] Resetting daily boxes at {datetime.now()}")
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(UserBot)
                    .where(UserBot.is_bot.is_(False))
                    .values(has_free_box=True)
                )
                result = await session.execute(stmt)
                print(f"✅ [Scheduler] Reset {result.rowcount} daily boxes.")
