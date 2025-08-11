import traceback

from aiogram import Router
from aiogram.types import CallbackQuery

from blitz.exception import BlitzCloseError, BlitzDoesNotExistError, MaxUsersInBlitzError, \
    UserNotEnoughEnergyError, UserExistsInBlitzError
from blitz.services.blitz_service import BlitzService
from bot.callbacks.blitz_callback import BlitzRegisterCallback
from database.models.user_bot import UserBot
from logging_config import logger
from services.user_service import UserService

blitz_register_router = Router()

@blitz_register_router.callback_query(BlitzRegisterCallback.filter())
async def blitz_register_filter(query: CallbackQuery,
                                callback_data: BlitzRegisterCallback,
                                user: UserBot,
                                ):
    try:
        if user.energy < callback_data.registration_cost:
            raise UserNotEnoughEnergyError(f"Not enough energy {user.energy} < {callback_data.registration_cost}")
        await BlitzService.add_users_to_blitz(callback_data.blitz_id, user, callback_data.max_characters)
        await UserService.consume_energy(user.user_id, callback_data.registration_cost)
        text = "🎉 Ви успішно зареєструвалися на бліц-турнір! Очікуйте на початок та готуйтеся до боротьби ⚽️"
        await query.answer(
            text,
            show_alert=True,
        )
        await query.message.delete()
        await query.message.answer(text)
    except BlitzCloseError as e:
        text = "⌛️ Реєстрацію на бліц-турнір закрито. Чекайте завтра для наступної битви!"
        logger.warning(f"msg: {e}")
        await query.answer(text, show_alert=True)
        await query.message.delete()
    except UserExistsInBlitzError as e:
        logger.warning(f"msg: {e}")
        text = "🔔 Ви вже зареєстровані на цей бліц-турнір. Чекайте початку турніру!"
        await query.answer(text, show_alert=True)
        await query.message.delete()
        await query.message.answer(text)
    except MaxUsersInBlitzError as e:
        logger.warning(f"msg: {e}")
        text = (
            "❌ Реєстрація завершена — кількість учасників у бліц-турнірі вже досягла максимуму. \n\n"
            "📌 Слідкуйте за анонсами — новий турнір буде вже скоро дивіться розписання ⚽️"
        )
        await query.answer(text, show_alert=True)
        await query.message.delete()
        await query.message.answer(text)
    except UserNotEnoughEnergyError as e:
        logger.warning(f"msg: {e}")
        await query.answer(
            f"У вас не достаточно енергии!!!!",
            show_alert=True,
        )
    except BlitzDoesNotExistError as e:
        logger.warning(f"msg: {e}")
        await query.answer(
            f"❓ Турнір з id {callback_data.blitz_id} не знайдено. Перевірте, будь ласка, коректність даних.",
            show_alert=True,
        )
        await query.message.delete()
    except Exception as e:
        traceback.print_exc()
        logger.error(f"msg: {e}")
        await query.answer(
            "⚠️ Упс! Сталася помилка при реєстрації на бліц-турнір. Спробуйте ще раз або зверніться до підтримки.",
            show_alert=True,
        )
        await query.message.delete()
