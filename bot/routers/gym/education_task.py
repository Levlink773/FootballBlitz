from aiogram import Router, F
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, InputMediaPhoto, FSInputFile
from typing import Tuple

from aiogram.utils.keyboard import InlineKeyboardBuilder

from constants import EDUCATION_TASK
from database.models.character import Character
from database.models.user_bot import UserBot
from services.user_service import UserService
from stats.stat import stat, stat_done_already, BaseStatistics

education_task_router = Router()

def _build_tasks_message_and_kb(user: UserBot) -> Tuple[str, InlineKeyboardMarkup]:
    kb = InlineKeyboardBuilder()
    btns = []

    not_done_lines = []
    done_with_reward_lines = []
    done_without_reward_lines = []

    for st_type, stat_cls in stat.items():
        stat_instance: BaseStatistics = stat_cls(user)
        done, progress = stat_instance.statistics_result()
        user_completed_types = {s.stat_type for s in user.statistics}
        already_recorded = st_type in user_completed_types

        if not done:
            not_done_lines.append(
                f"🔸 <b>{stat_instance.description()}</b>\n{stat_instance.describe()}\n"
            )
        else:
            if already_recorded:
                text = stat_done_already.get(st_type, f"Ви отримали нагороду за {stat_instance.description()}.")
                done_with_reward_lines.append(
                    f"✅ <b>{stat_instance.description()}</b>\n{text}\n"
                )
            else:
                success_text = stat_instance.describe_statistics_success()
                done_without_reward_lines.append(
                    f"🎉 <b>{stat_instance.description()}</b>\n{success_text}\n"
                )
                btns.append(InlineKeyboardButton(
                    text=stat_instance.text_get_button(),
                    callback_data=f"claim_stat:{st_type.value}"
                ))
    lines = []
    if not_done_lines:
        lines.append("⏳ <b>Завдання в процесі</b>\n" + "\n".join(not_done_lines))
    if done_with_reward_lines:
        lines.append("✅ <b>Виконані завдання</b>\n" + "\n".join(done_with_reward_lines))
    if done_without_reward_lines:
        lines.append("🎁 <b>Готові до отримання нагороди</b>\n" + "\n".join(done_without_reward_lines))
    if btns:
        kb.row(*btns, width=1)
    kb.button(text="⬅ Назад", callback_data="get_education_center")

    header = "<b>Завдання в освітньому центрі</b>\n\n"
    footer = "\n\n<b>Порада:</b> натисніть кнопку «Отримати», якщо виконали завдання."
    body = "\n\n".join(lines) if lines else "Немає доступних завдань."

    return header + body + footer, kb.as_markup()



@education_task_router.callback_query(F.data == "get_tasks_education_center")
async def get_tasks_education_cernter(query: CallbackQuery, user: UserBot):
    """
    Показываем все задания, их статусы и кнопки для получения наград (если есть).
    """
    await query.answer()  # скрываем 'крутилку' у клиента
    text, kb = _build_tasks_message_and_kb(user)
    try:
        await query.message.edit_media(
            media=InputMediaPhoto(media=EDUCATION_TASK, caption=text),
            reply_markup=kb
        )
    except Exception:
        await query.message.answer_photo(photo=EDUCATION_TASK, caption=text, reply_markup=kb)


@education_task_router.callback_query(F.data.startswith("claim_stat:"))
async def claim_stat_callback(query: CallbackQuery, user: UserBot, character: Character):
    """
    Обработка нажатия на кнопку "Отримати" — выдаём награду и помечаем статистику.
    callback_data expected: "claim_stat:<STAT_VALUE>"
    """
    await query.answer()

    payload = query.data.split("claim_stat:", 1)
    if len(payload) < 2 or not payload[1]:
        await query.message.answer("Невірні дані заявки.")
        return

    stat_value = payload[1]
    target_type = None
    for st_type in stat.keys():
        if st_type.value == stat_value:
            target_type = st_type
            break

    if target_type is None:
        await query.message.answer("Невідома статистика.")
        return

    stats_cls = stat[target_type]
    stats_instance = stats_cls(user)

    done, progress = stats_instance.statistics_result()
    user_completed_types = {s.stat_type for s in user.statistics}
    already_recorded = target_type in user_completed_types

    if not done:
        await query.message.answer("Ви ще не виконали цю задачу.")
        return

    if already_recorded:
        await query.message.answer("Нагорода вже була отримана раніше.")
        return
    try:
        await stats_instance.reward_stat()
    except Exception as e:
        await query.message.answer(f"Помилка при видачі нагороди: {e}")
        return

    user = await UserService.get_user(user_id=user.user_id)

    text, kb = _build_tasks_message_and_kb(user)
    try:
        await query.message.edit_text(text, reply_markup=kb, parse_mode="HTML")
    except Exception:
        await query.message.answer("Нагороду видано!")
    await query.message.answer("Нагорода успішно отримана 🎉")
