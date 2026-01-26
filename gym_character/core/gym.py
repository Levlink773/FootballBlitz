import asyncio
from asyncio import Task
from datetime import timedelta, datetime
from typing import List, Dict

from aiogram import Bot
from aiogram.types import FSInputFile, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

from constants import (
    chance_add_point,
    CHANCE_VIP_PASS, const_energy_by_time
)
from database.models.character import Character
from database.models.user_boost import BoostType
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
            characters: List[Character],
            time_training: timedelta,
    ) -> None:
        self.characters = characters
        self.time_training = time_training
        self.results_training: Dict[int, ResultTraining] = {}
        self.boost_multiplier: float = 1.0

    @property
    def delta_time_training(self) -> int:
        return int(self.time_training.total_seconds())

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
            if self.owner_user_id:
                # Оновлюємо час початку тренування
                await UserService.update_training_time(self.owner_user_id)

                # --- ЛОГІКА БУСТА НА ШВИДКІСТЬ (SPEED) ---
                user = await UserService.get_user(self.owner_user_id)
                if user:
                    # Використовуємо property active_boost, яку ми додали в модель UserBot
                    # Якщо ви не додали property, тут треба циклом перебирати user.boosts
                    active_boost = getattr(user, "active_boost", None)

                    if active_boost and active_boost.effect == BoostType.TRAINING_SPEED:
                        percent = active_boost.percent
                        # Зменшуємо час очікування
                        time_sleep = int(time_sleep * (1 - percent / 100))
                        # Захист від миттєвого завершення (мінімум 10 сек)
                        time_sleep = max(10, time_sleep)
                        logger.info(f"User {self.owner_user_id}: Applied SPEED boost {percent}%. Time: {time_sleep}s")

            # Чекаємо (вже з урахуванням буста)
            await asyncio.sleep(time_sleep)

            # Запускаємо розрахунок результатів
            await self._run_training()

        except asyncio.CancelledError:
            # Скасування
            for char in self.characters:
                await RemniderCharacterService.anulate_character_training_status(char.id)
                await RemniderCharacterService.anulate_training_character(char.id)

    async def _run_training(self) -> None:
        cost_gym = const_energy_by_time.get(self.time_training, 0)

        try:
            base_chance = chance_add_point.get(self.time_training, 50)
            is_vip = False
            self.boost_multiplier = 1.0

            if self.owner_user_id:
                user = await UserService.get_user(self.owner_user_id)
                if user:
                    is_vip = user.vip_pass_is_active

                    # --- ЛОГІКА БУСТА НА ЕФЕКТИВНІСТЬ (EFFICIENCY) ---
                    active_boost = getattr(user, "active_boost", None)

                    if active_boost and active_boost.effect == BoostType.TRAINING_EFFICIENCY:
                        self.boost_multiplier = 1 + (active_boost.percent / 100)
                        logger.info(f"User {self.owner_user_id}: Applied EFFICIENCY boost {active_boost.percent}%")

            if is_vip:
                base_chance += CHANCE_VIP_PASS

            # --- ОБРОБКА ПЕРСОНАЖІВ ---
            for char in self.characters:
                # Перевірка статусу в БД
                if not await RemniderCharacterService.character_in_training(character_id=char.id):
                    continue

                success = check_chance(base_chance)
                result = ResultTraining.SUCCESS if success else ResultTraining.FAILURE
                self.results_training[char.id] = result

                if result == ResultTraining.SUCCESS:
                    # Розрахунок з урахуванням буста
                    points = char.how_much_power_can_add * self.boost_multiplier
                    await CharacterService.update_power(char, points)

            # Статистика юзера
            if self.owner_user_id:
                await UserService.add_count_go_to_gym_user(self.owner_user_id, 1)
                # Також зараховуємо в загальну статистику "разів в залі"
                await UserService.add_full_count_to_gym(self.owner_user_id, 1)

            # Повідомлення + Сокет
            await self.send_end_training_message()

            # Очистка менеджера
            for char in self.characters:
                await GymCharacterManager.remove_gym_task(char.id)

        except Exception as e:
            logger.error(f"Critical error in group training for user {self.owner_user_id}: {e}")
            # Повертаємо енергію при збої
            if self.owner_user_id:
                await UserService.add_energy_user(self.owner_user_id, cost_gym)
        finally:
            # Очистка статусів в БД
            for char in self.characters:
                await RemniderCharacterService.anulate_character_training_status(char.id)
                await RemniderCharacterService.anulate_training_character(char.id)

    async def send_end_training_message(self) -> None:
        try:
            if not self.characters:
                return

            user_id = self.owner_user_id
            message_lines = ["🏋️‍♂️ <b>Тренування завершено!</b>\n"]
            overall_success = False

            for char in self.characters:
                res = self.results_training.get(char.id, ResultTraining.FAILURE)
                if res == ResultTraining.SUCCESS:
                    overall_success = True
                    points = char.how_much_power_can_add * self.boost_multiplier
                    # Додаємо емодзі вогника, якщо був буст
                    boost_icon = "🔥" if self.boost_multiplier > 1.0 else ""
                    message_lines.append(f"✅ <b>{char.name}:</b> +{points:.2f} сили {boost_icon}")
                else:
                    message_lines.append(f"❌ <b>{char.name}:</b> Невдача")

            final_text = "\n".join(message_lines)

            # Використовуємо константи для шляхів (краще винести в Config)
            # Приклад: photo_path = Config.IMAGES.TRAINING_SUCCESS if overall_success else Config.IMAGES.TRAINING_FAILURE
            # Поки залишаємо як у вас, але краще переробити
            photo_path = f"src/{'success' if overall_success else 'failure'}_training.jpg"

            try:
                photo = FSInputFile(photo_path)
            except:
                photo = None  # Fallback if image missing

            if photo:
                await bot.send_photo(
                    chat_id=user_id,
                    photo=photo,
                    caption=final_text,
                    reply_markup=self._get_webapp_keyboard(user_id)
                )
            else:
                await bot.send_message(
                    chat_id=user_id,
                    text=final_text,
                    reply_markup=self._get_webapp_keyboard(user_id)
                )

            # Відправка сокету для оновлення інтерфейсу WebApp
            await self._send_socket_event(user_id)

        except Exception as e:
            logger.error(f"Error sending training report to {self.owner_user_id}: {e}")

    def _get_webapp_keyboard(self, user_id: int):
        return InlineKeyboardMarkup(
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

    async def _send_socket_event(self, user_id: int):
        """Оновлює дані на фронтенді через сокет"""
        try:
            # Отримуємо оновленого юзера для відправки актуальних даних (енергія, сила і т.д.)
            user = await UserService.get_user(user_id)
            if not user:
                return

            # Формуємо payload з оновленими даними юзера
            # Функція user_to_dict повинна бути доступна (або імпортована з роутера/сервісу)
            # Для прикладу відправляємо просто повідомлення, але краще відправляти повний об'єкт

            event_payload = make_payload(
                event_type="training_finished",  # Краще мати окремий тип події
                user_id=user_id,
                payload={
                    "message": "Тренування завершено!",
                    "success": True
                }
            )
            await publish_event(event_payload)
        except Exception as e:
            logger.error(f"Socket error: {e}")