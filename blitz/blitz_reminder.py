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
from webapp.fastapi.publisher import make_payload, publish_event, make_payloads_for_users, publish_batch


class BlitzTextGetter:

    def __init__(self, start_time: str, count_users: int):
        self.start_time = start_time
        self.count_users = count_users
        self.part_of_final = count_users // 2

    def start_tournament(self):
        return f"""
🚀 <b>БЛІЦ-ТУРНІР РОЗПОЧИНАЄТЬСЯ!</b> 🚀

📣 Ласкаво просимо на найшвидший і найзапекліший турнір дня! Сьогодні о {self.start_time} {self.count_users} команди вийшли на поле, щоб вибороти звання чемпіона блиц-турніру.

⚙️ Механіка коротка, але яскрава:
– 5 хвилин 7 вирішальних моментів
– 30 секунд на атаку
– Донат енергії X5

Зараз формується список команд і незабаром ви дізнаєтеся своїх напарників.

⏳ Через хвилину почнеться 1/{self.count_users} фіналу – будьте готові до блискавичної боротьби й точних ударів!
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

    def ten_minutes_left(self):
        return '''
⏳ <b>Залишилось 10 хвилин до старту бліц-турніру!</b> ⏳

Реєструйся швидше, кількість місць обмежена! 🏆
'''

    def five_minutes_left(self):
        return '''
‼️ <b>ШВИДЕНЬКО РЕЄСТРУЙСЯ!!!!</b> ‼️
👑 Не втрачай свій шанс стати королем турніру і отрмати нагороди! 🏆
⏳ <b>Залишилось 5 хвилин до старту!</b> ⏳
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

    async def __reminder_blitz_for_users(self, users: list[UserBot], text: str, blitz_id: int):
        if not users:
            return
        callback_data = BlitzRegisterCallback(blitz_id=blitz_id, max_characters=self.necessary_count_users,
                                              registration_cost=self.registration_cost).pack()
        markup = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="Зареєструватись 💪", callback_data=callback_data)]
        ])
        await send_message_all_users(users, text, reply_markup=markup, photo_path=self.register_photo_path)

    async def _send_reminder(self, reminder_time, all_users, get_reminder_text_func):
        """Отправляет напоминание в указанное время, если необходимо."""
        now = datetime.now()
        if now < reminder_time:
            # Ждем нужного времени
            await asyncio.sleep((reminder_time - now).total_seconds())

            # Получаем актуальный список зарегистрированных пользователей
            registered_users = await BlitzService.get_users_from_blitz_users(self.blitz_id)

            # Проверяем, нужно ли еще отправлять напоминание
            if len(registered_users) < self.necessary_count_users:
                # Находим тех, кто еще не зарегистрировался
                unregister_users = await BlitzService.get_unregistered_users(self.blitz_id)


                # Отправляем напоминание только им
                reminder_text = get_reminder_text_func()
                await self.__reminder_blitz_for_users(unregister_users, reminder_text, self.blitz_id)
    async def remind(self) -> bool:
        now = datetime.now()
        today_start = self.blitz_start_at
        vip_remind_time = today_start - timedelta(minutes=self.remind_for_vip_users)
        simple_remind_time = today_start - timedelta(minutes=self.remind_for_simple_users)
        remind_10_minutes = today_start - timedelta(minutes=10)
        remind_5_minutes = today_start - timedelta(minutes=5)

        all_users = await UserService.get_all_users_where_end_register()
        all_users = [u for u in all_users if not u.disable_spam]

        if self.remind_for_vip_users > 0:
            if now < vip_remind_time:
                await asyncio.sleep((vip_remind_time - now).total_seconds())
                vip_users = [user for user in all_users if user.vip_pass_is_active if not user.disable_spam]
                await self.__reminder_blitz_for_users(vip_users, self.blitz_text_getter.msg_vip_user(), self.blitz_id)
            elif now < today_start:
                vip_users = [user for user in all_users if user.vip_pass_is_active if not user.disable_spam]
                await self.__reminder_blitz_for_users(vip_users, self.blitz_text_getter.msg_vip_user(), self.blitz_id)

        now = datetime.now()
        if self.remind_for_simple_users > 0:
            if now < simple_remind_time:
                await asyncio.sleep((simple_remind_time - now).total_seconds())
                simple_users = [user for user in all_users if not user.vip_pass_is_active if not user.disable_spam]
                await self.__reminder_blitz_for_users(simple_users, self.blitz_text_getter.msg_simple_user(), self.blitz_id)
            elif now < today_start:
                simple_users = [user for user in all_users if not user.vip_pass_is_active if not user.disable_spam]
                await self.__reminder_blitz_for_users(simple_users, self.blitz_text_getter.msg_simple_user(), self.blitz_id)

        # Напоминание за 10 минут
        await self._send_reminder(
            remind_10_minutes,
            all_users,
            self.blitz_text_getter.ten_minutes_left
        )

        # Напоминание за 5 минут
        await self._send_reminder(
            remind_5_minutes,
            all_users,
            self.blitz_text_getter.five_minutes_left
        )
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
            await UserService.add_energy_to_users(
                [user.user_id for user in users],
                self.registration_cost,
            )
            cancel_blitz_text = f'''
<b>На жаль, на цей бліц-турнір не з'явилось достатньої кількості гравці!</b>

{len(users)} / {self.necessary_count_users}

❌ Гра не відбулася.

🔜 <b>Не засмучуйся!</b> Тренуйся та готуйся до наступних битв. Твої перемоги ще попереду!

⚽️ Залишайся з нами, новий бліц-турнір вже скоро, дивись на графіку!
            '''
            payloads = make_payloads_for_users(
                "show_alert",
                users,
                payload_factory=lambda u: {
                    "message": f"❌ Гра не відбулася. \n {len(users)} / {self.necessary_count_users}"}
            )

            # 2а) Лучший вариант — отправить пакетами через pipeline
            results = await publish_batch(payloads, batch_size=32)
            logger.info("publish_batch results: sent=%s total=%s", sum(1 for r in results if r), len(results))
            await send_message_all_users(users, cancel_blitz_text)
            return False
        return True