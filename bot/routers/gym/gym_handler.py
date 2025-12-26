from datetime import datetime
from datetime import timedelta

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery

from bot.callbacks.gym_calbacks import SelectTimeGym
from bot.keyboards.gym_keyboard import select_time_to_gym
from constants import const_energy_by_time, GYM_PHOTO
from database.models.character import Character
from database.models.user_bot import UserBot
from gym_character.core.gym import Gym
from gym_character.core.manager import GymCharacterManager
from logging_config import logger
from services.reminder_character_service import RemniderCharacterService
from services.user_service import UserService

gym_router = Router()


@gym_router.message(
    F.text.regexp(r"(✅\s*)?🏋️‍♂️ Тренування(\s*✅)?")
)
async def go_to_gym(
        message: Message,
):
    # Текст оновлено, щоб користувач розумів, що тренується вся команда
    await message.answer_photo(
        photo=GYM_PHOTO,
        caption="""
🏋️‍♂️ <b>Командне тренування</b>

Тренування застосовується до <b>всіх</b> ваших гравців одночасно!

<b>30 хвилин</b>, шанс підвищення навички <b>35%</b>
💰 Вартість: <b>10⚡ енергії</b>

<b>60 хвилин</b>, шанс підвищення навички <b>45%</b>
💰 Вартість: <b>20⚡ енергії</b>

<b>90 хвилин</b>, шанс підвищення навички <b>55%</b>
💰 Вартість: <b>40⚡ енергії</b>

<b>120 хвилин</b>, шанс підвищення навички <b>75%</b>
💰 Вартість: <b>60⚡ енергії</b>
""",
        reply_markup=select_time_to_gym(message.from_user.id)
    )


@gym_router.callback_query(
    SelectTimeGym.filter(),
)
async def start_gym(
        query: CallbackQuery,
        callback_data: SelectTimeGym,
        user: UserBot,
        # character: Character, # Можна прибрати, бо ми працюємо зі списком user.characters
):
    _time_training = callback_data.gym_time

    # 1. Перевіряємо, чи є взагалі гравці
    if not user.characters:
        return await query.message.reply(
            "<b>⚠️ У вас немає жодного футболіста!</b>\n"
            "🏟 Створіть або придбайте гравців, щоб почати тренування."
        )

    # 2. Перевіряємо, чи хтось із гравців вже зайнятий
    # Якщо хоча б один reminder каже, що гравець тренується - блокуємо
    for char in user.characters:
        if char.reminder and char.reminder.character_in_training:
            return await query.message.reply(
                f"<b>💪 Гравець {char.name} вже проходить тренування!</b>\n"
                "⏳ Дочекайтесь завершення поточного заняття, щоб почати нове для всієї команди."
            )

    cost_gym = const_energy_by_time[callback_data.gym_time]

    # 3. Перевірка енергії
    if user.energy < cost_gym:
        try:
            return await query.message.answer(
                text=(
                    "<b>⚡ Недостатньо енергії!</b>\n"
                    f"Вартість цього тренування: <b>{cost_gym} енергії</b>\n"
                    f"У вас зараз: <b>{user.energy} енергії</b>\n\n"
                    "💡 Ви можете отримати енергію:\n"
                    "• Виконуючи завдання в 🧠 Учбовому центрі\n"
                    "• Беручи участь у 🏆 турнірах\n"
                )
            )
        except:
            return

    reduction_time = _time_training.total_seconds()
    end_time_training = datetime.now() + timedelta(seconds=reduction_time)

    # Оновлюємо інтерфейс
    caption = """
🚀 <b>Починаю командне тренування</b>

👥 Гравців на тренуванні: <b>{count}</b>
👟 До завершення тренування - {end_time} хв

⏰ Тренування завершиться в <b>{end_time_full}</b>
""".format(
        count=len(user.characters),
        end_time=int(_time_training.total_seconds() / 60),
        end_time_full=end_time_training.strftime("%Y-%m-%d %H:%M")
    )

    # Списуємо енергію
    await UserService.consume_energy(user.user_id, cost_gym)

    try:
        await query.message.edit_caption(caption=caption, reply_markup=None)
    except Exception as e:
        logger.error(e)
        await query.message.answer(text=caption, reply_markup=None)

    # 4. Оновлюємо дані в БД для ВСІХ персонажів
    now = datetime.now()
    gym_seconds = int(callback_data.gym_time.total_seconds())

    for char in user.characters:
        # Оновлюємо час і статус в БД для кожного гравця
        await RemniderCharacterService.update_training_info(
            character_id=char.id,
            time_start_training=now,
            time_training_seconds=gym_seconds
        )
        await RemniderCharacterService.toggle_character_training_status(character_id=char.id)

    # 5. Запускаємо Gym для списку персонажів
    gym_scheduler = Gym(
        characters=user.characters,  # Передаємо список!
        time_training=callback_data.gym_time,
    )
    task_training = gym_scheduler.start_training()

    # 6. Реєструємо задачу в менеджері для кожного персонажа
    # Це потрібно, щоб при виклику "leave_from_gym" для будь-якого ID ми знайшли цю таску
    for char in user.characters:
        GymCharacterManager.add_gym_task(
            character_id=char.id,
            task=task_training
        )

    await query.message.answer(f'''
💪 Ви витратили <b>{cost_gym} енергії</b>!
Вся команда ({len(user.characters)} гравців) почала тренування! ⚽🔥
    ''')


@gym_router.callback_query(F.data == "get_out_of_gym")
async def leave_from_gym(query: CallbackQuery, character: Character):
    """
    Скасовує тренування. Оскільки Gym клас тепер керує групою,
    скасування задачі для одного ID (через менеджер) скасує таску,
    а Gym._wait_training обробить CancelledError і зніме статус з усіх гравців.
    """
    await GymCharacterManager.remove_gym_task(character.id)
    await query.message.answer("Тренування скасовано для всієї команди.")