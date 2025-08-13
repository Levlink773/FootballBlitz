from abc import ABC, abstractmethod

from aiogram.types import Message, InputMediaPhoto

from bot.keyboards.gym_keyboard import back_to_education_task_service
from constants import EDUCATION_TASK_REWARD
from database.models.user_bot import UserBot
from services.statistics_service import StatisticsService
from services.user_service import UserService
from stats.stat_enum import StatisticsType


class BaseStatistics(ABC):
    def __init__(self, user: UserBot):
        self.user = user
    @abstractmethod
    def description(self) -> str:
        raise NotImplementedError()

    def describe(self):
        res, progress = self.statistics_result()
        if res:
            return self.describe_statistics_success()
        return self.describe_statistics(progress)

    @abstractmethod
    def describe_statistics(self, result):
        raise NotImplementedError()

    @abstractmethod
    def describe_statistics_success(self):
        raise NotImplementedError()

    @abstractmethod
    def text_get_button(self) -> str:
        raise NotImplementedError()

    @abstractmethod
    def stat_type(self) -> StatisticsType:
        raise NotImplementedError()

    @abstractmethod
    def statistics_result(self) -> tuple[bool, str]:
        raise NotImplementedError()

    @abstractmethod
    def reward_stat(self, message: Message):
        raise NotImplementedError()


class Conduct3TrainingStatistics(BaseStatistics):

    def description(self) -> str:
        return "Проведи 3 тренування — отримай +50⚡ енергії!"

    def describe_statistics(self, result):
        return f"Ви вже провели {result} тренувань! Залишилось ще {3 - result} до мети 🎯"

    def describe_statistics_success(self):
        text_btn = self.text_get_button()
        return f"🔥 Вітаємо, чемпіоне! Ви провели 3 тренування 💪 Натискайте «{text_btn}» та забирайте свою нагороду — +50⚡ енергії!"

    def text_get_button(self):
        return "🎁 Забрати нагороду за 3 тренування"

    def stat_type(self) -> StatisticsType:
        return StatisticsType.CONDUCT_3_TRAINING

    def statistics_result(self) -> tuple[bool]:
        return self.user.count_go_to_gym >= 3, self.user.count_go_to_gym

    async def reward_stat(self, message: Message):
        if not any(s.stat_type == self.stat_type() for s in self.user.statistics):
            await UserService.add_energy_user(self.user.user_id, 50)
            await StatisticsService.save_statistics(self.user.user_id, self.stat_type())
            await message.edit_media(
                media=InputMediaPhoto(media=EDUCATION_TASK_REWARD, caption="🏅 Ви отримали +50⚡ енергії! Час витратити її з користю 😉"),
                reply_markup=back_to_education_task_service(),
            )
            return
        await message.answer(
            chat_id=self.user.user_id,
            text="ℹ️ Ви вже забирали нагороду за це завдання."
        )


class PlayBlitzStatistics(BaseStatistics):

    def description(self) -> str:
        return "Зіграйте турнір — забери +20⚡ енергії!"

    def describe_statistics(self, result):
        return f"Ви зіграли {result} турнірів. Ще трішки до першої перемоги 🏆"

    def describe_statistics_success(self):
        text_btn = self.text_get_button()
        return f"🎉 Чудово! Ви взяли участь у турнірі 🥅 Натискайте «{text_btn}» та отримуйте +20⚡ енергії!"

    def text_get_button(self):
        return "🎁 Забрати нагороду за турнір"

    def stat_type(self) -> StatisticsType:
        return StatisticsType.PLAY_BLITZ

    def statistics_result(self) -> tuple[bool, str]:
        return self.user.count_play_blitz >= 1, self.user.count_play_blitz

    async def reward_stat(self, message: Message):
        if not any(s.stat_type == self.stat_type() for s in self.user.statistics):
            await UserService.add_energy_user(self.user.user_id, 20)
            await StatisticsService.save_statistics(self.user.user_id, self.stat_type())
            await message.edit_media(
                media=InputMediaPhoto(media=EDUCATION_TASK_REWARD, caption="🏅 Ви отримали +20⚡ енергії! Попереду ще більше турнірів 💥"),
                reply_markup=back_to_education_task_service(),
            )
            return
        await message.answer(
            chat_id=self.user.user_id,
            text="ℹ️ Ви вже забирали нагороду за цей турнір."
        )


class RichSemiFinalBlitzStatistics(BaseStatistics):

    def description(self) -> str:
        return "Дійди до півфіналу — отримай +50⚡ енергії!"

    def describe_statistics(self, result):
        return f"Ви вже доходили до півфіналу {result} раз(ів)! Ще трішки до фіналу 🏆"

    def describe_statistics_success(self):
        text_btn = self.text_get_button()
        return f"🚀 Ви пробились до півфіналу! Натискайте «{text_btn}» та забирайте свою заслужену нагороду — +50⚡ енергії!"

    def text_get_button(self):
        return "🎁 Забрати нагороду за півфінал"

    def stat_type(self) -> StatisticsType:
        return StatisticsType.RICH_SEMI_FINAL_BLITZ

    def statistics_result(self) -> tuple[bool, str]:
        return self.user.count_rich_semi_final_blitz >= 1, self.user.count_rich_semi_final_blitz

    async def reward_stat(self, message: Message):
        if not any(s.stat_type == self.stat_type() for s in self.user.statistics):
            await UserService.add_energy_user(self.user.user_id, 50)
            await StatisticsService.save_statistics(self.user.user_id, self.stat_type())
            await message.edit_media(
                media=InputMediaPhoto(media=EDUCATION_TASK_REWARD, caption="🏅 Ви отримали +50⚡ енергії! Наступна зупинка — фінал 🏟️"),
                reply_markup=back_to_education_task_service()
            )
            return
        await message.answer(
            chat_id=self.user.user_id,
            text="ℹ️ Ви вже забирали нагороду за півфінал."
        )


stat = {
    StatisticsType.CONDUCT_3_TRAINING: Conduct3TrainingStatistics,
    StatisticsType.PLAY_BLITZ: PlayBlitzStatistics,
    StatisticsType.RICH_SEMI_FINAL_BLITZ: RichSemiFinalBlitzStatistics,
}

stat_done_already = {
    StatisticsType.CONDUCT_3_TRAINING: "🔥 Ви успішно провели 3 тренування та отримали +50⚡ енергії! Час використати її з користю 💪",
    StatisticsType.PLAY_BLITZ: "🎉 Ви зіграли турнір та отримали +20⚡ енергії! Продовжуйте у тому ж дусі ⚽",
    StatisticsType.RICH_SEMI_FINAL_BLITZ: "🚀 Ви дійшли до півфіналу та отримали +50⚡ енергії! Фінал уже близько 🏆",
}

