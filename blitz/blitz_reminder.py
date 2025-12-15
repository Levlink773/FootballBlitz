import asyncio
import time
import random
from datetime import datetime, timedelta

from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

from blitz.blitz_match.constans import START_BLITZ_PHOTO, REGISTER_BLITZ_PHOTO
from blitz.services.blitz_service import BlitzService
from blitz.services.message_sender.blitz_sender import send_message_all_users
from bot.callbacks.blitz_callback import BlitzRegisterCallback
from database.models.blitz import Blitz
from database.models.user_bot import UserBot, BlitzActive  # 👈 Додав імпорт BlitzActive
from logging_config import logger
from services.user_service import UserService
from webapp.fastapi.publisher import make_payload, make_payloads_for_users, publish_batch

# 👇 Імпортуємо генератор ботів
from utils.user_utils import BotGenerator


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
        """Варіанти для нагадування за 20 хвилин"""
        options = [
            f'''
🔔 <b>БЛІЦ-ТУРНІР СЬОГОДНІ О {self.start_time}</b> 🔔

⏳ Залишилось 20 хвилин до старту.
🎯 Натискай <b>«Зареєструватись 💪»</b> та готуйся до блискавичних поєдинків! ⚽️
Запис відкритий!
''',
            f'''
⚡️ <b>ГОТОВНІСТЬ 20 ХВИЛИН!</b> ⚡️

Час спливає, а місця розбирають! Турнір о {self.start_time} обіцяє бути спекотним.
🔥 Тисни <b>«Зареєструватись 💪»</b>, якщо готовий перемагати!
''',
            f'''
⚽️ <b>ФУТБОЛЬНИЙ БЛІЦ: 20 ХВ ДО СТАРТУ!</b>

Ти в грі чи на лаві запасних? О {self.start_time} починаємо битву за нагороди.
👉 Не зволікай, натискай <b>«Зареєструватись 💪»</b> зараз!
''',
            f'''
📣 <b>УВАГА, ГРАВЦІ! 20 ХВИЛИН!</b>

Адреналін піднімається. О {self.start_time} ми починаємо.
🏆 Твій шлях до кубка починається з кнопки <b>«Зареєструватись 💪»</b>. Дій!
''',
            f'''
🚀 <b>ЗВОРОТНІЙ ВІДЛІК: 20 ХВ</b>

Шанс показати скіл і забрати приз. Старт о {self.start_time}.
⚔️ Доведи, що ти кращий! Тисни <b>«Зареєструватись 💪»</b>!
'''
        ]
        return random.choice(options)

    def ten_minutes_left(self):
        """Варіанти для нагадування за 10 хвилин"""
        options = [
            '''
⏳ <b>Залишилось 10 хвилин до старту бліц-турніру!</b> ⏳

Реєструйся швидше, кількість місць обмежена! 🏆
''',
            '''
😱 <b>ВСЬОГО 10 ХВИЛИН!</b>

Встигни застрибнути в останній вагон! Турнір ось-ось почнеться.
🏃‍♂️ Тисни кнопку, поки є місця!
''',
            '''
🔥 <b>ГАРЯЧА ФАЗА! 10 ХВИЛИН ДО ГРИ!</b>

Суперники вже розминаються. А ти?
⚡️ Не гай часу, реєструйся і вривайся в бій!
''',
            '''
⚠️ <b>УВАГА! 10 ХВИЛИН ДО СВИСТКА!</b>

Ти ризикуєш пропустити головну подію дня!
🎯 Швидко реєструйся і готуйся перемагати!
''',
            '''
🚀 <b>ФІНАЛЬНИЙ ВІДЛІК: 10 ХВ!</b>

Вже скоро ми дізнаємось ім'я чемпіона. Це можеш бути ти!
📝 Реєструйся негайно!
'''
        ]
        return random.choice(options)

    def five_minutes_left(self):
        """Варіанти для нагадування за 5 хвилин"""
        options = [
            '''
‼️ <b>ШВИДЕНЬКО РЕЄСТРУЙСЯ!!!!</b> ‼️
👑 Не втрачай свій шанс стати королем турніру і отримати нагороди! 🏆
⏳ <b>Залишилось 5 хвилин до старту!</b> ⏳
''',
            '''
🚨 <b>ТРИВОГА! 5 ХВИЛИН ДО СТАРТУ!</b> 🚨

Двері зачиняються! Це твій останній шанс потрапити в сітку турніру.
🔥 ТИСНИ КНОПКУ ЗАРАЗ!
''',
            '''
⚡️ <b>БЛИСКАВИЧНА РЕЄСТРАЦІЯ! 5 ХВ!</b>

Часу на роздуми немає! Або ти в грі, або ти глядач.
🏃‍♂️ Бігом реєструйся, перемога чекає!
''',
            '''
🆘 <b>ТЕРМІНОВО! ТИ ЩЕ ВСТИГАЄШ!</b>

5 хвилин і ми починаємо! Не проґав свій момент слави!
🏆 Реєструйся, покажи клас!
''',
            '''
🏁 <b>ФІНІШНА ПРЯМА! 5 ХВИЛИН!</b>

Всі слоти майже забиті. Вривайся в останню мить!
💣 Тисни "Зареєструватись" і готуйся до бою!
'''
        ]
        return random.choice(options)

    def three_minutes_left(self):
        """Варіанти для нагадування за 3 хвилини (Тільки для ACTIVE)"""
        options = [
            '''
⚡️ <b>3 ХВИЛИНИ! АДРЕНАЛІН НА МАКСИМУМ!</b>

Ти досі не в грі? Твій суперник вже шнурує бутси!
😡 Тисни кнопку, покажи характер!
''',
            '''
🔥 <b>ВЖЕ ПАЛАЄ! 3 ХВИЛИНИ!</b>

Ще є мікро-шанс увірватися в турнірну сітку.
🚀 Не тупи, реєструйся!
''',
            '''
⏳ <b>3 ХВ ДО БИТВИ!</b>

Це нагадування для еліти. Ти готовий перемагати?
🏆 Забирай своє місце зараз!
''',
            '''
🧨 <b>МАЙЖЕ ВИБУХ! 3 ХВИЛИНИ!</b>

Час летить швидше, ніж м'яч у ворота.
🏃‍♂️ Встигни натиснути "Зареєструватись"!
''',
            '''
⚠️ <b>ОСТАННЄ ПОПЕРЕДЖЕННЯ! 3 ХВ!</b>

Не залишайся за бортом історії цього вечора.
⚔️ До зброї (тобто до гри)! Реєструйся!
'''
        ]
        return random.choice(options)

    def one_minute_left(self):
        """Варіанти для нагадування за 1 хвилину (Тільки для ACTIVE)"""
        options = [
            '''
🛑 <b>1 ХВИЛИНА! ЦЕ КІНЕЦЬ РЕЄСТРАЦІЇ!</b>

Або зараз, або ніколи!
🔥 ТИСНИ КНОПКУ НЕГАЙНО!
''',
            '''
😱 <b>60 СЕКУНД ДО СТАРТУ!</b>

Твій останній шанс стрибнути в цей потяг!
🚀 РЕЄСТРУЙСЯ! РЕЄСТРУЙСЯ!
''',
            '''
🆘 <b>НЕГАЙНО! 1 ХВИЛИНА!</b>

Суддя вже підносить свисток до рота.
⚡️ ВРИВАЙСЯ В ГРУ!
''',
            '''
💣 <b>ЗАРАЗ ПОЧНЕТЬСЯ! 1 ХВ!</b>

Не будь глядачем, будь чемпіоном!
🏆 Тисни "Зареєструватись" і погнали!
''',
            '''
🏃‍♂️ <b>ОСТАННІЙ РИВОК! 1 ХВИЛИНА!</b>

Місця зникають на очах.
‼️ ВСТИГНИ, ПОКИ Є ШАНС!
'''
        ]
        return random.choice(options)


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

    async def _send_reminder(self, reminder_time, get_text_func, allowed_modes: list[BlitzActive]):
        """
        Отправляет напоминание в указанное время только пользователям с подходящим BlitzActive.
        :param reminder_time: Время отправки
        :param get_text_func: Функция получения текста
        :param allowed_modes: Список режимов (ACTIVE, SIMPLE, WEAK), которым можно слать.
        """
        now = datetime.now()
        if now < reminder_time:
            # Ждем нужного времени
            await asyncio.sleep((reminder_time - now).total_seconds())

            # Получаем актуальный список зарегистрированных пользователей
            registered_users = await BlitzService.get_users_from_blitz_users(self.blitz_id)

            # Проверяем, нужно ли еще отправлять напоминание (есть ли места)
            if len(registered_users) < self.necessary_count_users:
                # Находим тех, кто еще не зарегистрировался
                unregister_users = await BlitzService.get_unregistered_users(self.blitz_id)

                # 🔥 Фільтруємо користувачів згідно з їх налаштуваннями BlitzActive
                # Також перевіряємо, щоб режим не був DISABLED
                target_users = [
                    u for u in unregister_users
                    if u.blitz_mode in allowed_modes and u.blitz_mode != BlitzActive.DISABLED and not u.disable_spam
                ]

                if target_users:
                    reminder_text = get_text_func()
                    await self.__reminder_blitz_for_users(target_users, reminder_text, self.blitz_id)

    async def remind(self) -> bool:
        now = datetime.now()
        today_start = self.blitz_start_at

        # Точки часу
        vip_remind_time = today_start - timedelta(minutes=self.remind_for_vip_users)
        simple_remind_time = today_start - timedelta(minutes=self.remind_for_simple_users)
        remind_10_minutes = today_start - timedelta(minutes=10)
        remind_5_minutes = today_start - timedelta(minutes=5)
        remind_3_minutes = today_start - timedelta(minutes=3)
        remind_1_minute = today_start - timedelta(minutes=1)

        # Час для додавання ботів (за 1 хвилину до старту, але трохи раніше, щоб встигнути перед пушем за 1 хв)
        add_bots_time = today_start - timedelta(minutes=1, seconds=5)

        # Отримуємо всіх юзерів для первинного фільтру (VIP/Simple)
        all_users = await UserService.get_all_users_where_end_register()

        # --- 1. VIP нагадування (30 хв) ---
        # Логіка: Шлемо VIPам, якщо у них не DISABLED
        if self.remind_for_vip_users > 0:
            if now < vip_remind_time:
                await asyncio.sleep((vip_remind_time - now).total_seconds())

            now = datetime.now()
            if now < today_start:
                vip_users = [
                    u for u in all_users
                    if u.vip_pass_is_active
                       and not u.disable_spam
                       and u.blitz_mode != BlitzActive.DISABLED
                ]
                # Тут перевіряємо, чи вже зареєстровані, всередині __reminder_blitz_for_users це не робиться,
                # але оскільки це найперше повідомлення, ймовірність мала.
                # Проте краще б використовувати _send_reminder логіку, але залишу як було для VIP,
                # додавши перевірку на реєстрацію, якщо це критично.
                # (В оригіналі перевірки не було, йшло всім VIP).
                await self.__reminder_blitz_for_users(vip_users, self.blitz_text_getter.msg_vip_user(), self.blitz_id)

        # --- 2. Звичайне нагадування (20 хв) ---
        # Логіка: Шлемо ACTIVE, SIMPLE, WEAK. (Всім крім DISABLED)
        if self.remind_for_simple_users > 0:
            allowed_20 = [BlitzActive.ACTIVE, BlitzActive.SIMPLE, BlitzActive.WEAK]

            if now < simple_remind_time:
                await asyncio.sleep((simple_remind_time - now).total_seconds())

            now = datetime.now()
            if now < today_start:
                # Фільтруємо simple users (не VIP), які не DISABLED
                simple_users = [
                    u for u in all_users
                    if not u.vip_pass_is_active
                       and not u.disable_spam
                       and u.blitz_mode in allowed_20
                ]
                await self.__reminder_blitz_for_users(simple_users, self.blitz_text_getter.msg_simple_user(),
                                                      self.blitz_id)

        # --- 3. Нагадування за 10 хвилин ---
        # Логіка: Тільки ACTIVE та SIMPLE (WEAK вже не отримує)
        await self._send_reminder(
            remind_10_minutes,
            self.blitz_text_getter.ten_minutes_left,
            allowed_modes=[BlitzActive.ACTIVE, BlitzActive.SIMPLE]
        )

        # --- 4. Нагадування за 5 хвилин ---
        # Логіка: Тільки ACTIVE та SIMPLE
        await self._send_reminder(
            remind_5_minutes,
            self.blitz_text_getter.five_minutes_left,
            allowed_modes=[BlitzActive.ACTIVE, BlitzActive.SIMPLE]
        )

        # --- 5. Нагадування за 3 хвилини ---
        # Логіка: Тільки ACTIVE
        await self._send_reminder(
            remind_3_minutes,
            self.blitz_text_getter.three_minutes_left,
            allowed_modes=[BlitzActive.ACTIVE]
        )

        # --- 6. Нагадування за 1 хвилину ---
        # Логіка: Тільки ACTIVE
        await self._send_reminder(
            remind_1_minute,
            self.blitz_text_getter.one_minute_left,
            allowed_modes=[BlitzActive.ACTIVE]
        )

        # --- ДОДАВАННЯ БОТІВ ---
        now = datetime.now()
        if now < add_bots_time:
            await asyncio.sleep((add_bots_time - now).total_seconds())

        current_users = await BlitzService.get_users_from_blitz_users(self.blitz_id)
        current_count = len(current_users)
        missing_count = self.necessary_count_users - current_count

        if missing_count > 0 and current_count > 0:
            logger.info(f"🤖 Не вистачає {missing_count} гравців. Запускаємо ботів для Blitz ID: {self.blitz_id}")
            start_time = time.perf_counter()
            try:
                await BotGenerator.create_bots(
                    count=missing_count,
                    add_to_blitz_id=self.blitz_id,
                    add_to_blitz_max_char=self.necessary_count_users
                )
                execution_time = time.perf_counter() - start_time
                logger.info(f"✅ Users created in {execution_time:.4f} seconds")
            except Exception as e:
                logger.error(f"❌ Помилка при генерації ботів: {e}")

        # --- Фінальне очікування та старт ---
        now = datetime.now()
        if now < today_start:
            await asyncio.sleep((today_start - now).total_seconds())

        users: list[UserBot] = await BlitzService.get_users_from_blitz_users(self.blitz_id)
        logger.info(f"Users len: {len(users)}")
        logger.info(f"Need len: {self.necessary_count_users}")

        if len(users) >= self.necessary_count_users:
            users = users[:self.necessary_count_users]
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
🔜 <b>Не засмучуйся!</b> Тренуйся та готуйся до наступних битв.
'''
            payloads = make_payloads_for_users(
                "show_alert",
                users,
                payload_factory=lambda u: {
                    "message": f"❌ Гра не відбулася. \n {len(users)} / {self.necessary_count_users}"}
            )

            await publish_batch(payloads, batch_size=32)
            await send_message_all_users(users, cancel_blitz_text)
            return False

        return True