# routers/training_router.py
from __future__ import annotations
from typing import Optional, List
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database.models.character import Character
from database.models.user_bot import STATUS_USER_REGISTER, UserBot
from database.session import get_session
from gym_character.core.gym import Gym
from gym_character.core.manager import GymCharacterManager
from services.reminder_character_service import RemniderCharacterService
from services.user_service import UserService
from logging_config import logger

router = APIRouter(prefix="/training", tags=["training"])


class StartTrainingBody(BaseModel):
    user_id: int
    gym_time_seconds: int = Field(..., gt=0, description="Тривалість тренування в секундах")
    cost_energy: int = Field(..., ge=0, description="Вартість тренування в енергії")
    is_first_training: bool = False


# --- допоміжний серіалізатор reminder ---
def reminder_to_dict(r) -> dict:
    if not r:
        return {}
    return {
        "id": getattr(r, "id", None),
        "character_id": getattr(r, "character_id", None),
        "character_in_training": bool(getattr(r, "character_in_training", False)),
        "time_start_training": getattr(r, "time_start_training").isoformat() if getattr(r, "time_start_training",
                                                                                        None) else None,
        "time_training_seconds": int(getattr(r, "time_training_seconds")) if getattr(r, "time_training_seconds",
                                                                                     None) is not None else None,
        "education_reward_date": getattr(r, "education_reward_date").isoformat() if getattr(r, "education_reward_date",
                                                                                            None) else None,
    }


@router.post("/start", status_code=status.HTTP_200_OK)
async def start_training(body: StartTrainingBody):
    logger.info(f"Training start request for user {body.user_id}")

    # Отримуємо користувача разом з усіма персонажами
    async for session in get_session():
        user = await session.scalar(
            select(UserBot)
            .where(UserBot.user_id == body.user_id)
            .options(selectinload(UserBot.characters).selectinload(Character.reminder))
        )
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")

        characters: List[Character] = user.characters
        if not characters:
            raise HTTPException(status_code=400, detail="У пользователя нет персонажей")

        # 1. Перевірка: чи хтось уже тренується?
        for char in characters:
            # Якщо ремайндера немає, створимо (хоча він має бути)
            if not char.reminder:
                # Це асинхронний виклик, краще робити через сервіс, але тут ми в сесії
                # Для надійності краще використати існуючий сервіс поза циклом або перевірити логіку створення
                await RemniderCharacterService.create_character_reminder(char.id)
                # Перезавантажимо ремайндер, якщо створили (спрощено)

            if char.reminder and char.reminder.character_in_training:
                raise HTTPException(
                    status_code=400,
                    detail=f"Персонаж {char.name} вже в процесі тренування. Дочекайтесь завершення."
                )

    # 2. Списання енергії (один раз за все тренування)
    consumed_user = await UserService.consume_energy(body.user_id, body.cost_energy)
    if not consumed_user:
        raise HTTPException(status_code=400, detail="Недостаточно энергии или пользователь не найден")

    # 3. Оновлення статусів у БД для ВСІХ персонажів
    now = datetime.now()
    if body.is_first_training:
        await UserService.edit_status_register(body.user_id, STATUS_USER_REGISTER.FIRST_BLITZ)

    try:
        # Оновлюємо кожного персонажа
        for char in characters:
            # Оновлюємо час
            await RemniderCharacterService.update_training_info(
                character_id=char.id,
                time_start_training=now,
                time_training_seconds=int(body.gym_time_seconds)
            )
            # Вмикаємо статус тренування
            await RemniderCharacterService.toggle_character_training_status(character_id=char.id)

    except Exception as e:
        logger.exception("Ошибка при обновлении training_info для группы: %s", e)
        # Тут можна було б зробити rollback, але для спрощення просто повертаємо 500
        raise HTTPException(status_code=500, detail="Ошибка запуска тренировки")

    # 4. Запуск Gym планувальника (один інстанс на всіх)
    try:
        gym_time_td = timedelta(seconds=int(body.gym_time_seconds))

        # Створюємо Gym для списку персонажів
        gym_scheduler = Gym(
            characters=characters,  # Передаємо список!
            time_training=gym_time_td,
        )

        task_training = gym_scheduler.start_training()

        # Реєструємо задачу для КОЖНОГО персонажа в менеджері,
        # щоб при спробі скасувати тренування для будь-кого з них, ми мали доступ до таски.
        # (Оскільки таска одна на всіх, це нормально).
        for char in characters:
            GymCharacterManager.add_gym_task(
                character_id=char.id,
                task=task_training
            )

    except Exception as e:
        logger.exception("Не удалось запустить Gym планировщик: %s", e)
        # Тренування в БД відмічено, але таск не пішов.
        # У реальному проді тут треба механізм відновлення.

    # 5. Формуємо відповідь (беремо дані першого персонажа для таймера, бо вони однакові)
    first_char = characters[0]
    # Оновлюємо дані, щоб повернути актуальний reminder
    # (можна взяти з попередніх кроків, але для чистоти краще свіжий об'єкт)
    # Для швидкодії просто сконструюємо відповідь на основі вхідних даних

    seconds_remaining = int(body.gym_time_seconds)

    # Повертаємо reminder головного персонажа (або першого), як референс
    main_char = next((c for c in characters if c.id == user.main_character_id), first_char)

    # Щоб отримати актуальний об'єкт reminder для відповіді (як у старому коді)
    reminder_dict = {
        "id": main_char.reminder.id if main_char.reminder else None,
        "character_id": main_char.id,
        "character_in_training": True,
        "time_start_training": now.isoformat(),
        "time_training_seconds": int(body.gym_time_seconds),
        "education_reward_date": main_char.reminder.education_reward_date.isoformat() if main_char.reminder and main_char.reminder.education_reward_date else None
    }

    return {
        "ok": True,
        "user_id": body.user_id,
        "characters_count": len(characters),
        "reminder": reminder_dict,
        "seconds_remaining": seconds_remaining,
        "message": f"Тренування розпочато для {len(characters)} персонажів, списано {body.cost_energy} енергії"
    }


