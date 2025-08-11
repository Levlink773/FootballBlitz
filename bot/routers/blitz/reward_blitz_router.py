from aiogram import Router
from aiogram.types import CallbackQuery

from bot.callbacks.blitz_callback import BoxRewardCallback
from bot.routers.stores.box.open_box import OpenBoxService
from database.models.types import TypeBox
from database.models.user_bot import UserBot

reward_blitz_router = Router()
BOX_TYPE = {
    "small": TypeBox.SMALL_BOX,
    "medium": TypeBox.MEDIUM_BOX,
    "large": TypeBox.LARGE_BOX,
}
@reward_blitz_router.callback_query(BoxRewardCallback.filter())
async def reward_blitz_medium_box(
        query: CallbackQuery,
        callback_data: BoxRewardCallback,
        user: UserBot,
):
    await query.message.delete()
    box_type = BOX_TYPE.get(callback_data.box_type, TypeBox.MEDIUM_BOX)
    open_box = OpenBoxService(
        type_box=box_type,
        user=user,
        bot=query.bot
    )
    await open_box.open_box()