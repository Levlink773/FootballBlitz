from aiogram import F
from aiogram import Router
from aiogram.filters import CommandStart, Command
from aiogram.fsm.context import FSMContext
from aiogram.types import Message, FSInputFile

from bot.keyboards.menu_keyboard import main_menu
from bot.routers.register_user.config import TEXT_STAGE_REGISTER_USER, PHOTO_STAGE_REGISTER_USER
from bot.routers.register_user.keyboard.get_character import get_first_character_keyboard
from bot.routers.register_user.keyboard.register_user import create_team
from bot.routers.register_user.start_register_user import StartRegisterUser
from bot.routers.register_user.state.register_user_state import RegisterUserState
from constants import PLOSHA_PEREMOGU
from database.models.user_bot import UserBot, STATUS_USER_REGISTER
from logging_config import logger
from services.user_service import UserService

start_router = Router()


@start_router.message(CommandStart())
async def start_command_handler(
        message: Message,
        state: FSMContext,
        user: UserBot,
):
    if not user.end_register:
        if user.status_register == STATUS_USER_REGISTER.START_REGISTER:
            start_register = StartRegisterUser(
                user=user
            )
            return await start_register.start_register_user()
        if user.status_register == STATUS_USER_REGISTER.CREATE_TEAM:
            return await message.answer_photo(
                caption=TEXT_STAGE_REGISTER_USER[STATUS_USER_REGISTER.CREATE_TEAM],
                photo=PHOTO_STAGE_REGISTER_USER[STATUS_USER_REGISTER.CREATE_TEAM],
                keyboard=create_team()
            )
        if user.status_register == STATUS_USER_REGISTER.SEND_NAME_TEAM:
            await message.answer_photo(
                caption=TEXT_STAGE_REGISTER_USER[STATUS_USER_REGISTER.SEND_NAME_TEAM],
                photo=PHOTO_STAGE_REGISTER_USER[STATUS_USER_REGISTER.SEND_NAME_TEAM],
            )
            return await state.set_state(RegisterUserState.send_team_name)
        if user.status_register == STATUS_USER_REGISTER.GET_FIRST_CHARACTER:
            return await message.answer_photo(
                caption=TEXT_STAGE_REGISTER_USER[STATUS_USER_REGISTER.GET_FIRST_CHARACTER],
                photo=PHOTO_STAGE_REGISTER_USER[STATUS_USER_REGISTER.GET_FIRST_CHARACTER],
                reply_markup=get_first_character_keyboard()
            )

    video_start = FSInputFile(r"src/start_photo.png")

    await state.clear()
    bot_name = await message.bot.get_my_name()
    text = f"""
🔥 Вітаємо у {bot_name.name}! ⚽️
Ти потрапив у світ футболу у Telegram! Стань головним тренером, керуй розвитком гравців, стратегією та перемогами.

Що тебе чекає:

🏟 Створи команду та отримай першого гравця з унікальними характеристиками: сила, талант, вік.

🏋️‍♂️ Тренуй їх, підвищуй силу та вартість — молоді й талановиті ростуть швидше!
🏆 Щоденні блиц-турніри: від VIP до масштабних на 8–64 учасники. Перемога дає рейтинг та нагороди.

💰 Трансферний ринок — купуй, продавай, покращуй склад.

⚡️ Енергія: 200 очок/день на тренування та турніри, додатково заробляй в івентах.

📊 Рейтинг: 1 місце = 3 очки, 2 місце = 2, півфінал = 1.

💡 Починай з «Моя команда», переглядай своїх гравців, прокачуй їх і готуйся до турнірів!
Твоя мета — стати легендою Football Bliz і піднятися на вершину рейтингу! 🌟🥇
    """

    msg = await message.answer_photo(
        photo=video_start,
        caption=text,
        reply_markup=main_menu(user)
    )
    logger.info(f"START_COMMAND FILE ID: {msg.photo[0].file_id}")
    return None


@start_router.message(F.text == "⬅️ Головна площа")
async def plosha(message: Message, user: UserBot):
    await message.answer_photo(photo=PLOSHA_PEREMOGU,
                               caption=f"""
Вітаю тебе на головній площі гри! Місце де ти можеш обрати основні функції:
<b>Стадіон</b> - реєстрація на матч та таблиці
<b>Тренажерний зал</b> - місце прокачки персонажа
<b>Навчальний центр</b> - досвід та заробіток монет.
<b>Тренувальна база</b> - покращення команди перед грою
<b>Магазин</b> - тут можна купити речі задля покращення футболіста.

                            
                               """,
                               reply_markup=main_menu(user))
@start_router.message(Command("energy"))
async def start(message: Message, user: UserBot):
    _, energy = message.text.split(" ")
    if int(energy) > 10000:
        await message.answer("? energy many you want")
        return
    await UserService.add_energy_user(user.user_id, int(energy))
    await message.answer(f"+{energy} to {user.user_name}")