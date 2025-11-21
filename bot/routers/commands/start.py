import traceback

from aiogram import F
from aiogram import Router
from aiogram.filters import CommandStart, Command
from aiogram.fsm.context import FSMContext
from aiogram.types import Message, FSInputFile, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

from bot.callbacks.blitz_callback import BoxRewardCallback
from bot.keyboards.menu_keyboard import main_menu
from bot.routers.register_user.config import TEXT_STAGE_REGISTER_USER, PHOTO_STAGE_REGISTER_USER
from bot.routers.register_user.keyboard.get_character import get_first_character_keyboard
from bot.routers.register_user.keyboard.register_user import create_team
from bot.routers.register_user.start_register_user import StartRegisterUser
from bot.routers.register_user.state.register_user_state import RegisterUserState
from constants import PLOSHA_PEREMOGU
from database.models.user_bot import UserBot, STATUS_USER_REGISTER
from loader import bot
from logging_config import logger
from services.user_service import UserService
from webapp.fastapi.publisher import make_payload, publish_event

start_router = Router()

async def register_referal(user: UserBot, referal: str):
    if not "ref_" in referal:
        return
    referal_user_id = referal.split("ref_")[1]
    await UserService.add_referal_user_id(
        my_user_id=user.user_id,
        referal_user_id=int(referal_user_id)
    )
    try:
        text = (f"🎉 <b>У вас з'явився новий реферал!</b>\n\n{user.link_to_user} \n"
                f"Ви отрумуєте +300 монет та +300 енергії! ")
        text_webapp = (f"🎉 <b>У вас з'явився новий реферал!</b>"
                f"Ви отрумуєте +300 монет та +300 енергії! ")
        await bot.send_message(
            chat_id=referal_user_id,
            text=text)
        event_payload = make_payload(
            event_type="show_alert",
            user_id=int(referal_user_id),
            payload={
                "message": text_webapp,
            }
        )

        # Публікуємо подію в Redis
        await publish_event(event_payload)
        await UserService.add_money_user(int(referal_user_id), 300)
        await UserService.add_energy_user(int(referal_user_id), 300)
    except Exception as e:
        print(f"err ref: {e}")
        traceback.print_exc()

@start_router.message(CommandStart())
async def start_command_handler(
        message: Message,
        state: FSMContext,
        user: UserBot,
        command: Command,
):
    if command.args:
        await register_referal(user=user, referal=command.args)
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
                #    keyboard=create_team()
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
        reply_markup=main_menu(user),
    )
    await message.answer("Натискай кнопку <b>Open</b> або кнопку нижче зоб увійти в повноцінний додаток 🔥", reply_markup=InlineKeyboardMarkup(
            inline_keyboard=[
                [
                    InlineKeyboardButton(
                        text="⚽ Увійти у WebApp",
                        web_app=WebAppInfo(
                            url=f"https://football-blitz.online/?user_id={user.user_id}")
                    )
                ]
            ]
        ))
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


@start_router.message(Command("free_box"))
async def start(message: Message, user: UserBot):
    _, box_type = message.text.split(" ")
    if box_type == "small":
        await UserService.add_count_of_small_box(user.user_id, 1)
    elif box_type == "medium":
        await UserService.add_count_of_medium_box(user.user_id, 1)
    elif box_type == "large":
        await UserService.add_count_of_big_box(user.user_id, 1)
    markup = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="Відкрити 🗝️", callback_data=BoxRewardCallback(box_type=box_type).pack())]
    ])
    await message.answer(f"BOX {box_type}: ", reply_markup=markup)
