from abc import ABC, abstractmethod

from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

from blitz.blitz_match.constans import SMALL_BOX_BLITZ_PHOTO, MEDIUM_BOX_BLITZ_PHOTO
from blitz.services.blitz_character_service import BlitzUserService
from blitz.services.message_sender.blitz_sender import send_message
from bot.callbacks.blitz_callback import BoxRewardCallback
from database.models.blitz_team import BlitzTeam
from database.models.user_bot import UserBot
from loader import bot
from services.user_service import UserService
from utils.blitz_photo_utils import get_photo, save_photo_id

BONUS_ENERGY = 50


class RewardBlitzTeam(ABC):

    async def get_blitz_users(self, reward_blitz_team: BlitzTeam) -> list[UserBot]:
        extract_us = BlitzUserService.get_user_from_blitz_user
        return [(await extract_us(blitz_user)) for blitz_user in reward_blitz_team.users]

    async def reward_blitz(self, reward_blitz_team: BlitzTeam):
        users = await self.get_blitz_users(reward_blitz_team)
        for user in users:
            await self.reward_blitz_user(user)

    @abstractmethod
    async def reward_blitz_user(self, user: UserBot):
        raise NotImplementedError


class RewardMediumBoxBlitzTeam(RewardBlitzTeam):

    def box_type(self):
        return "середній", "medium", MEDIUM_BOX_BLITZ_PHOTO

    async def reward_blitz_user(self, user: UserBot):
        name_box, callback_name_box, photo_path = self.box_type()
        callback_data = BoxRewardCallback(box_type=callback_name_box).pack()
        markup = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="Відкрити 🗝️", callback_data=callback_data)]
        ])

        # Новий український, драйвовий текст з HTML-підсвіткою
        is_save, photo = await get_photo(photo_path)
        msg = await bot.send_photo(
            user.user_id,
            photo=photo,
            caption=f"🎁 <b>Увага!</b> Ви отримали <b>{name_box} лутбокс</b> за блиц-турнір! "
                    "Відкрийте його, щоб дізнатися свою нагороду та зарядитися мотивацією! 💥",
            reply_markup=markup,
            parse_mode="HTML"
        )
        # Додаємо +50 енергії всім учасникам команди
        if msg and not is_save:
            await save_photo_id(
                patch_to_photo=photo_path,
                photo_id=msg.photo[0].file_id,
            )


class RewardSmallBoxBlitzTeam(RewardMediumBoxBlitzTeam):

    def box_type(self):
        return "меленький", "small", SMALL_BOX_BLITZ_PHOTO


class RewardLargeBoxBlitzTeam(RewardMediumBoxBlitzTeam):

    def box_type(self):
        return "великий", "large", MEDIUM_BOX_BLITZ_PHOTO


class RewardEnergyBlitzTeam(RewardBlitzTeam):

    def __init__(self, reward_exp: int):
        self.reward_exp = reward_exp

    async def reward_blitz_user(self, user: UserBot):
        # Збільшуємо енергію
        await UserService.add_energy_user(
            user_id=user.user_id,
            amount_energy_add=self.reward_exp,
        )
        # Епічний фініш повідомлення про енергію
        await send_message(
            character=user,
            text=f"⚡ <b>+{self.reward_exp} енергії</b> за участь у блиц-турнірі! Дякуємо, що були з нами — "
                 "поповнюйте запаси та повертайтесь до наступних батлів! 💪",
        )


class RewardMoneyBlitzTeam(RewardBlitzTeam):

    def __init__(self, reward_money: int):
        self.reward_modey = reward_money

    async def reward_blitz_user(self, user: UserBot):
        # Збільшуємо енергію
        await UserService.add_money_user(
            user_id=user.user_id,
            amount_money_add=self.reward_modey,
        )
        # Епічний фініш повідомлення про енергію
        await send_message(
            character=user,
            text=f"⚡ <b>+{self.reward_modey} енергії</b> за участь у блиц-турнірі! Дякуємо, що були з нами — "
                 "поповнюйте запаси та повертайтесь до наступних батлів! 💪",
        )


class BlitzRewardService:
    @staticmethod
    async def reward_blitz_team(reward_blitz_team_executors: list[RewardBlitzTeam], reward_blitz_team: BlitzTeam):
        for reward_blitz_team_exe in reward_blitz_team_executors:
            await reward_blitz_team_exe.reward_blitz(reward_blitz_team)
