# routers/education_router.py
from __future__ import annotations
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from logging_config import logger
from services.statistics_service import StatisticsService

# Подправь пути импорта под свою структуру если нужно
from services.user_service import UserService
from services.character_service import CharacterService

# Взять stat mapping и BaseStatistics из вашего кода
from stats.stat import stat  # dict: StatisticsType -> class
from stats.stat import BaseStatistics  # тип для аннотации

# Константы и утилиты (как в aiogram-хендлере)
from constants import (
    GET_RANDOM_NUMBER,
    DELTA_TIME_EDUCATION_REWARD,
    X2_REWARD_WEEKEND_START_DAY,
    X2_REWARD_WEEKEND_END_DAY,
)
from stats.stat_enum import StatisticsType

router = APIRouter(prefix="/education", tags=["education"])

# Locks to avoid concurrent claims for the same user
_locks_by_user_id: Dict[int, asyncio.Lock] = {}

# --- Pydantic models for responses ---
class RemainingResponse(BaseModel):
    user_id: int
    ready: bool
    seconds_remaining: int
    message: str


class ClaimRequest(BaseModel):
    user_id: int


class ClaimResponse(BaseModel):
    ok: bool
    user_id: int
    coins: Optional[int] = None
    energy: Optional[int] = None
    seconds_remaining: Optional[int] = None
    message: str


class TaskInfo(BaseModel):
    stat_type: str
    description: str
    status: str  # "in_progress" | "done_and_claimed" | "done_and_ready"
    progress: Optional[str] = None
    progress_raw: Optional[Any] = None  # raw numeric progress if available
    extra: Optional[dict] = None


class TasksResponse(BaseModel):
    user_id: int
    tasks: List[TaskInfo]


# --- Helper functions: replicate aiogram logic for rewards ---
def apply_multiplier(rewards: Tuple[int, int], multiplier: int) -> Tuple[int, int]:
    return tuple(int(value * multiplier) for value in rewards)


async def calculation_bonus(user) -> Tuple[int, int]:
    """Return (coins, energy) following the same logic as aiogram handler."""
    coins = GET_RANDOM_NUMBER(10, 20)
    energy = GET_RANDOM_NUMBER(20, 50)

    bonus_multiplier = 1
    # weekend check using day number OR VIP active
    if X2_REWARD_WEEKEND_START_DAY <= datetime.now().day <= X2_REWARD_WEEKEND_END_DAY or getattr(user, "vip_pass_is_active", False):
        bonus_multiplier *= 2

    coins, energy = apply_multiplier((coins, energy), bonus_multiplier)
    return int(coins), int(energy)


def _human_time_from_seconds(seconds: int) -> str:
    if seconds <= 0:
        return "Доступно сейчас"
    minutes, sec = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    return f"{hours} год {minutes} хв"


# --- Endpoints ---
@router.get("/remaining/{user_id}", response_model=RemainingResponse)
async def get_remaining(user_id: int):
    """
    Возвращает, сколько секунд осталось до получения награды у главного персонажа пользователя.
    """
    user = await UserService.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не знайдений")

    main_char = getattr(user, "main_character", None)
    if not main_char:
        return RemainingResponse(
            user_id=user_id,
            ready=False,
            seconds_remaining=0,
            message="У вас немає основного футболіста"
        )

    reminder = getattr(main_char, "reminder", None)
    if not reminder or not reminder.education_reward_date:
        # Если reminder нет — значит можно получить награду прямо сейчас (или нужно создать remind)
        return RemainingResponse(
            user_id=user_id,
            ready=True,
            seconds_remaining=0,
            message="Нагорода доступна"
        )

    now = datetime.now()
    if now >= reminder.education_reward_date:
        return RemainingResponse(
            user_id=user_id,
            ready=True,
            seconds_remaining=0,
            message="Нагорода доступна"
        )

    remaining_td = reminder.education_reward_date - now
    seconds_remaining = int(remaining_td.total_seconds())
    return RemainingResponse(
        user_id=user_id,
        ready=False,
        seconds_remaining=seconds_remaining,
        message=f"Залишилося: {_human_time_from_seconds(seconds_remaining)}"
    )


