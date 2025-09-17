# routers/training_router.py
from __future__ import annotations
from typing import Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from gym_character.core.gym import Gym
from gym_character.core.manager import GymCharacterManager
from services.reminder_character_service import RemniderCharacterService
from services.user_service import UserService
from logging_config import logger

router = APIRouter(prefix="/training", tags=["training"])


class StartTrainingBody(BaseModel):
    user_id: int
    gym_time_seconds: int = Field(..., gt=0, description="Длительность тренировки в секундах")
    cost_energy: int = Field(..., ge=0, description="Стоимость тренировки в энергии")


# --- вспомогательный сериализатор reminder ---
def reminder_to_dict(r) -> dict:
    if not r:
        return {}
    return {
        "id": getattr(r, "id", None),
        "character_id": getattr(r, "character_id", None),
        "character_in_training": bool(getattr(r, "character_in_training", False)),
        "time_start_training": getattr(r, "time_start_training").isoformat() if getattr(r, "time_start_training", None) else None,
        "time_training_seconds": int(getattr(r, "time_training_seconds")) if getattr(r, "time_training_seconds", None) is not None else None,
        "education_reward_date": getattr(r, "education_reward_date").isoformat() if getattr(r, "education_reward_date", None) else None,
    }
@router.post("/start", status_code=status.HTTP_200_OK)
async def start_training(body: StartTrainingBody):
    logger.info("Training start")
    """
    Запуск тренировки для главного персонажа пользователя.
    """
    user = await UserService.get_user(body.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    main_char = getattr(user, "main_character", None)
    if not main_char:
        raise HTTPException(status_code=400, detail="У пользователя нет главного персонажа")

    # Убедимся, что у персонажа есть reminder, иначе создадим
    reminder = getattr(main_char, "reminder", None)
    if not reminder:
        reminder = await RemniderCharacterService.create_character_reminder(main_char.id)

    # если уже в процессе тренировки — отказ
    if reminder and getattr(reminder, "character_in_training", False):
        raise HTTPException(status_code=400, detail="Персонаж уже в процессе тренировки")

    # списываем энергию
    consumed_user = await UserService.consume_energy(body.user_id, body.cost_energy)
    if not consumed_user:
        raise HTTPException(status_code=400, detail="Недостаточно энергии или пользователь не найден")

    # обновляем время тренировки в БД
    now = datetime.now()
    try:
        await RemniderCharacterService.update_training_info(
            character_id=main_char.id,
            time_start_training=now,
            time_training_seconds=int(body.gym_time_seconds)
        )
    except Exception as e:
        logger.exception("Ошибка при обновлении training_info: %s", e)
        raise HTTPException(status_code=500, detail="Ошибка установки времени тренировки")

    # переключаем статус тренировки (toggle)
    try:
        await RemniderCharacterService.toggle_character_training_status(character_id=main_char.id)
    except Exception as e:
        logger.exception("toggle_character_training_status failed: %s", e)
        raise HTTPException(status_code=500, detail="Не удалось включить статус тренировки")

    # --- Запуск Gym планировщика и регистрация задачи в менеджере ---
    try:
        # Gym ожидает timedelta (в оригинальном хендлере callback_data.gym_time был timedelta)
        gym_time_td = timedelta(seconds=int(body.gym_time_seconds))
        gym_scheduler = Gym(
            character=main_char,
            time_training=gym_time_td,
        )
        # start_training, как в вашем хендлере, возвращает таск/объект задачи
        task_training = gym_scheduler.start_training()
        GymCharacterManager.add_gym_task(
            character_id=main_char.id,
            task=task_training
        )
    except Exception as e:
        # логируем, но не откатываем изменения в БД — тренировка отмечена, но планировщик не запустился
        logger.exception("Не удалось запустить Gym планировщик для character_id=%s: %s", main_char.id, e)

    # Сформируем ответ: reminder актуальный + seconds_remaining
    user_fresh = await UserService.get_user(body.user_id)
    main_char_fresh = getattr(user_fresh, "main_character", None)
    reminder_fresh = getattr(main_char_fresh, "reminder", None)

    seconds_remaining = 0
    if reminder_fresh and reminder_fresh.character_in_training and reminder_fresh.time_start_training and reminder_fresh.time_training_seconds:
        end_time = reminder_fresh.time_start_training + timedelta(seconds=int(reminder_fresh.time_training_seconds))
        seconds_remaining = int((end_time - datetime.now()).total_seconds())
        if seconds_remaining < 0:
            seconds_remaining = 0

    return {
        "ok": True,
        "user_id": body.user_id,
        "character_id": main_char.id,
        "reminder": reminder_to_dict(reminder_fresh),
        "seconds_remaining": seconds_remaining,
        "message": f"Тренировка начата, списано {body.cost_energy} энергии"
    }

@router.get("/status/{user_id}")
async def is_user_main_character_in_training(user_id: int):
    """
    Возвращает {"in_training": bool} — тренируется ли главный персонаж пользователя.
    """
    user = await UserService.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    main_char = getattr(user, "main_character", None)
    if not main_char:
        return {"in_training": False}

    reminder = getattr(main_char, "reminder", None)
    if not reminder:
        return {"in_training": False}

    return {"in_training": bool(reminder.character_in_training)}


@router.get("/remaining/{user_id}")
async def training_remaining_seconds(user_id: int):
    """
    Возвращает количество секунд до окончания и общую длительность тренировки
    главного персонажа пользователя.
    Если тренировки нет — возвращает {"seconds_remaining": 0, "total_training_seconds": 0}.
    """
    user = await UserService.get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    main_char = getattr(user, "main_character", None)
    if not main_char:
        return {"seconds_remaining": 0, "total_training_seconds": 0}

    reminder = getattr(main_char, "reminder", None)
    if not reminder:
        return {"seconds_remaining": 0, "total_training_seconds": 0}

    if not reminder.character_in_training:
        return {"seconds_remaining": 0, "total_training_seconds": 0}

    time_start = getattr(reminder, "time_start_training", None)
    total_seconds = getattr(reminder, "time_training_seconds", None)

    if not time_start or not total_seconds:
        return {"seconds_remaining": 0, "total_training_seconds": 0}

    end_time = time_start + timedelta(seconds=int(total_seconds))
    now = datetime.now()
    remaining = int((end_time - now).total_seconds())
    if remaining < 0:
        remaining = 0

    # --- ЗМІНА ТУТ ---
    # Повертаємо не тільки залишок, а й загальну тривалість
    return {
        "seconds_remaining": remaining,
        "total_training_seconds": int(total_seconds)
    }
