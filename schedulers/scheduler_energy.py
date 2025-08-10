import asyncio

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from constants import TIME_RESET_ENERGY_CHARACTER, TIME_RESET_ENERGY_CLUB
from database.models.user_bot import UserBot
from loader import bot
from logging_config import logger
from services.user_service import UserService
from services.vip_pass_service import VipPassService


class EnergyResetScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()

    async def __send_message_bot(
        self, 
        users: list[UserBot],
        is_vip: bool      
    ):
        if is_vip:
            text = """
Ваша енергія ⚡️ повністю відновлена 🔋

<b>Ви отримали 300 енергії</b>

Тепер ви можете користуватися всіма перевагами <b>VIP</b> підписки
"""
        else:
            text = "Ваша енергія ⚡️ повністю відновлена 🔋"

        for user in users:
            try:
                await asyncio.sleep(0.15)
                await bot.send_message(
                    chat_id=user.user_id,
                    text=text
                )
            except Exception as E:
                logger.error(f"Не смог отправить сообщение {user.user_name}")


    async def reset_energy_character(self):
        all_users = await UserService.get_users_how_update_energy()
        all_vip_users = await VipPassService.get_have_vip_pass_characters()
        await UserService.update_energy_for_non_bots()
        asyncio.create_task(self.__send_message_bot(all_users, False))
        asyncio.create_task(self.__send_message_bot(all_vip_users, True))
        logger.info("Обновил енергию для пользователей")
        
        
    async def start_reset_energy(self):
        self.scheduler.add_job(self.reset_energy_character, 
                               TIME_RESET_ENERGY_CHARACTER,
                               misfire_grace_time = 10
)
        self.scheduler.start()

        
        
class EnergyApliedClubResetScheduler:
    def __init__(self) -> None:
        self.scheduler = AsyncIOScheduler()
        
    async def reset_energy_aplied(self):
        await ClubService.reset_energy_aplied_not_bot_clubs()
        logger.info("Убрал усиление с команд")

    async def start_reset_energy(self):
        self.scheduler.add_job(self.reset_energy_aplied, 
                               TIME_RESET_ENERGY_CLUB,
                                misfire_grace_time = 10
)
        self.scheduler.start()