@router.post("/claim", response_model=ClaimResponse)
async def claim_reward(body: ClaimRequest):
    """
    Попытка выдать награду пользователю (главному персонажу).
    Если ещё рано — возвращает сколько осталось.
    """
    user_id = body.user_id

    # ensure lock exists
    lock = _locks_by_user_id.setdefault(user_id, asyncio.Lock())

    if lock.locked():
        return ClaimResponse(ok=False, user_id=user_id, message="Обробка нагороди вже триває, зачекайте...")

    async with lock:
        user = await UserService.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не знайдений")

        main_char = getattr(user, "main_character", None)
        if not main_char:
            return ClaimResponse(ok=False, user_id=user_id, message="У вас поки що немає основного футболіста", seconds_remaining=0)

        reminder = getattr(main_char, "reminder", None)
        if not reminder or not reminder.education_reward_date:
            # no reminder — allow immediate reward (match aiogram behavior)
            # proceed to give reward
            pass

        now = datetime.now()
        if reminder and reminder.education_reward_date and now < reminder.education_reward_date:
            remaining = int((reminder.education_reward_date - now).total_seconds())
            return ClaimResponse(ok=False, user_id=user_id, seconds_remaining=remaining, message=f"Залишилося: {_human_time_from_seconds(remaining)}")

        # calculate reward
        try:
            coins, energy = await calculation_bonus(user)

            # add energy
            await UserService.add_energy_user(user_id=user.user_id, amount_energy_add=energy)

            # extend next reward time (same as aiogram)
            await CharacterService.update_character_education_time(character=main_char, amount_add_time=DELTA_TIME_EDUCATION_REWARD)

            # add money
            await UserService.add_money_user(user_id=user.user_id, amount_money_add=coins)

            # Optionally — you might want to save statistics etc. (not implemented here,
            # because in your aiogram code stat update is done elsewhere).
        except Exception as e:
            logger.exception("Error while claiming education reward for user %s: %s", user_id, e)
            raise HTTPException(status_code=500, detail="Помилка при видачі нагороди")

        # compute seconds until next reward
        new_reminder = getattr(main_char, "reminder", None)
        if new_reminder and getattr(new_reminder, "education_reward_date", None):
            seconds_remaining = max(0, int((new_reminder.education_reward_date - datetime.now()).total_seconds()))
        else:
            seconds_remaining = int(DELTA_TIME_EDUCATION_REWARD.total_seconds())

        return ClaimResponse(
            ok=True,
            user_id=user.user_id,
            coins=coins,
            energy=energy,
            seconds_remaining=seconds_remaining,
            message=f"Нагорода видана: {coins} монет, {energy} енергії. Наступна нагорода через {_human_time_from_seconds(seconds_remaining)}"
        )


@router.get("/tasks/{user_id}", response_model=TasksResponse)
async def get_tasks(user_id: int):
    """
    Возвращает список заданий пользователя и их статусы:
      - in_progress
      - done_and_claimed
      - done_and_ready
    """
    user = await UserService.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не знайдений")

    tasks: List[TaskInfo] = []

    # set of recorded stat types for quicker lookup
    user_recorded_types = {s.stat_type for s in getattr(user, "statistics", [])}

    # Iterate over stat mapping from your stats.stat module
    # stat: dict[StatisticsType, class]
    for st_type, stat_cls in stat.items():
        try:
            stat_instance: BaseStatistics = stat_cls(user)  # construct as in aiogram code
            done, progress = stat_instance.statistics_result()
        except Exception as e:
            logger.exception("Error evaluating stat %s for user %s: %s", st_type, user_id, e)
            # skip problematic stat but continue
            continue

        already_recorded = st_type in user_recorded_types

        if not done:
            status_str = "in_progress"
        else:
            if already_recorded:
                status_str = "done_and_claimed"
            else:
                status_str = "done_and_ready"

        # try to get user-friendly progress and raw progress if available
        progress_text = None
        progress_raw = None
        try:
            # .describe may return user-friendly text; .describe_statistics_success may be used for reward description
            progress_text = stat_instance.describe() if hasattr(stat_instance, "describe") else None
            if hasattr(stat_instance, "statistics_result"):
                # progress returned above; keep it raw too
                progress_raw = progress
        except Exception:
            progress_text = None

        info = TaskInfo(
            stat_type=st_type.value if hasattr(st_type, "value") else str(st_type),
            description=stat_instance.description() if hasattr(stat_instance, "description") else "",
            status=status_str,
            progress=progress_text,
            progress_raw=progress_raw,
            extra={"ready_text": stat_instance.describe_statistics_success() if hasattr(stat_instance, "describe_statistics_success") and done and not already_recorded else None}
        )
        tasks.append(info)

    return TasksResponse(user_id=user_id, tasks=tasks)
