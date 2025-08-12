from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from constants import RECORNATION
from loader import bot
from logging_config import logger
from services.character_service import CharacterService


class AgeUpdateScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()

    async def _update_age_for_all_characters(self):
        reco_characters = await CharacterService.update_age_characters()
        for character in reco_characters:
            await bot.send_photo(
                chat_id=character.characters_user_id,
                photo=RECORNATION,
                caption=f"🔄 Ваш футболіст <b>{character.name}</b> пройшов рекорнацію! 🎉\n"
                f"Тепер йому знову <b>18 років</b> 🧑‍🎓\n"
                f"💪 Нова сила: <b>{character.power}</b>\n"
                f"🎯 Новий талант: <b>{character.talent}</b>"
            )
        logger.info("Возраст всех персонажей увеличен на 1 год.")

    async def _job_wrapper(self):
        try:
            await self._update_age_for_all_characters()
        except Exception as e:
            logger.error(f"Ошибка при обновлении возраста персонажей: {e}")

    async def start(self):
        # Запускаем задачу 1-го числа каждого месяца в 00:00
        self.scheduler.add_job(
            self._job_wrapper,
            CronTrigger(day=1, hour=0, minute=0)
        )
        self.scheduler.start()
        logger.info("Scheduler для обновления возраста запущен.")
