import random
from datetime import datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger

from bot.keyboards.gym_keyboard import no_energy_keyboard

from database.models.character import Character

from services.character_service import CharacterService

from loader import bot

class TextReminder:
    texts = [
        "Бракує енергії? Твій футболіст хоче перемагати та досягати нових висот! Підкорюй турніри та виконуй завдання в Учбовому центрі, щоб підкріпити його сили. Разом до легенди! ⚡🏆",
        "Втомився зупинятися на півдорозі? Додай енергії своєму футболісту – грай у турнірах і виконуй завдання, щоб досягти нових вершин! 🚀",
        "Твій футболіст на межі? Дай йому нові сили для перемог – вигравай турніри, виконуй місії та піднімайся до вершин футбольної слави! 🌟",
        "Сила для перемоги! 🚀 Зароби енергію у турнірах та в Учбовому центрі і покажи на полі, хто тут лідер! 🏆",
        "Не давай своїм мріям зупинятися! Отримуй енергію у турнірах та завданнях і зроби свого футболіста ще сильнішим! 💪",
        "Твій футболіст готовий до великих перемог, але йому потрібна твоя підтримка! Пройди турніри та завдання, щоб він не зупинився на півдорозі! ⚡",
        "Він прагне до перемог, але йому не вистачає сил! Бери участь у турнірах та виконуй завдання – разом ви дістанетеся футбольних вершин! 🏆",
        "Тренування йде на спад? Поверни драйв! Бери енергію в турнірах та в Учбовому центрі й повертайся до великої гри! 🔥",
        "Зупинятися не варіант! Покажи, що твій футболіст – справжня зірка! Зароби енергію у турнірах та місіях і йди до перемоги! 🌟",
        "У нього є все, окрім енергії! Додай її, виграючи турніри та виконуючи завдання, і веди свого футболіста до величі! ⚡🔥"
    ]

    @staticmethod
    def get_random_text():
        return random.choice(TextReminder.texts)

class ReminderTraning:
    
    task_times = [
        "13:10", "14:10", 
        "15:10", "16:20", 
        "17:30", "18:40",
        "19:30", "20:10"
    ]
    default_trigger_start = CronTrigger(hour=8)

    
    def __init__(self) -> None:
        self.scheduler = AsyncIOScheduler()
    
    async def start(self):
        self.scheduler.add_job(
            func    = self._start, 
            trigger = self.default_trigger_start,
            misfire_grace_time = 10
        )
        self.scheduler.start()
    
    
    async def _start(self):
        random_trigger = self.get_random_trigger
        self.scheduler.add_job(
            func    = self.training_reminder,
            trigger = random_trigger,
            misfire_grace_time = 10
        )
        
    async def training_reminder(self):
        all_characters = await CharacterService.get_all_users_not_bot()
        for character in all_characters:
            await self._send_message(character)

    async def _send_message(self, character: Character):
        try:
            
            await bot.send_message(
                chat_id = character.characters_user_id,
                text = TextReminder.get_random_text(),
                reply_markup = no_energy_keyboard()
            )
        except Exception as E:
            print(E)
        
    @property
    def get_random_trigger(self) -> DateTrigger:
        current_date = datetime.now().date()
        random_time = random.choice(self.task_times)
        hour, minute = map(int, random_time.split(":"))
        
        run_date = datetime.combine(current_date, datetime.min.time())
        run_date += timedelta(hours=hour, minutes=minute)
        return DateTrigger(run_date=run_date)
