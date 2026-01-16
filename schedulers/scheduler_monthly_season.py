import asyncio
from datetime import datetime
import locale

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select, delete

from database.models.season_pass import SeasonPass
from database.models.user_bot import UserBot
from database.session import get_session

# Dictionary for month names in Russian (Genitive case roughly, or Adjective form as requested)
# Format: "Февральский", "Мартовский" etc.
MONTH_NAMES = {
    1: "Январский",
    2: "Февральский",
    3: "Мартовский",
    4: "Апрельский",
    5: "Майский",
    6: "Июньский",
    7: "Июльский",
    8: "Августовский",
    9: "Сентябрьский",
    10: "Октябрьский",
    11: "Ноябрьский",
    12: "Декабрьский"
}

class MonthlySeasonScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()

    async def start(self):
        # Run at 00:00 on the 1st day of every month
        self.scheduler.add_job(
            func=self.reset_season_pass,
            trigger=CronTrigger(day=1, hour=0, minute=0),
            misfire_grace_time=3600 # 1 hour grace
        )
        self.scheduler.start()

    async def reset_season_pass(self):
        """
        Deletes all Season Passes and creates new ones for all non-bot users.
        """
        current_month = datetime.now().month
        season_name = f"{MONTH_NAMES.get(current_month, 'Сезонный')} Сезонный пасс"
        
        print(f"🔄 [Scheduler] Starting Season Pass reset: {season_name}")

        async for session in get_session():
            async with session.begin():
                # 1. Delete ALL existing Season Passes
                # Note: If SeasonPass table is large, TRUNCATE might be faster but unsafe with FKs unless handled.
                # DELETE is safer transactionally here.
                await session.execute(delete(SeasonPass))
                
                # 2. Get all non-bot users IDs
                result = await session.execute(select(UserBot.id).where(UserBot.is_bot.is_(False)))
                user_ids = result.scalars().all()
                
                if not user_ids:
                    print("⚠️ [Scheduler] No users found for Season Pass update.")
                    return

                # 3. Bulk Create new Season Passes
                new_passes = [
                    SeasonPass(
                        user_id=uid,
                        season_name=season_name,
                        points=0,
                        rewards_collected={"standard": [], "vip": []}
                    ) 
                    for uid in user_ids
                ]
                
                if new_passes:
                    session.add_all(new_passes)
                    # flush/commit happens automatically via async with session.begin() context exit
                
                print(f"✅ [Scheduler] Created {len(new_passes)} new Season Passes for '{season_name}'.")