@router.get("/status/{user_id}")
async def is_user_any_character_in_training(user_id: int):
    """
    Повертає {"in_training": bool}.
    True, якщо хоча б один персонаж користувача зараз тренується.
    """
    async for session in get_session():
        user = await session.scalar(
            select(UserBot)
            .where(UserBot.user_id == user_id)
            .options(selectinload(UserBot.characters).selectinload(Character.reminder))
        )
        if not user or not user.characters:
            return {"in_training": False}

        for char in user.characters:
            if char.reminder and char.reminder.character_in_training:
                return {"in_training": True}

    return {"in_training": False}


@router.get("/remaining/{user_id}")
async def training_remaining_seconds(user_id: int):
    """
    Повертає час до кінця тренування.
    Оскільки вони тренуються разом, беремо час першого знайденого активного персонажа.
    """
    async for session in get_session():
        user = await session.scalar(
            select(UserBot)
            .where(UserBot.user_id == user_id)
            .options(selectinload(UserBot.characters).selectinload(Character.reminder))
        )

        if not user or not user.characters:
            return {"seconds_remaining": 0, "total_training_seconds": 0}

        # Шукаємо активного
        active_char = None
        for char in user.characters:
            if char.reminder and char.reminder.character_in_training:
                active_char = char
                break

        if not active_char:
            return {"seconds_remaining": 0, "total_training_seconds": 0}

        reminder = active_char.reminder
        time_start = getattr(reminder, "time_start_training", None)
        total_seconds = getattr(reminder, "time_training_seconds", None)

        if not time_start or total_seconds is None:
            return {"seconds_remaining": 0, "total_training_seconds": 0}

        end_time = time_start + timedelta(seconds=int(total_seconds))
        now = datetime.now()
        remaining = int((end_time - now).total_seconds())
        if remaining < 0:
            remaining = 0

        return {
            "seconds_remaining": remaining,
            "total_training_seconds": int(total_seconds)
        }

    return {"seconds_remaining": 0, "total_training_seconds": 0}