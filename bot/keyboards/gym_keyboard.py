from datetime import timedelta

from aiogram.utils.keyboard import InlineKeyboardBuilder

from ..callbacks.gym_calbacks import SelectTimeGym, SelectCountDonateEnergy

count_energys = [5, 10, 20, 50, 70]


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

def back_to_education_task_service():
    return (
        InlineKeyboardBuilder()
        .button(text="⬅ Назад", callback_data="get_tasks_education_center")
        .adjust(1)
        .as_markup()
    )

