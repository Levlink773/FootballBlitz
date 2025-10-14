import asyncio

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, InputMediaPhoto

from datetime import datetime

from bot.keyboards.gym_keyboard import menu_education_cernter

from constants import GET_RANDOM_NUMBER, DELTA_TIME_EDUCATION_REWARD, EDUCATION_CENTER
from constants import X2_REWARD_WEEKEND_START_DAY, X2_REWARD_WEEKEND_END_DAY

from database.models.character import Character
from database.models.user_bot import UserBot

from services.character_service import CharacterService
from services.user_service import UserService
from utils.club_utils import get_text_education_center_reward

education_center_router = Router()
EDUCATION_TEXT = "Ласкаво просимо до навчального центру\nТут Ви можете отримати досвід задля покращення рівня гравця, та отримати монети за вдале навчання, кожні 12 годин! "


@education_center_router.message(
    F.text.regexp(r"(✅\s*)?🧠 Учбовий центр(\s*✅)?")
)
async def go_to_gym(message: Message):
    await message.answer_photo(photo=EDUCATION_CENTER,
                               caption=EDUCATION_TEXT,
                               reply_markup=menu_education_cernter(message.from_user.id)
                               )


@education_center_router.callback_query(
    F.data == "get_education_center",
)
async def go_to_gym(query: CallbackQuery):
    try:
        await query.message.edit_media(
            media=InputMediaPhoto(media=EDUCATION_CENTER, caption=EDUCATION_TEXT),
            reply_markup=menu_education_cernter(query.from_user.id)
        )
    except Exception as e:
        await query.message.answer_photo(
            photo=EDUCATION_CENTER,
            caption=EDUCATION_TEXT,
            reply_markup=menu_education_cernter(query.from_user.id)
        )


locks_by_user_id: dict[int, asyncio.Lock] = {}


@education_center_router.callback_query(F.data == "get_rewards_education_center")
async def get_rewards_education_cernter(query: CallbackQuery, user: UserBot, character: Character):
    lock = locks_by_user_id.setdefault(user.user_id, asyncio.Lock())
    if lock.locked():
        return await query.message.answer("<b>⏳ Обробка нагороди вже триває. Зачекайте...</b>")
    async with lock:
        if not datetime.now() > character.reminder.education_reward_date:
            time_to_get_reward = character.reminder.education_reward_date - datetime.now()
            hours, remainder = divmod(time_to_get_reward.seconds, 3600)
            minutes, _ = divmod(remainder, 60)
            return await query.message.answer(f"<b>Залишилося часу до отримання нагороди: {hours} год {minutes} хв</b>")

        coins, energy = await calculation_bonus(user)

        await UserService.add_energy_user(
            user_id=user.user_id,
            amount_energy_add=energy
        )

        await CharacterService.update_character_education_time(
            character=character,
            amount_add_time=DELTA_TIME_EDUCATION_REWARD
        )

        await UserService.add_money_user(
            user_id=user.user_id,
            amount_money_add=coins
        )

        # scheduler_reward_education = EducationRewardReminderScheduler()
        # await scheduler_reward_education.add_job_remind(
        #     character=character,
        #     time_get_reward=datetime.now() + DELTA_TIME_EDUCATION_REWARD
        # )

        await query.message.answer(
            get_text_education_center_reward(
                coins=coins,
                energy=energy,
                delta_time_education_reward=DELTA_TIME_EDUCATION_REWARD
            )
        )


async def calculation_bonus(user: UserBot) -> tuple[int, int]:
    coins = GET_RANDOM_NUMBER(10, 20)
    energy = GET_RANDOM_NUMBER(20, 50)

    bonus_multiplier = 1
    if X2_REWARD_WEEKEND_START_DAY <= datetime.now().day <= X2_REWARD_WEEKEND_END_DAY or user.vip_pass_is_active:
        bonus_multiplier *= 2

    coins, energy = apply_multiplier((coins, energy), bonus_multiplier)

    return int(coins), int(energy)


def apply_multiplier(rewards: tuple[int, int], multiplier: int) -> tuple[int, int]:
    return tuple(value * multiplier for value in rewards)
