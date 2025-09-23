import traceback

from aiogram import Router
from aiogram.types import CallbackQuery

from blitz.exception import BlitzCloseError, BlitzDoesNotExistError, MaxUsersInBlitzError, \
    UserNotEnoughEnergyError, UserExistsInBlitzError, UserForbiddenError
from blitz.services.blitz_service import BlitzService
from bot.callbacks.blitz_callback import BlitzRegisterCallback
from database.models.user_bot import UserBot
from logging_config import logger
from services.user_service import UserService
from webapp.fastapi.publisher import make_payloads_for_users, publish_batch

blitz_register_router = Router()


@blitz_register_router.callback_query(BlitzRegisterCallback.filter())
async def blitz_register_filter(query: CallbackQuery,
                                callback_data: BlitzRegisterCallback,
                                user: UserBot,
                                ):
    try:
        if (not user.main_character) or (not user.characters):
            await query.answer("У вас немає головного персонажа!")
            return
        if user.energy < callback_data.registration_cost:
            raise UserNotEnoughEnergyError(f"Not enough energy {user.energy} < {callback_data.registration_cost}")
        await BlitzService.add_users_to_blitz(callback_data.blitz_id, user, callback_data.max_characters)
        await UserService.consume_energy(user.user_id, callback_data.registration_cost)
        users = await BlitzService.get_users_from_blitz_users(callback_data.blitz_id)
        payloads = make_payloads_for_users(
            "update_max_participants",
            users,
            payload_factory=lambda u: {
                "max_participants": len(users),
            }
        )

        # 2а) Лучший вариант — отправить пакетами через pipeline
        await publish_batch(payloads, batch_size=32)
        text = "🎉 Ви успішно зареєструвалися на бліц-турнір! Очікуйте на початок та готуйтеся до боротьби ⚽️"
        await query.answer(
            text,
            show_alert=True,
        )
        if not callback_data.is_scheduler:
            await query.message.delete()
        else:
            await query.message.delete_reply_markup()
        await query.message.answer(text)
        await query.message.answer(f'''
"⚡ З вашого балансу знято <b>{callback_data.registration_cost} енергії</b> "
"за участь! 🚀 Успіхів у грі — нехай ваша команда покаже максимум на полі! 🏆"
        ''')
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
            "⚡ У вас недостатньо енергії!\nПоповніть запас, щоб продовжити гру 💪",
            show_alert=True,
        )
    except UserForbiddenError as e:
        logger.warning(f"msg: {e}")
        await query.answer(
            "🔒 Цей бліц відкритий тільки для 💎 VIP-гравців!",
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
