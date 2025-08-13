import asyncio

from aiogram import Bot

from bot.boxes.base_box import Box
from bot.boxes.base_item import Energy, Exp, Money
from bot.boxes.base_open import OpenBox
from constants import lootboxes
from database.models.types import TypeBox
from database.models.user_bot import UserBot
from services.user_service import UserService


def create_boxes(lootbox_data: TypeBox) -> list[Box]:
    info_lootbox = lootboxes.get(lootbox_data, None)

    energy = Box(
        items=[Energy(min=info_lootbox["min_energy"], max=info_lootbox["max_energy"])]
    )

    money = Box(
        items=[Money(min=info_lootbox["min_money"], max=info_lootbox["max_money"])]
    )
    return energy, money


class OpenBoxService:
    def __init__(
            self,
            type_box: TypeBox,
            user: UserBot,
            bot: Bot
    ) -> None:
        self.type_box = type_box
        self.box_energy, self.box_money = create_boxes(type_box)
        self.user = user
        self.bot = bot

    def get_frame_text(self):
        self.open_box_energy = OpenBox(items=self.box_energy.winner_items)
        self.open_box_money = OpenBox(items=self.box_money.winner_items)

        frame_gen_energy = self.open_box_energy.get_next_frame()
        frame_gen_money = self.open_box_money.get_next_frame()

        while True:
            try:
                frame_energy = next(frame_gen_energy).split("\n")[0]
                frame_money = next(frame_gen_money)
                combined_frame = f"{frame_energy}\n{frame_money}"
                yield combined_frame
            except StopIteration:
                break

    async def open_box(self):
        message = await self.bot.send_message(
            chat_id=self.user.user_id,
            text="Відкриваю лутбокс..."
        )
        await asyncio.sleep(3)

        for num, frame in enumerate(self.get_frame_text()):
            if num % 2 == 0:
                await message.edit_text(
                    text=frame
                )
                await asyncio.sleep(0.35)
        await self._distribute_reward()

    async def _distribute_reward(self):
        await UserService.add_money_user(
            user_id=self.user.user_id,
            amount_money_add=self.open_box_money.winner_item.count_item
        )
        await UserService.add_energy_user(
            user_id=self.user.user_id,
            amount_energy_add=self.open_box_energy.winner_item.count_item
        )

        text = """
🔓 <b>Ви відкрили {name_box}</b>

Отримано

⚡ Енергія: {count_energy}
💰 Монети: {count_money}

Вітаємо! 🚀        
        """

        await self.bot.send_message(
            chat_id=self.user.user_id,
            text=text.format(
                name_box=lootboxes[self.type_box]['name_lootbox'],
                count_energy=self.open_box_energy.winner_item.count_item,
                count_money=self.open_box_money.winner_item.count_item
            )
        )
