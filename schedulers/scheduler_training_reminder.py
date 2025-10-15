# file: scheduler/training_reminder.py
import random
from datetime import datetime

from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from bot.callbacks.blitz_callback import BoxRewardCallback
from loader import bot
from services.character_service import CharacterService
from services.reminder_character_service import RemniderCharacterService
from services.user_service import UserService  # предполагается существование


class TrainingReminder:
    """
    Шедулер, который проверяет пользователей/персонажей,
    не тренировавшихся и отправляет одноразовые уведомления:
    3h, 6h, 12h, 24h.
    """

    CHECK_INTERVAL_MINUTES = 10  # как часто проверять (можно 5, 10, 15)
    # Сообщения для каждого порога (можно настроить/локализовать)
    MESSAGES = {
        3: [
            "🏃‍♂️ {name}, уже 3 години без тренувань! Поле сумує за твоїми ударами. Зроби коротке тренування і залишайся у формі чемпіона!",
            "⏱️ Минуло 3 години з останнього тренування, {name}. Розімни м'язи, виведи м'яч на поле і нагадай, хто тут головний у грі!"
        ],
        6: [
            "🔥 {name}, минуло 6 годин без тренування! Команда вже на полі, час повернутись і довести, що ти справжній лідер!",
            "⚽ {name}, футбольне серце сумує за грою! Зайди на тренування, покажи техніку і набери нову серію перемог!"
        ],
        12: [
            "⚠️ {name}, вже 12 годин без тренувань! Твоя форма потребує уваги — повернись на поле, щоб не втратити темп чемпіона!",
            "🏅 12 годин без тренувань — пора діяти, {name}! Кожне тренування наближає тебе до вершини рейтингу!"
        ],
        24: [
            "🎁 {name}, минула доба без тренувань! За повернення на поле ми підготували для тебе подарунок — покажи, що справжній гравець завжди в грі!",
            "🎉 Цілих 24 години без тренування! Повернись у гру, отримай свій бонус і доведи, що твоя мотивація сильніша за паузи!"
        ]
    }
    def __init__(self):
        self.scheduler = AsyncIOScheduler()

    async def start(self):
        """Добавляем периодическую задачу и запускаем планировщик"""
        # добавляем задачу, которая будет запускать проверку каждые CHECK_INTERVAL_MINUTES
        self.scheduler.add_job(self._check_all, 'interval', minutes=self.CHECK_INTERVAL_MINUTES,
                               next_run_time=datetime.now())
        self.scheduler.start()

    async def _check_all(self):
        """Основная проверка: достаём список напоминаний и обрабатываем каждого"""
        try:
            reminders = await RemniderCharacterService.get_characters_not_training()
        except Exception as e:
            print("Error fetching reminders:", e)
            return

        now = datetime.now()

        for reminder in reminders:
            # reminder.character_id ожидается
            try:
                character = await CharacterService.get_character_by_id(reminder.character_id)
                if not character:
                    continue

                user_id = character.characters_user_id
                if not user_id:
                    continue

                user = await UserService.get_user(user_id)
                if not user:
                    continue

                # если у пользователя нет информации о последнем тренинге — пропускаем
                if not user.last_training:
                    await UserService.update_training_time(user.user_id)
                    continue

                diff_hours = (now - user.last_training).total_seconds() / 3600.0

                # Важно проверять в порядке убывания, чтобы 24ч сработал раньше, чем 12/6/3
                # и чтобы отправлялся только один тип сообщения за проверку (elif chain)
                if diff_hours >= 24:
                    # если ещё не уведомляли 24h
                    if not getattr(user, "notified_24h", False):
                        await self._handle_24h(user, character)
                elif diff_hours >= 12:
                    if not getattr(user, "notified_12h", False):
                        await self._handle_notify(user, character, hours=12)
                elif diff_hours >= 6:
                    if not getattr(user, "notified_6h", False):
                        await self._handle_notify(user, character, hours=6)
                elif diff_hours >= 3:
                    if not getattr(user, "notified_3h", False):
                        await self._handle_notify(user, character, hours=3)

            except Exception as e:
                # логируем, не ломаем весь цикл
                print(f"Error processing reminder {reminder}: {e}")

    async def _handle_notify(self, user, character, hours: int):
        """Отправляет текстовое уведомление и помечает флаг notified_Xh"""
        try:
            text = random.choice(self.MESSAGES.get(hours, [])).format(name=character.name)
            await bot.send_message(chat_id=user.user_id, text=text, reply_markup=InlineKeyboardMarkup(
                inline_keyboard=[
                    [
                        InlineKeyboardButton(
                            text="⚽ Тренуватись у WebApp",
                            web_app=WebAppInfo(
                                url=f"https://football-blitz.online/trainings?user_id={user.user_id}")
                        )
                    ]
                ]
            ))
            await UserService.set_notified(user.user_id, f"notified_{hours}h", True)

        except Exception as e:
            print(f"Failed to notify user {user.user_id} for {hours}h: {e}")

    async def _handle_24h(self, user, character):
        """Выдача подарка за 24 часа и пометка флага notified_24h"""
        try:

            # 2) уведомляем игрока о подарке
            text = random.choice(self.MESSAGES[24]).format(name=character.name)
            text += f"\n\n🎁 Твій подарунок:"
            await bot.send_message(chat_id=user.user_id, text=text,
                                   reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                                       [InlineKeyboardButton(text="Відкрити 🗝️",
                                                             callback_data=BoxRewardCallback(box_type="medium").pack())],
                                        [InlineKeyboardButton(
                                            text="⚽ Тренуватись у WebApp",
                                            web_app=WebAppInfo(
                                                url=f"https://football-blitz.online/trainings?user_id={user.user_id}")
                                        )]
                                   ]))
            await UserService.add_count_of_medium_box(user.user_id)
            # 3) помечаем, что подарок выдан (чтобы не выдавать повторно)
            await UserService.set_notified(user.user_id, "notified_24h", True)


        except Exception as e:
            print(f"Failed to give 24h gift to user {user.user_id}: {e}")
