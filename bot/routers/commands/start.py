from aiogram import F
from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.types import Message, FSInputFile

from bot.keyboards.menu_keyboard import main_menu
from bot.routers.register_user.config import TEXT_STAGE_REGISTER_USER, PHOTO_STAGE_REGISTER_USER
from bot.routers.register_user.keyboard.get_character import get_first_character_keyboard
from bot.routers.register_user.keyboard.register_user import create_team
from bot.routers.register_user.start_register_user import StartRegisterUser
from bot.routers.register_user.state.register_user_state import RegisterUserState
from config import VIDEO_ID
from constants import PLOSHA_PEREMOGU
from database.models.user_bot import UserBot, STATUS_USER_REGISTER
from logging_config import logger

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
            await message.answer_photo(
                caption=TEXT_STAGE_REGISTER_USER[STATUS_USER_REGISTER.CREATE_TEAM],
                photo=PHOTO_STAGE_REGISTER_USER[STATUS_USER_REGISTER.CREATE_TEAM],
                keyboard=create_team()
            )
        if user.status_register == STATUS_USER_REGISTER.SEND_NAME_TEAM:
            await message.answer_photo(
                caption=TEXT_STAGE_REGISTER_USER[STATUS_USER_REGISTER.SEND_NAME_TEAM],
                photo=PHOTO_STAGE_REGISTER_USER[STATUS_USER_REGISTER.SEND_NAME_TEAM],
            )
            await state.set_state(RegisterUserState.send_team_name)
        if user.status_register == STATUS_USER_REGISTER.GET_FIRST_CHARACTER:
            await message.answer_photo(
                caption=TEXT_STAGE_REGISTER_USER[STATUS_USER_REGISTER.GET_FIRST_CHARACTER],
                photo=PHOTO_STAGE_REGISTER_USER[STATUS_USER_REGISTER.GET_FIRST_CHARACTER],
                reply_markup=get_first_character_keyboard()
            )

    video_start = FSInputFile(r"src/start_video.MP4", filename="video_start") if not VIDEO_ID else VIDEO_ID

    await state.clear()
    bot_name = await message.bot.get_my_name()
    text = f"""
<b>Вітаємо у «{bot_name.name} — життя футболіста онлайн-гра!»</b> ⚽️✨
Найкращий симулятор кар'єри футболіста! Тут ви зможете пройти шлях від молодого таланта до легенди світового футболу.

<b>Розвивайте свої навички 🏋️‍♂️</b>
Прокачуйте персонажа, приєднуйтесь до команд та інших гравців. Беріть участь у великих турнірах і ведіть свою команду до перемоги 🏆!

<b>Ваші рішення на полі та за його межами</b> 🏅
Вони визначать долю вашої кар'єри. Кожен вибір, кожен матч — це крок до футбольної величі.

<b>Готові стати новою зіркою футболу? 🌟</b>
Час почати свою подорож до слави!

🔽<b>НАТИСКАЙ КНОПКУ СТВОРИТИ КОМАНДУ</b>🔽
    """

    msg = await message.answer_video(
        video=video_start,
        caption=text,
        reply_markup=main_menu(user)
    )
    logger.info(f"START_COMMAND FILE ID: {msg.video.file_id}")
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
