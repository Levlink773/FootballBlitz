# schedulers/free_agents_scheduler.py
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

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
    default_trigger_start = CronTrigger(hour=0)  # запускаем проверку/инициализацию ежедневно в 00:00

    # триггер, который выполняет refresh_free_agents раз в неделю:
    weekly_refresh_trigger = CronTrigger(day_of_week='sat', hour=23, minute=15)

    def __init__(self) -> None:
        self.scheduler = AsyncIOScheduler()
        self._job_id = "free_agents_weekly_refresh"

    async def start(self) -> None:
        """
        Регистрация стартовой задачи и запуск планировщика.
        Метод async чтобы совпадать по интерфейсу с вашим примером.
        """
        # добавляем задачу, которая выполнит _start() по default_trigger_start
        # _start в свою очередь зарегистрирует основную еженедельную задачу
        self.scheduler.add_job(
            func=self._start,
            trigger=self.default_trigger_start,
            id="free_agents_init",
            misfire_grace_time=30
        )

        # старт планировщика (не блокирует)
        self.scheduler.start()
        logger.info("FreeAgentsScheduler started (scheduler running).")

    async def _start(self) -> None:
        """
        Метод, который будет запущен по default_trigger_start.
        В нём мы регистрируем основную еженедельную задачу.
        Если задача уже зарегистрирована — обновим/перезапишем её.
        """
        try:
            # если задача уже существует — удалим её, чтобы переустановить
            if self.scheduler.get_job(self._job_id):
                logger.info("FreeAgents job already exists — removing and re-adding.")
                self.scheduler.remove_job(self._job_id)

            # регистрируем задачу еженедельного обновления
            self.scheduler.add_job(
                func=self._run_refresh_safe,
                trigger=self.weekly_refresh_trigger,
                id=self._job_id,
                replace_existing=True,
                misfire_grace_time=60
            )
            logger.info("FreeAgents weekly job scheduled: saturday 23:15.")
        except Exception as e:
            logger.exception("Error while scheduling FreeAgents weekly job: %s", e)

    async def _run_refresh_safe(self) -> None:
        """
        Обёртка для безопасного вызова FreeAgentsService.refresh_free_agents.
        Асинхронная функция — вызывает refresh и логирует результат/ошибки.
        """
        try:
            logger.info("FreeAgentsScheduler: starting refresh_free_agents()")
            await FreeAgentsService.refresh_free_agents()
            logger.info("FreeAgentsScheduler: refresh_free_agents() finished successfully")
        except Exception as e:
            logger.exception("FreeAgentsScheduler: exception during refresh_free_agents(): %s", e)

    async def force_refresh(self) -> None:
        """
        Админский метод — форсированно обновить free agents сразу.
        Можно вызывать из админ-команды бота.
        """
        logger.info("FreeAgentsScheduler: manual force_refresh triggered")
        await self._run_refresh_safe()

    def shutdown(self, wait: bool = True) -> None:
        """
        Остановить планировщик. Вызывать при выгрузке/остановке приложения.
        """
        try:
            self.scheduler.shutdown(wait=wait)
            logger.info("FreeAgentsScheduler shutdown complete.")
        except Exception as e:
            logger.exception("FreeAgentsScheduler shutdown error: %s", e)
