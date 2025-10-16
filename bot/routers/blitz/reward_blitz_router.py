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

    if box_type == TypeBox.SMALL_BOX:
        count_of_small_box = user.count_of_small_box or 0
        if count_of_small_box <= 0:
            await query.answer(
                "❌ Нажаль, у вас немає 🧩 маленьких лутбоксів для відкриття.\n"
                "🎮 Грайте в турнірах або 🛒 купуйте в магазинах, щоб отримувати бокси для більших переваг!",
                show_alert=True
            )
            return

    elif box_type == TypeBox.MEDIUM_BOX:
        count_of_medium_box = user.count_of_medium_box or 0
        if count_of_medium_box <= 0:
            await query.answer(
                "❌ У вас немає 📦 середніх лутбоксів для відкриття.\n"
                "🔥 Беріть участь у турнірах або 🛍️ загляньте до магазину, щоб здобути нові бокси!",
                show_alert=True
            )
            return

    elif box_type == TypeBox.LARGE_BOX:
        count_of_large_box = user.count_of_big_box or 0
        if count_of_large_box <= 0:
            await query.answer(
                "❌ Поки що немає 🎁 великих лутбоксів для відкриття.\n"
                "⚔️ Грайте активніше або 💰 придбайте бокси, щоб отримати круті нагороди!",
                show_alert=True
            )
            return
    open_box = OpenBoxService(
        type_box=box_type,
        user=user,
        bot=query.bot
    )
    await open_box.open_box()