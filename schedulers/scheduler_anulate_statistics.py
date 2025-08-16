from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from database.models.user_bot import UserBot
from services.user_service import UserService


class AnulateStatisticsScheduler:
    default_trigger_start = CronTrigger(hour=2)

    def __init__(self) -> None:
        self.scheduler = AsyncIOScheduler()

    async def start(self):
        self.scheduler.add_job(
            func=self._start,
            trigger=self.default_trigger_start,
            misfire_grace_time=10
        )
        self.scheduler.start()

    async def _start(self):
        self.scheduler.add_job(
            func=self.anulate_statistics,
            trigger=CronTrigger(hour=3),
            misfire_grace_time=10
        )

    async def anulate_statistics(self):
        users: list[UserBot] = await UserService.get_all_users_where_end_register()
        for user in users:
            await UserService.anulate_statistics(user.user_id)
