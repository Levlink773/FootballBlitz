import asyncio
from datetime import datetime
import locale

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select, delete

from database.models.season_pass import SeasonPass
from database.models.user_bot import UserBot
from database.session import get_session
from services.league_service import LeagueService  # <-- Импортируем сервис лиг

# Dictionary for month names in Russian
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
        # Запускаем 1-го числа каждого месяца в 00:00
        self.scheduler.add_job(
            func=self.process_new_season,
            trigger=CronTrigger(day=1, hour=0, minute=0),
            misfire_grace_time=3600
        )
        self.scheduler.start()

    async def process_new_season(self):
        """
        Полный цикл обновления сезона:
        1. Пересчет лиг (повышение/понижение) на основе старых очков.
        2. Удаление старых сезонных пропусков.
        3. Создание новых пропусков для всех игроков.
        """
        print(f"🔄 [Scheduler] Starting End-of-Season procedures...")

        # --- ШАГ 1: Пересчет лиг (Пока очки еще существуют) ---
        try:
            # Этот метод сам создает сессию внутри, поэтому вызываем его напрямую
            report = await LeagueService.process_season_transition()
            print(f"✅ [Scheduler] League transition finished. Report: {report}")
        except Exception as e:
            print(f"❌ [Scheduler] Error during league transition: {e}")
            # Важно: даже если пересчет лиг упал, мы, возможно, всё равно хотим сбросить сезон,
            # но это зависит от бизнес-логики. Обычно лучше продолжить, чтобы не застрять в прошлом сезоне.

        # --- ШАГ 2 & 3: Сброс и создание нового Season Pass ---
        current_month = datetime.now().month
        season_name = f"{MONTH_NAMES.get(current_month, 'Сезонный')} Сезонный пасс"

        print(f"🔄 [Scheduler] Resetting Season Pass database for: {season_name}")

        async for session in get_session():
            async with session.begin():
                # 2. Удаляем ВСЕ старые пассы
                await session.execute(delete(SeasonPass))

                # 3. Получаем всех живых юзеров
                result = await session.execute(select(UserBot.id).where(UserBot.is_bot.is_(False)))
                user_ids = result.scalars().all()

                if not user_ids:
                    print("⚠️ [Scheduler] No users found for Season Pass update.")
                    return

                # 4. Создаем новые пассы
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

                print(f"✅ [Scheduler] Created {len(new_passes)} new Season Passes.")

        print(f"🎉 [Scheduler] New Season '{season_name}' started successfully!")