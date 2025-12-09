import logging
from datetime import datetime, timedelta
from typing import Callable, Optional, List, Dict

from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.schedulers.asyncio import AsyncIOScheduler

logger = logging.getLogger(__name__)


class OneOffScheduler:
    """
    Планировщик для единоразовых отложенных задач.
    Пример использования: начисление бонуса через 6 часов после регистрации.

    Запуск:
        scheduler = OneOffScheduler(db_url="sqlite:///jobs.sqlite")
        await scheduler.start()

    Использование:
        await scheduler.schedule_task(my_func, timedelta(hours=6), user_id=123)
    """

    def __init__(self, db_url: Optional[str] = None) -> None:
        # Если передан URL базы данных, настраиваем персистентное хранилище.
        # Это ВАЖНО, чтобы задачи не пропадали при перезагрузке бота.
        jobstores = None
        if db_url:
            jobstores = {
                'default': SQLAlchemyJobStore(url=db_url)
            }

        self.scheduler = AsyncIOScheduler(jobstores=jobstores) if jobstores else AsyncIOScheduler()

    async def start(self) -> None:
        try:
            if not self.scheduler.running:
                self.scheduler.start()
                logger.info("OneOffScheduler started.")
        except Exception as e:
            logger.exception("Error starting OneOffScheduler: %s", e)

    async def schedule_task(
            self,
            func: Callable,
            delay: timedelta,
            # 🔥 ИЗМЕНЕНИЕ 1: Убрали * перед args
            args: Optional[List] = None,
            # 🔥 ИЗМЕНЕНИЕ 2: Убрали ** перед kwargs
            kwargs: Optional[Dict] = None,
            job_id: Optional[str] = None,
    ) -> str:

        # Инициализируем, если передали None
        if args is None:
            args = []
        if kwargs is None:
            kwargs = {}

        run_date = datetime.now() + delay

        # Если ID не передан, генерируем автоматически
        if not job_id:
            # Безопасное получение первого аргумента для уникальности
            first_arg = args[0] if args else "no_args"
            job_id = f"{func.__name__}_{int(run_date.timestamp())}_{first_arg}"

        try:
            self.scheduler.add_job(
                func=func,
                trigger='date',
                run_date=run_date,
                args=args,  # Передаем список
                kwargs=kwargs,  # Передаем словарь (теперь APScheduler распакует его правильно)
                id=str(job_id),
                replace_existing=True,
                misfire_grace_time=3600
            )
            logger.info(
                f"Task '{func.__name__}' scheduled for {run_date.strftime('%Y-%m-%d %H:%M:%S')} (ID: {job_id})"
            )
            return job_id
        except Exception as e:
            logger.exception("Failed to schedule task '%s': %s", func.__name__, e)
            raise e

    def cancel_task(self, job_id: str) -> None:
        """
        Отменяет запланированную задачу по ID, если она еще не выполнена.
        """
        try:
            self.scheduler.remove_job(job_id)
            logger.info(f"Task {job_id} cancelled.")
        except Exception:
            logger.warning(f"Task {job_id} not found or already executed.")

    def shutdown(self, wait: bool = True) -> None:
        try:
            self.scheduler.shutdown(wait=wait)
            logger.info("OneOffScheduler shutdown complete.")
        except Exception as e:
            logger.exception("OneOffScheduler shutdown error: %s", e)