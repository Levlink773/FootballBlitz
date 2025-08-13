from datetime import datetime
from datetime import timedelta

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery

from bot.callbacks.gym_calbacks import SelectTimeGym
from bot.keyboards.gym_keyboard import select_time_to_gym
from constants import const_energy_by_time, GYM_PHOTO
from database.models.character import Character
from database.models.user_bot import (
    UserBot
)
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
    await message.answer_photo(
        photo=GYM_PHOTO,
        caption="""
<b>30 хвилин</b>, шанс підвищення навички <b>35%</b>
💰 Вартість: <b>10⚡ енергії</b>
    
<b>60 хвилин</b>, шанс підвищення навички <b>45%</b>
💰 Вартість: <b>20⚡ енергії</b>
    
<b>90 хвилин</b>, шанс підвищення навички <b>55%</b>
💰 Вартість: <b>40⚡ енергії</b>
    
<b>120 хвилин</b>, шанс підвищення навички <b>75%</b>
💰 Вартість: <b>60⚡ енергії</b>
""",
        reply_markup=select_time_to_gym()
    )


@gym_router.callback_query(
    SelectTimeGym.filter(),
)
async def start_gym(
        query: CallbackQuery,
        callback_data: SelectTimeGym,
        user: UserBot,
        character: Character,
):
    _time_training = callback_data.gym_time
    if not character or not user.main_character:
        return await query.message.reply(
            "<b>⚠️ У вас поки що немає основного футболіста!</b>\n"
            "🏟 Створіть або придбайте гравця, щоб почати тренування."
        )

    if character.reminder.character_in_training:
        return await query.message.reply(
            "<b>💪 Ваш футболіст уже проходить тренування!</b>\n"
            "⏳ Дочекайтесь завершення поточного заняття, щоб почати нове."
        )

    cost_gym = const_energy_by_time[callback_data.gym_time]
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
    user = await UserService.consume_energy(user_id=user.user_id, amount_energy_consume=cost_gym)
    logger.info(f"user energy: {user.energy}")

    reduction_time = _time_training.total_seconds()
    end_time_training = datetime.now() + timedelta(seconds=reduction_time)

    caption = """
🚀 <b>Починаю тренування</b>

👟 До завершення тренування - {end_time} хв

⏰ Тренування завершиться в <b>{end_time_full}</b>
""".format(
        end_time=int(_time_training.total_seconds() / 60),
        end_time_full=end_time_training.strftime("%Y-%m-%d %H:%M")
    )
    await query.message.edit_caption(caption=caption, reply_markup=None)
    gym_scheduler = Gym(
        character=user.main_character,
        time_training=callback_data.gym_time,
    )
    task_training = gym_scheduler.start_training()
    GymCharacterManager.add_gym_task(
        character_id=user.main_character.id,
        task=task_training
    )
    await RemniderCharacterService.update_training_info(
        character_id=user.main_character.id,
        time_start_training=datetime.now(),
        time_training_seconds=int(callback_data.gym_time.total_seconds())
    )
    await RemniderCharacterService.toggle_character_training_status(character_id=character.id)
    await query.message.answer(f'''
💪 Ви витратили <b>{cost_gym} енергії</b> на тренування!
Час прокачати свого футболіста та підняти команду на новий рівень! ⚽🔥
    ''')


@gym_router.callback_query(F.data == "get_out_of_gym")
async def leave_from_gym(query: CallbackQuery, character: Character):
    await GymCharacterManager.remove_gym_task(character.id)
    await query.message.answer("Ви вийшли з тренування")
