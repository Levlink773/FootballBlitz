import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Tuple

from database.models.character import Character
from database.models.reminder_character import ReminderCharacter
from logging_config import logger

from services.character_service import CharacterService
from services.reminder_character_service import RemniderCharacterService
from .gym import Gym
from .manager import GymCharacterManager


class GymStartReseter:

    @classmethod
    async def start_iniatialization_gym(cls) -> None:
        """
        Відновлює перервані тренування після перезапуску бота.
        Групує персонажів одного користувача в один інстанс Gym.
        """
        all_reminders: List[ReminderCharacter] = await RemniderCharacterService.get_characters_in_training()

        # Словник для групування:
        # Ключ: (user_id, time_training_seconds, time_start_timestamp)
        # Значення: Список ReminderCharacter
        grouped_trainings: Dict[Tuple[int, int, float], List[ReminderCharacter]] = {}

        # 1. ГРУПУВАННЯ
        for rem in all_reminders:
            if not rem.character_in_training:
                continue

            # Якщо час старту не задано — це помилка даних, скидаємо
            if rem.time_start_training is None:
                await RemniderCharacterService.anulate_character_training_status(rem.character_id)
                await RemniderCharacterService.anulate_training_character(rem.character_id)
                continue

            # Отримуємо власника персонажа (потрібен додатковий запит, якщо в reminder немає user_id)
            # Припускаємо, що нам треба дістати character, щоб дізнатися user_id
            try:
                char = await CharacterService.get_character_by_id(rem.character_id)
                if not char:
                    continue  # Персонажа не існує

                # Ключ групування: Власник + Тривалість + Час початку (округлений до хвилини, щоб зловити пачку)
                # Округлення time_start важливе, бо в базі можуть бути розбіжності в мілісекундах
                start_ts = rem.time_start_training.timestamp()
                rounded_start = round(start_ts / 60) * 60  # Округлюємо до хвилини

                key = (char.characters_user_id, rem.time_training_seconds, rounded_start)

                if key not in grouped_trainings:
                    grouped_trainings[key] = []
                grouped_trainings[key].append(rem)

            except Exception as e:
                logger.error(f"Error grouping gym reminder for char {rem.character_id}: {e}")

        # 2. ЗАПУСК ВІДНОВЛЕНИХ ТРЕНУВАНЬ
        for key, reminders_group in grouped_trainings.items():
            user_id, duration_seconds, _ = key

            # Збираємо об'єкти Character для групи
            characters: List[Character] = []
            for rem in reminders_group:
                char = await CharacterService.get_character_by_id(rem.character_id)
                if char:
                    characters.append(char)

            if not characters:
                continue

            # Беремо будь-який ремайндер з групи для розрахунку часу (вони ідентичні)
            sample_rem = reminders_group[0]

            gym_scheduler = Gym(
                characters=characters,  # Передаємо СПИСОК
                time_training=timedelta(seconds=duration_seconds),
            )

            # Перевіряємо, чи час вже вийшов
            time_left_sec = cls.time_left(sample_rem)

            if time_left_sec <= 0:
                # Тренування вже мало закінчитись - завершуємо негайно
                await gym_scheduler._run_training()
            else:
                # Тренування ще триває - чекаємо залишок часу
                task = asyncio.create_task(
                    gym_scheduler._wait_training(time_left_sec)
                )

                # Реєструємо таск в менеджері для КОЖНОГО персонажа з групи
                # (щоб можна було скасувати окремо або знайти таск по ID персонажа)
                for char in characters:
                    GymCharacterManager.add_gym_task(
                        character_id=char.id,
                        task=task
                    )

            logger.info(f"Restored gym session for User {user_id}: {len(characters)} chars, {time_left_sec}s left.")

    @staticmethod
    def time_left(character_rem: ReminderCharacter) -> int:
        """Повертає кількість секунд до кінця тренування."""
        if not character_rem.time_start_training:
            return 0
        time_end = character_rem.time_start_training + timedelta(seconds=character_rem.time_training_seconds)
        delta = (time_end - datetime.now()).total_seconds()
        return int(delta)