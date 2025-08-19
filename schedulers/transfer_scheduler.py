# schedulers/free_agents_scheduler.py
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select

from database.models.transfer_character import TransferCharacter, TransferType
from database.session import get_session
from utils.transfer_free_agents_generator import FreeAgentsService

logger = logging.getLogger(__name__)


class FreeAgentsScheduler:
    """
    Планировщик по принципу AnulateStatisticsScheduler:
      - default_trigger_start запускает метод _start
      - в _start добавляется задача, которая раз в неделю обновляет free agents
    Запуск: await FreeAgentsScheduler().start()
    """
    # триггер, который запустит _start (можно запускать раз в сутки/при старте сервиса и т.п.)
    default_trigger_start = CronTrigger(hour=19, minute=30)  # запускаем проверку/инициализацию ежедневно в 00:00

    # триггер, который выполняет refresh_free_agents раз в неделю:
    weekly_refresh_trigger = CronTrigger(day_of_week='tue', hour=19, minute=31)

    def __init__(self) -> None:
        self.scheduler = AsyncIOScheduler()
        self._job_id = "free_agents_weekly_refresh"

    async def start(self) -> None:
        """
        Старт планировщика:
         1) При первой инициализации проверяет, есть ли free agents.
            Если нет — создаёт DEFAULT_FREE_AGENTS_COUNT.
         2) Добавляет задачу для вызова _start() (ежедневная проверка).
        """
        # === Проверка наличия агентов при первом запуске ===
        async for session in get_session():
            result = await session.execute(
                select(TransferCharacter).where(
                    TransferCharacter.transfer_type == TransferType.FREE_AGENTS
                )
            )
            free_agents = result.scalars().all()
            if not free_agents:
                logger.info("No free agents found at init. Creating default agents...")
                await FreeAgentsService.refresh_free_agents()
                logger.info("Default free agents created.")

        # === Планировщик: ежедневная проверка/инициализация ===
        self.scheduler.add_job(
            func=self._start,
            trigger=self.default_trigger_start,
            id="free_agents_init",
            misfire_grace_time=30,
        )

        self.scheduler.start()
        logger.info("FreeAgentsScheduler started (scheduler running).")

    async def _start(self) -> None:
        """
        Метод, который будет запускаться ежедневно.
        Регистрирует еженедельное обновление free agents.
        """
        try:
            if self.scheduler.get_job(self._job_id):
                logger.info("FreeAgents job already exists — removing and re-adding.")
                self.scheduler.remove_job(self._job_id)

            self.scheduler.add_job(
                func=self._run_refresh_safe,
                trigger=self.weekly_refresh_trigger,
                id=self._job_id,
                replace_existing=True,
                misfire_grace_time=60,
            )
            logger.info("FreeAgents weekly job scheduled: saturday 23:15.")
        except Exception as e:
            logger.exception("Error while scheduling FreeAgents weekly job: %s", e)

    async def _run_refresh_safe(self) -> None:
        try:
            logger.info("FreeAgentsScheduler: starting refresh_free_agents()")
            await FreeAgentsService.refresh_free_agents()
            logger.info("FreeAgentsScheduler: refresh_free_agents() finished successfully")
        except Exception as e:
            logger.exception("FreeAgentsScheduler: exception during refresh_free_agents(): %s", e)

    async def force_refresh(self) -> None:
        logger.info("FreeAgentsScheduler: manual force_refresh triggered")
        await self._run_refresh_safe()

    def shutdown(self, wait: bool = True) -> None:
        try:
            self.scheduler.shutdown(wait=wait)
            logger.info("FreeAgentsScheduler shutdown complete.")
        except Exception as e:
            logger.exception("FreeAgentsScheduler shutdown error: %s", e)
