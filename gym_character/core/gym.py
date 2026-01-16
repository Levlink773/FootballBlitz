import asyncio
from asyncio import Task
from datetime import timedelta
from typing import Optional, List, Dict

from aiogram import Bot
from aiogram.types import FSInputFile, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

from constants import (
    chance_add_point,
    CHANCE_VIP_PASS, const_energy_by_time
)
from database.models.character import Character
from database.models.user_boost import BoostType
from gym_character.templates import TrainingTextTemplate
from gym_character.types import ResultTraining
from loader import bot
from logging_config import logger
from services.character_service import CharacterService
from services.reminder_character_service import RemniderCharacterService
from services.user_service import UserService
from utils.randomaizer import check_chance
from webapp.fastapi.publisher import make_payload, publish_event
from .manager import GymCharacterManager


class Gym:
    _bot: Bot = bot

    def __init__(
            self,
            characters: List[Character],  # Тепер приймаємо список!
            time_training: timedelta,
    ) -> None:
        self.characters = characters
        self.time_training = time_training

        # Словник для зберігання результатів по кожному персонажу: {char_id: ResultTraining}
        self.results_training: Dict[int, ResultTraining] = {}
        self.boost_multiplier: float = 1.0

    @property
    def delta_time_training(self) -> int:
        return int(self.time_training.total_seconds())

    # Властивість для owner беремо з першого персонажа (вони всі одного власника)
    @property
    def owner_user_id(self) -> int:
        if self.characters:
            return self.characters[0].characters_user_id
        return 0

    def start_training(self) -> Task:
        task_training = asyncio.create_task(
            self._wait_training(self.delta_time_training)
        )
        return task_training

    async def _wait_training(self, time_sleep: int) -> None:
        try:
            # Оновлюємо статистику користувачу (1 раз за групу)
            # Оновлюємо статистику користувачу (1 раз за групу)
            if self.owner_user_id:
                await UserService.add_full_count_to_gym(self.owner_user_id, 1)
                await UserService.update_training_time(self.owner_user_id)

                # Check for Boosts (Speed)
                user = await UserService.get_user(self.owner_user_id)
                if user and user.boost:
                    if not user.boost.is_active:
                         logger.info(f"Boost expired for user {self.owner_user_id}, deleting.")
                         await UserService.delete_user_boost(self.owner_user_id)
                    elif user.boost.effect == BoostType.TRAINING_SPEED:
                         percent = user.boost.percent
                         time_sleep = int(time_sleep * (1 - percent / 100))
                         logger.info(f"Applied speed boost {percent}% for user {self.owner_user_id}. New time: {time_sleep}s")

            await asyncio.sleep(time_sleep)
            await self._run_training()
        except asyncio.CancelledError:
            # При скасуванні - скасовуємо для всіх
            for char in self.characters:
                await RemniderCharacterService.anulate_character_training_status(char.id)
                await RemniderCharacterService.anulate_training_character(char.id)

    async def _run_training(self) -> None:
        cost_gym = const_energy_by_time.get(self.time_training, 0)

        try:
            # Базовий шанс для цього часу
            base_chance = chance_add_point.get(self.time_training, 50)

            # --- ИСПРАВЛЕНИЕ ТУТ ---
            # Замість звернення до self.characters[0].owner (що викликає помилку),
            # отримуємо свіжого користувача через сервіс по ID.
            is_vip = False
            self.boost_multiplier = 1.0

            if self.owner_user_id:
                user = await UserService.get_user(self.owner_user_id)
                if user:
                    is_vip = user.vip_pass_is_active
                    
                    # Check for Boosts (Efficiency)
                    if user.boost:
                        if not user.boost.is_active:
                             await UserService.delete_user_boost(self.owner_user_id)
                        elif user.boost.effect == BoostType.TRAINING_EFFICIENCY:
                             self.boost_multiplier = 1 + (user.boost.percent / 100)
                             logger.info(f"Applied efficiency boost {user.boost.percent}%")
            # -----------------------

            if is_vip:
                base_chance += CHANCE_VIP_PASS

            # --- ЦИКЛ ПО ВСІХ ПЕРСОНАЖАХ ---
            for char in self.characters:
                # Перевіряємо, чи персонаж все ще в статусі тренування в БД
                if not await RemniderCharacterService.character_in_training(character_id=char.id):
                    logger.warning(f"Персонаж {char.id} не в стані тренування, пропускаємо.")
                    continue

                # Розрахунок успіху для конкретного персонажа
                success = check_chance(base_chance)
                result = ResultTraining.SUCCESS if success else ResultTraining.FAILURE
                self.results_training[char.id] = result

                if result == ResultTraining.SUCCESS:
                    # Розрахунок сили для конкретного персонажа
                    points = char.how_much_power_can_add * self.boost_multiplier
                    # Важливо: CharacterService.update_power повинен вміти працювати
                    # з detached об'єктом або завантажувати його заново по ID.
                    await CharacterService.update_power(char, points)

            # Додаємо запис про похід в зал (1 раз для юзера)
            if self.owner_user_id:
                await UserService.add_count_go_to_gym_user(
                    user_id=self.owner_user_id,
                    amount=1,
                )

            # Відправляємо ОДНЕ зведене повідомлення
            await self.send_end_training_message()

            # Видаляємо таски з менеджера для всіх
            for char in self.characters:
                await GymCharacterManager.remove_gym_task(char.id)

        except Exception as e:
            # Якщо критична помилка - повертаємо енергію
            if self.owner_user_id:
                await UserService.add_energy_user(self.owner_user_id, cost_gym)
            logger.error(f"Ошибка при выполнении групповой тренировки: {e}")
        finally:
            # Завжди знімаємо статус тренування для всіх
            for char in self.characters:
                await RemniderCharacterService.anulate_character_training_status(char.id)
                await RemniderCharacterService.anulate_training_character(char.id)

    async def send_end_training_message(self) -> None:
        try:
            if not self.characters:
                return

            user_id = self.owner_user_id

            # Формуємо текст повідомлення
            # Якщо персонажів багато, робимо список
            message_lines = ["🏋️‍♂️ <b>Тренування завершено!</b>\n"]

            overall_success = False  # Для вибору картинки (якщо хоча б один успішний - успіх)

            for char in self.characters:
                res = self.results_training.get(char.id, ResultTraining.FAILURE)

                if res == ResultTraining.SUCCESS:
                    overall_success = True
                    points = char.how_much_power_can_add * self.boost_multiplier
                    message_lines.append(f"✅ <b>{char.name}:</b> +{points:.2f} сили")
                else:
                    message_lines.append(f"❌ <b>{char.name}:</b> Невдача")

            final_text = "\n".join(message_lines)

            # Картинка: success якщо хоч хтось прокачався, інакше failure
            photo_path = f"src/{'success' if overall_success else 'failure'}_training.jpg"
            photo = FSInputFile(photo_path)

            await bot.send_photo(
                chat_id=user_id,
                photo=photo,
                caption=final_text,
                reply_markup=InlineKeyboardMarkup(
                    inline_keyboard=[
                        [
                            InlineKeyboardButton(
                                text="⚽ Тренуватись у WebApp",
                                web_app=WebAppInfo(
                                    url=f"https://football-blitz.online/trainings?user_id={user_id}")
                            )
                        ]
                    ]
                )
            )

            # Відправка сокет-події
            event_payload = make_payload(
                event_type="show_alert",
                user_id=user_id,
                payload={
                    "message": "Тренування завершено! Перевірте бот для деталей.",  # Коротке повідомлення для WebApp
                }
            )

            success = await publish_event(event_payload)
            logger.info(f"Status socket on finish training: {success}")

        except Exception as e:
            logger.error(f"Ошибка при отправке сообщения пользователю {self.owner_user_id}: {e}")