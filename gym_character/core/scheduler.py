import asyncio
from datetime import datetime, timedelta

from database.models.reminder_character import ReminderCharacter

from services.character_service import CharacterService
from services.reminder_character_service import RemniderCharacterService
from .gym import Gym
from .manager import GymCharacterManager


class GymStartReseter:

    @classmethod
    async def start_iniatialization_gym(cls) -> None:
        all_character_in_gym: list[ReminderCharacter] = await RemniderCharacterService.get_characters_in_training()
        for character_rem in all_character_in_gym:

            if character_rem.character_in_training and (character_rem.time_start_training is None):
                await RemniderCharacterService.anulate_character_training_status(character_rem.character_id)
                await RemniderCharacterService.anulate_training_character(character_rem.character_id)
                continue

            character = await CharacterService.get_character_by_id(character_rem.character_id)

            gym_scheduler = Gym(
                character=character,
                time_training=timedelta(seconds=character_rem.time_training_seconds),
            )
            if cls.has_training_ended(character_rem):
                await gym_scheduler._run_training()
            else:
                task = asyncio.create_task(
                    gym_scheduler._wait_training(
                        cls.time_left(
                            character_rem=character_rem,
                        )
                    )
                )
                GymCharacterManager.add_gym_task(
                    character_id=character_rem.character_id,
                    task=task
                )

    @staticmethod
    def has_training_ended(
            character_rem: ReminderCharacter,
    ) -> bool:
        return GymStartReseter.time_left(character_rem) < 0

    @staticmethod
    def time_left(
            character_rem: ReminderCharacter,
    ) -> int:
        time_end = character_rem.time_start_training + timedelta(seconds=character_rem.time_training_seconds)
        return int((time_end - datetime.now()).total_seconds())
