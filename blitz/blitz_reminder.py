import asyncio
from datetime import datetime, timedelta

from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

from blitz.blitz_match.constans import START_BLITZ_PHOTO, REGISTER_BLITZ_PHOTO
from blitz.services.blitz_service import BlitzService
from blitz.services.message_sender.blitz_sender import send_message_all_users
from bot.callbacks.blitz_callback import BlitzRegisterCallback
from database.models.blitz import Blitz
from database.models.user_bot import UserBot
from logging_config import logger
from services.user_service import UserService


class BlitzTextGetter:

    def __init__(self, start_time: str, count_users: int):
        self.start_time = start_time
        self.count_users = count_users
        self.count_team = count_users // 2

    def start_tournament(self):
        return f"""
🚀 <b>БЛІЦ-ТУРНІР РОЗПОЧИНАЄТЬСЯ!</b> 🚀

📣 Ласкаво просимо на найшвидший і найзапекліший турнір дня! Сьогодні о {self.start_time} {self.count_users} учасники ({self.count_team} команд по 2 гравці) вийшли на поле, щоб вибороти звання чемпіона блиц-турніру.

⚙️ Механіка коротка, але яскрава:
– 5 хвилин 7 вирішальних моментів  
– 30 секунд на атаку  
– Донат енергії X5  

Зараз формується список команд і незабаром ви дізнаєтеся своїх напарників.  

⏳ Через хвилину почнеться 1/8 фіналу – будьте готові до блискавичної боротьби й точних ударів!  
Удачі всім і нехай сильніші здобудуть перемогу! 💥
            """

    def msg_vip_user(self):
        return f'''
⏰ <b>БЛІЦ-ТУРНІР СТАРТУЄ СЬОГОДНІ О {self.start_time}!</b> ⏰

Не пропусти свій шанс — натискай на кнопку <b>«Зареєструватись 💪»</b> і покажіть, що ви не просто гравець — ви лідер, стратег і легенда турніру!💥 🏆
'''

    def msg_simple_user(self):
        return f'''
🔔 БЛІЦ-ТУРНІР СЬОГОДНІ О {self.start_time} 🔔

⏳ Залишилось 20 хвилин до старту.
🎯 Натискай <b>«Зареєструватись 💪»</b> та готуйся до блискавичних поєдинків! ⚽️
Запис відкритий!
'''


class BlitzReminder:
    def __init__(self,
                 blitz: Blitz,
                 registration_cost: int,
                 remind_for_simple_users: int = 20,
                 remind_for_vip_users: int = 30,
                 necessary_count_users: int = 32,
                 register_photo_path: str = REGISTER_BLITZ_PHOTO
                 ):
        self.blitz_start_at = blitz.start_at
        time_str = self.blitz_start_at.strftime("%H:%M")
        self.blitz_text_getter = BlitzTextGetter(time_str, necessary_count_users)
        self.blitz_id = blitz.id
        self.remind_for_simple_users = remind_for_simple_users
        self.remind_for_vip_users = remind_for_vip_users
        self.necessary_count_users = necessary_count_users
        self.registration_cost = registration_cost
        self.register_photo_path = register_photo_path

    async def __reminder_blitz_for_users(self, users: list[UserBot], required_vip: bool, blitz_id: int):
        filtered_users = [
            user for user in users
            if user.vip_pass_is_active == required_vip
        ]
        if not filtered_users:
            return
        text = self.blitz_text_getter.msg_vip_user() if required_vip else self.blitz_text_getter.msg_simple_user()
        callback_data = BlitzRegisterCallback(blitz_id=blitz_id, max_characters=self.necessary_count_users,
                                              registration_cost=self.registration_cost).pack()
        markup = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="Зареєструватись 💪", callback_data=callback_data)]
        ])
        await send_message_all_users(filtered_users, text, reply_markup=markup, photo_path=self.register_photo_path)

    async def remind(self) -> bool:
        now = datetime.now()
        today_start = self.blitz_start_at
        vip_remind_time = today_start - timedelta(minutes=self.remind_for_vip_users)
        simple_remind_time = today_start - timedelta(minutes=self.remind_for_simple_users)
        users = await UserService.get_all_users_where_end_register()
        if self.remind_for_vip_users > 0:
            if now < vip_remind_time:
                await asyncio.sleep((vip_remind_time - now).total_seconds())
                await self.__reminder_blitz_for_users(users, True, self.blitz_id)
            elif now < today_start:
                await self.__reminder_blitz_for_users(users, True, self.blitz_id)

        now = datetime.now()
        if self.remind_for_simple_users > 0:
            if now < simple_remind_time:
                await asyncio.sleep((simple_remind_time - now).total_seconds())
                await self.__reminder_blitz_for_users(users, False, self.blitz_id)
            elif now < today_start:
                await self.__reminder_blitz_for_users(users, False, self.blitz_id)

        now = datetime.now()
        if now < today_start:
            await asyncio.sleep((today_start - now).total_seconds())
        users: list[UserBot] = await BlitzService.get_users_from_blitz_users(self.blitz_id)
        logger.info(f"Users len: {len(users)}")
        logger.info(f"Need len: {self.necessary_count_users}")
        logger.info(f"Blitz id: {self.blitz_id}")
        if len(users) >= self.necessary_count_users:
            users = users[:self.necessary_count_users]
            logger.info(f"Users len 1: {len(users)}")
            await send_message_all_users(users, self.blitz_text_getter.start_tournament(), photo_path=START_BLITZ_PHOTO)
        else:
            cancel_blitz_text = f'''
<b>На жаль, на цей бліц-турнір не з'явилось достатньої кількості гравці!</b>

{len(users)} / {self.necessary_count_users}

❌ Гра не відбулася.

🔜 <b>Не засмучуйся!</b> Тренуйся та готуйся до наступних битв. Твої перемоги ще попереду!

⚽️ Залишайся з нами, новий бліц-турнір вже скоро, дивись на графіку!
            '''
            await send_message_all_users(users, cancel_blitz_text)
            return False
        return True
