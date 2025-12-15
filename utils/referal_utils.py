import traceback

from database.models.user_bot import UserBot
from loader import bot
from services.user_service import UserService
from webapp.fastapi.publisher import make_payload, publish_event


async def reward_referal(user: UserBot):
    if not user.referal_user_id:
        return
    try:
        text = (f"🎉 <b>У вас з'явився новий реферал!</b>\n\n{user.link_to_user} \n"
                f"Ви отрумуєте +300 монет та +300 енергії! ")
        text_webapp = (f"🎉 <b>У вас з'явився новий реферал!</b>"
                f"Ви отрумуєте +300 монет та +300 енергії! ")
        await bot.send_message(
            chat_id=user.referal_user_id,
            text=text)
        event_payload = make_payload(
            event_type="show_alert",
            user_id=int(user.referal_user_id),
            payload={
                "message": text_webapp,
            }
        )

        # Публікуємо подію в Redis
        await publish_event(event_payload)
        await UserService.add_money_user(int(user.referal_user_id), 300)
        await UserService.add_energy_user(int(user.referal_user_id), 300)
    except Exception as e:
        print(f"err ref: {e}")
        traceback.print_exc()