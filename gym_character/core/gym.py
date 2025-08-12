import asyncio
from asyncio import Task
from datetime import timedelta
from typing import Optional

from aiogram import Bot
from aiogram.types import FSInputFile

from constants import (
    chance_add_point,
    CHANCE_VIP_PASS
)
from database.models.character import Character
from gym_character.templates import TrainingTextTemplate
from gym_character.types import ResultTraining
from loader import bot
from logging_config import logger
from services.character_service import CharacterService
from services.reminder_character_service import RemniderCharacterService
from services.user_service import UserService
from utils.randomaizer import check_chance
from .manager import GymCharacterManager


class Gym:
    
    _bot: Bot = bot
    
    def __init__(
        self,
        character: Character,
        time_training: timedelta,
    ) -> None:
        self.character = character
        self.time_training = time_training
        
        self.result_training: Optional[ResultTraining] = None
        
    @property
    def training_points(self) -> int:
        return self.character.how_much_power_can_add

    @property
    def delta_time_training(self) -> int:
        return int(self.time_training.total_seconds())
    
    
    def start_training(self) -> Task:
        task_training = asyncio.create_task(
            self._wait_training(self.delta_time_training)
        )
        return task_training

        
    async def _wait_training(self, time_sleep: int) -> None:
        try:
            await asyncio.sleep(time_sleep)
            await self._run_training()
        except asyncio.CancelledError:
            await RemniderCharacterService.anulate_character_training_status(self.character.id)
            await RemniderCharacterService.anulate_training_character(self.character.id)
            
    async def _run_training(self) -> None:
        try:
            chance = chance_add_point[self.time_training]
            
            if not await RemniderCharacterService.character_in_training(
                character_id=self.character.id
            ):
                raise ValueError("Персонаж не в тренуванні")
            
            if self.character.owner.vip_pass_is_active:
                chance += CHANCE_VIP_PASS

                
            success = check_chance(chance)
            self.result_training = ResultTraining.SUCCESS if success else ResultTraining.FAILURE

            if self.result_training == ResultTraining.SUCCESS:
                await CharacterService.update_power(self.character, self.training_points)
            await UserService.add_count_go_to_gym_user(
                user_id=self.character.owner.user_id,
                amount=1,
            )
            await self.send_end_training_message()
            await GymCharacterManager.remove_gym_task(self.character.id)
        except Exception as e:
            logger.error(f"Ошибка при выполнении тренировки: {e}")
        finally:
            await RemniderCharacterService.anulate_character_training_status(self.character.id)
            await RemniderCharacterService.anulate_training_character(self.character.id)

    async def send_end_training_message(self) -> None:
        try:
            if not self.character:
                raise ValueError("Персонаж не найден для отправки сообщения")

            if self.result_training is None:
                raise ValueError("Результат тренировки не определён")
            points = self.training_points if self.result_training == ResultTraining.SUCCESS else 0
            
            message_text = TrainingTextTemplate.get_training_text(self.result_training, points)
            
            photo_path = f"src/{'success' if self.result_training == ResultTraining.SUCCESS else 'failure'}_training.jpg"
            photo = FSInputFile(photo_path)

            await bot.send_photo(
                chat_id=self.character.characters_user_id,
                photo=photo,
                caption=message_text
            )
        except Exception as e:
            logger.error(f"Ошибка при отправке сообщения пользователю {self.character.name}: {e}")
            