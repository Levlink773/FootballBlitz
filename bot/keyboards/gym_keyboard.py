from datetime import timedelta

from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder
from ..callbacks.gym_calbacks import SelectTimeGym, SelectCountDonateEnergy
from ..callbacks.massage_room_callbacks import SelectCountGetEnergy

from .utils_keyboard import menu_plosha

from constants import CONST_PRICE_ENERGY

count_energys = [5, 10, 20, 50, 70]


def menu_gym():
    return (ReplyKeyboardBuilder()
            .button(text="🖲 Тренування")

            .attach(menu_plosha())
            .adjust(2, 1)
            .as_markup(resize_keyboard=True)
            )


def select_time_to_gym():
    return (InlineKeyboardBuilder()
            .button(text="🕑 30 хвилин", callback_data=SelectTimeGym(gym_time=timedelta(minutes=30)))
            .button(text="🕒 60 хвилин", callback_data=SelectTimeGym(gym_time=timedelta(minutes=60)))
            .button(text="🕓 90 хвилин", callback_data=SelectTimeGym(gym_time=timedelta(minutes=90)))
            .button(text="🕔 120 хвилин", callback_data=SelectTimeGym(gym_time=timedelta(minutes=120)))
            .adjust(2, 2)
            .as_markup()
            )


def select_donate_energy_keyboard(club_id: int):
    keyboard = InlineKeyboardBuilder()
    for count_energy in count_energys:
        keyboard.button(text=f"Пожертвувати [{count_energy}] 🔋",
                        callback_data=SelectCountDonateEnergy(
                            count_energy=count_energy,
                            club_id=club_id
                        ))
    return keyboard.adjust(1).as_markup()


def no_energy_keyboard():
    return (
        InlineKeyboardBuilder()
        .button(
            text="🔋 Крамниця енергії",
            callback_data="massage_room"
        )
        .as_markup()
    )


def menu_education_cernter():
    return (
        InlineKeyboardBuilder()
        .button(text="🏆 Забрати нагороду з навчального центру", callback_data="get_rewards_education_center")
        .button(text="🏅 Завдання навчального центру", callback_data="get_tasks_education_center")
        .adjust(1)
        .as_markup()
    )


def menu_massage_room():
    keyboard = InlineKeyboardBuilder()
    for count_energy, _ in CONST_PRICE_ENERGY.items():
        keyboard.button(text=f"Купить [{count_energy}] 🔋",
                        callback_data=SelectCountGetEnergy(count_energy=count_energy))
    return keyboard.adjust(1).as_markup()


def send_payment_keyboard(payment_url: str):
    return (InlineKeyboardBuilder()
            .button(text="Сплатити 💵", url=payment_url)
            .as_markup()
            )


def alert_leave_from_gym():
    return (
        InlineKeyboardBuilder()
        .button(text="Вийти з тренування?", callback_data="get_out_of_gym")
        .as_markup()
    )


def leave_from_gym_keyboard():
    return (
        InlineKeyboardBuilder()
        .button(text="Точно вийти", callback_data="leave_gym")
        .as_markup()
    )