# --- МОДЕЛЬ ДЛЯ НОВОГО ЕНДПОІНТУ ---
class ClaimTaskRequest(BaseModel):
    user_id: int
    stat_type: str = Field(..., description="Тип статистики, наприклад, CONDUCT_3_TRAINING")


# --- НОВИЙ ЕНДПОІНТ ДЛЯ ОТРИМАННЯ НАГОРОДИ ЗА ЗАВДАННЯ ---
@router.post("/tasks/claim", response_model=ClaimResponse)
async def claim_task_reward(body: ClaimTaskRequest):
    """
    Видача нагороди за конкретне виконане завдання (статистику).
    """
    user_id = body.user_id
    stat_type_str = body.stat_type

    # Перевірка блокування для уникнення подвійних запитів
    lock = _locks_by_user_id.setdefault(user_id, asyncio.Lock())
    if lock.locked():
        return ClaimResponse(ok=False, user_id=user_id, message="Обробка нагороди вже триває, зачекайте...")

    async with lock:
        user = await UserService.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Користувач не знайдений")

        try:
            stat_type_enum = StatisticsType[stat_type_str]
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Невірний тип завдання: {stat_type_str}")

        stat_cls = stat.get(stat_type_enum)
        if not stat_cls:
            raise HTTPException(status_code=404, detail=f"Клас для завдання {stat_type_str} не знайдений")

        stat_instance: BaseStatistics = stat_cls(user)
        done, _ = stat_instance.statistics_result()

        if not done:
            return ClaimResponse(ok=False, user_id=user_id, message="Завдання ще не виконано")

        # Перевірка, чи нагорода вже не була отримана
        if any(s.stat_type == stat_instance.stat_type() for s in user.statistics):
            return ClaimResponse(ok=False, user_id=user_id, message="Ви вже отримували нагороду за це завдання")

        # --- Адаптована логіка з вашого reward_stat методу ---
        # Ми не можемо використовувати message.edit_media, тому просто видаємо нагороду
        try:
            # Це імітація логіки з ваших класів.
            # По-хорошому, варто винести логіку нарахування в окремий сервіс.
            if stat_type_enum == StatisticsType.CONDUCT_3_TRAINING:
                await UserService.add_energy_user(user.user_id, 50)
                reward_message = "Ви отримали +50⚡ енергії!"
            elif stat_type_enum == StatisticsType.PLAY_BLITZ:
                await UserService.add_energy_user(user.user_id, 20)
                reward_message = "Ви отримали +20⚡ енергії!"
            elif stat_type_enum == StatisticsType.RICH_SEMI_FINAL_BLITZ:
                await UserService.add_energy_user(user.user_id, 50)
                reward_message = "Ви отримали +50⚡ енергії!"
            else:
                raise HTTPException(status_code=500, detail="Невідома логіка нагороди")

            # Зберігаємо статистику, щоб нагороду не можна було взяти вдруге
            await StatisticsService.save_statistics(user.user_id, stat_instance.stat_type())

        except Exception as e:
            logger.exception("Помилка під час видачі нагороди за завдання для user %s: %s", user_id, e)
            raise HTTPException(status_code=500, detail="Помилка сервера при видачі нагороди")

        return ClaimResponse(
            ok=True,
            user_id=user.user_id,
            message=reward_message
        )