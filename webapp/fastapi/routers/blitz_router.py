# routers/blitz_router.py
from __future__ import annotations

import time
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from blitz.blitz_match.constans import MIN_DONATE_ENERGY_TO_BONUS_KOEF
from blitz.blitz_match.core.manager import BlitzStateData, BlitzState
from blitz.blitz_match.core.redis_manager import TeamBlitzMatchManager
from blitz.blitz_match.entities import BlitzMatchData
from blitz.services.blitz_service import BlitzService
from database.models.user_bot import STATUS_USER_REGISTER
from logging_config import logger
from blitz.blitz_match.core.manager import TeamBlitzMatchManager as TBMatchManager
# Подправь пути импорта под вашу структуру, если нужно
from services.user_service import UserService

from blitz.exception import (
    BlitzCloseError,
    UserExistsInBlitzError,
    MaxUsersInBlitzError,
    UserForbiddenError,
)

from database.models.blitz import BlitzType, Blitz
from utils.club_utils import send_message_user_team
from webapp.fastapi.publisher import make_payloads_for_users, publish_batch, publish_match_state

router = APIRouter(prefix="/blitz", tags=["blitz"])

# Копия маппинга лимитов (как в aiogram router)
BLITZ_LIMITS = {
    BlitzType.VIP_BLITZ_V8: 8,
    BlitzType.BLITZ_V8: 8,
    BlitzType.BLITZ_V16: 16,
    BlitzType.BLITZ_V32: 32,
    BlitzType.BLITZ_V64: 64,
    BlitzType.BLITZ_V4: 4,
}

BLITZ_TYPE_NAMES = {
    BlitzType.VIP_BLITZ_V8: "VIP Бліц (8)",
    BlitzType.BLITZ_V8: "Бліц (8)",
    BlitzType.BLITZ_V16: "Бліц (16)",
    BlitzType.BLITZ_V32: "Бліц (32)",
    BlitzType.BLITZ_V64: "Бліц (64)",
    BlitzType.BLITZ_V4: "Бліц (4)",
}


# ---------- Pydantic response/request models ----------
class RegisterRequest(BaseModel):
    user_id: int


class RegisterResponse(BaseModel):
    ok: bool
    message: str
    blitz_id: Optional[int] = None
    is_tutorial: bool = False
class MatchStateResponse(BaseModel):
    match_id: Optional[str] = None
    state: Optional[str] = None
    message: Optional[str] = None
    name_first_team: Optional[str] = None
    name_second_team: Optional[str] = None
    goal_first_team: Optional[int] = None
    goal_second_team: Optional[int] = None

class ParticipantsResponse(BaseModel):
    blitz_id: Optional[int]
    start_at: Optional[datetime]
    blitz_type: Optional[str]
    participants_count: int = 0
    max_participants: Optional[int] = None


# --- ИЗМЕНЕНО ---
# Добавляем ID блица и делаем info более гибким
class BlitzResponse(BaseModel):
    blitz_id: Optional[int] = None
    seconds_remaining: int
    info: dict = {}

# --- МОДЕЛІ ДЛЯ НОВОГО ЕНДПОІНТУ ---
class DonateEnergyRequest(BaseModel):
    user_id: int
    energy: int

class DonateEnergyResponse(BaseModel):
    ok: bool
    message: str
    chance_first_team: Optional[float] = None
    chance_second_team: Optional[float] = None
# ---------- Helpers ----------
def _minutes_left_to_start(start_at: datetime) -> int:
    delta = start_at - datetime.now()
    return max(0, int(delta.total_seconds() // 60))

class ActiveBlitzResponse(BaseModel):
    active: bool
    count: int = 0
    match_ids: List[str] = []

class RegisterStatusResponse(BaseModel):
    blitz_id: int
    user_id: int
    registered: bool
    participants_count: int = 0
    max_participants: Optional[int] = None
    message: Optional[str] = None


def _is_user_in_blitz_users(users_list, user) -> bool:
    """
    Универсальная проверка: users_list может содержать объекты с полем user_id,
    объекты с вложенным .user, или просто числовые id.
    """
    if not users_list:
        return False
    logger.info(f"_is_user_in_blitz_users: {users_list}")

    target_ids = {user.user_id}
    # убираем None
    target_ids.discard(None)

    for u in users_list:
        logger.info(f"_is_user_in_blitz_users: {u}, {type(u)}")
        if u is None:
            continue
        # если просто число (id)
        if isinstance(u, int):
            if u in target_ids:
                return True
            continue

        # если объект BlitzUser-like с полем user_id
        u_user_id = getattr(u, "user_id", None)
        logger.info(f"_is_user_in_blitz: {u}, {u_user_id}")
        if u_user_id in target_ids:
            return True

        # если вложенный user
        inner = getattr(u, "user", None)
        if inner is not None:
            inner_ids = {getattr(inner, "user_id", None), getattr(inner, "id", None)}
            inner_ids.discard(None)
            if inner_ids & target_ids:
                return True

    return False


@router.get("/active", response_model=ActiveBlitzResponse)
async def blitz_is_active():
    """
    Возвращает информацию, есть ли активные блиц-матчи в TeamBlitzMatchManager.
    active = True, если есть хотя бы один матч.
    count = количество матчей
    match_ids = список blitz_match_id
    """
    if TeamBlitzMatchManager is None:
        # Если менеджер не импортировался — логируем и возвращаем "неактивно"
        logger.warning("TeamBlitzMatchManager not available - cannot determine active blitz matches")
        return ActiveBlitzResponse(active=False, count=0, match_ids=[])

    try:
        match_ids = await TeamBlitzMatchManager.get_all_match_ids()
        count = len(match_ids)
        return ActiveBlitzResponse(active=count > 0, count=count, match_ids=match_ids)
    except Exception as e:
        logger.exception("Error while checking active blitz matches: %s", e)
        # на ошибке возвращаем безопасный ответ
        return ActiveBlitzResponse(active=False, count=0, match_ids=[])
# ---------- Endpoints ----------
@router.post("/{blitz_id}/register", response_model=RegisterResponse)
async def register_to_blitz(blitz_id: int, body: RegisterRequest):
    """
    Регистрация пользователя в блиц.
    Телo: {"user_id": <telegram_id>}
    """
    user_id = body.user_id

    # Получаем пользователя
    user = await UserService.get_user(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не найден")
    if (not user.main_character) or (not user.characters):
        return RegisterResponse(ok=False, message="У вас немає головного персонажа!", blitz_id=None)

    # Получаем блиц
    blitz = await BlitzService.get_blitz_by_id(blitz_id)
    if not blitz:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Бліц з id {blitz_id} не знайдено")

    # --- ИЗМЕНЁННАЯ ЛОГИКА ПРОВЕРКИ ВРЕМЕНИ ---
    minutes_left = _minutes_left_to_start(blitz.start_at)

    # Определяем, является ли пользователь обучающимся
    is_tutorial_user = user.status_register == STATUS_USER_REGISTER.FIRST_BLITZ

    # Стандартное окно регистрации для обычных пользователей
    can_register_window = (minutes_left < 20) or (minutes_left < 30 and user.vip_pass_is_active)

    # Пропускаем проверку времени, если это обучающийся пользователь
    if not is_tutorial_user and not can_register_window:
        return RegisterResponse(ok=False, message="Реєстрація ще не відкрита (або вже закінчилась).", blitz_id=blitz_id)

    # Проверка энергии пользователя
    cost = getattr(blitz, "cost", 0)
    if getattr(user, "energy", 0) < cost:
        return RegisterResponse(ok=False, message="Недостатньо енергії для реєстрації.", blitz_id=blitz_id)

    # Узнаем max participants по типу блица
    max_chars = BLITZ_LIMITS.get(blitz.blitz_type, 16)

    try:
        # Попытка добавить пользователя
        await BlitzService.add_users_to_blitz(blitz_id, user, max_chars)

        # Обновление количества участников через WebSocket
        users = await BlitzService.get_users_from_blitz_users(blitz_id)
        payloads = make_payloads_for_users(
            "update_max_participants",
            users,
            payload_factory=lambda u: {"max_participants": len(users)}
        )
        await publish_batch(payloads, batch_size=32)

        # Списать энергию
        consumed = await UserService.consume_energy(user.user_id, cost)
        if not consumed:
            # В реальном проекте здесь нужна транзакция или компенсирующее действие
            logger.error("User added to blitz but failed to consume energy user_id=%s blitz_id=%s", user.user_id,
                         blitz_id)
            # Важно откатить регистрацию, если списание не удалось
            # await BlitzService.remove_user_from_blitz(blitz_id, user) # Пример компенсирующего действия
            raise HTTPException(status_code=500, detail="Не вдалося списати енергію після реєстрації")

        # --- ИЗМЕНЁННАЯ ЛОГИКА ОБНОВЛЕНИЯ СТАТУСА ---
        # Меняем статус пользователя после всех проверок и списаний
        if is_tutorial_user:
            # Следующий статус после первого блица - это
            await UserService.edit_status_register(user.user_id, STATUS_USER_REGISTER.END_REGISTER)

    except BlitzCloseError:
        return RegisterResponse(ok=False, message="Реєстрацію на бліц закрито.", blitz_id=blitz_id)
    except UserExistsInBlitzError:
        return RegisterResponse(ok=False, message="Ви вже зареєстровані на цей бліц.", blitz_id=blitz_id)
    except MaxUsersInBlitzError:
        return RegisterResponse(ok=False, message="Реєстрація завершена — кількість учасників досягла максимуму.",
                                blitz_id=blitz_id)
    except UserForbiddenError:
        return RegisterResponse(ok=False, message="Цей бліц доступний лише для VIP-гравців.", blitz_id=blitz_id)
    except Exception as e:
        logger.exception("Unexpected error when registering user %s to blitz %s: %s", user_id, blitz_id, e)
        raise HTTPException(status_code=500, detail="Внутрішня помилка при реєстрації")

    return RegisterResponse(ok=True, message="Успішна реєстрація на бліц", blitz_id=blitz_id, is_tutorial=is_tutorial_user)

@router.get("/is_registered/{user_id}", response_model=RegisterStatusResponse)
async def is_user_registered_in_blitz(user_id: int):
    """
    Проверяет, зарегистрирован ли пользователь (user_id) в блиц (blitz_id).
    Возвращает registered=True/False, текущий count и max участников для типа блица.
    """
    # получаем пользователя (если у вас не нужно загружать пользователя — можно убрать этот запрос,
    # но мы его делаем для валидации и совместимости с остальной логикой)
    user = await UserService.get_user(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Пользователь не знайдений")

    blitz: list[Blitz] = await BlitzService.get_all_blitz()
    if not blitz:
        logger.error("Blitz not found")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Бліц не знайдено")
    blitz: Blitz = blitz[0]
    users_list = getattr(blitz, "users", []) or []
    participants_count = len(users_list) if users_list is not None else 0
    max_participants = BLITZ_LIMITS.get(blitz.blitz_type)

    try:
        registered = _is_user_in_blitz_users(users_list, user)
        logger.info(f"reg: {registered}")
    except Exception as e:
        logger.exception("Error checking registration for user %s in blitz: %s", user_id, e)
        # на ошибке безопасно вернуть False, но логируем проблему
        registered = False

    return RegisterStatusResponse(
        blitz_id=blitz.id,
        user_id=user_id,
        registered=registered,
        participants_count=participants_count,
        max_participants=max_participants,
        message="Користувач зареєстрований" if registered else "Користувач не зареєстрований"
    )
@router.get("/user/{user_id}/match_state", response_model=MatchStateResponse)
async def get_user_match_state(user_id: int):
    """
    Находит первый матч в TeamBlitzMatchManager, где присутствует user_id,
    и возвращает его BlitzStateData: state и message.
    """
    try:
        match_ids = await TeamBlitzMatchManager.get_all_match_ids()
    except Exception as e:
        logger.exception("get_user_match_state: cannot access TeamBlitzMatchManager.all_matches: %s", e)
        raise HTTPException(status_code=500, detail="Internal error")
    logger.info("match_ids: %s", match_ids)
    for match_id in match_ids:
        storage = await TeamBlitzMatchManager.get_match_storage(match_id)
        if not storage:
            continue
        logger.info(f"get_user_match_state: match_id={match_id}, storage={storage}")

        # Проверяем ID пользователей, хранящиеся в Redis-модели
        redis_match = storage.match_data
        user_ids_in_match = redis_match.first_team.user_ids + redis_match.second_team.user_ids
        logger.info(f"user_ids_in_match: {user_ids_in_match}")

        if user_id in user_ids_in_match:
            # Нашли матч, возвращаем его состояние
            state_data = storage.state_data
            tbm: BlitzMatchData = TBMatchManager.get_match(match_id)
            return MatchStateResponse(
                match_id=match_id,
                state=state_data.state,
                message=state_data.message,
                name_first_team=tbm.first_team.team_name.split("(")[0] if hasattr(tbm, "first_team") else "Unknown",
                name_second_team=tbm.second_team.team_name.split("(")[0] if hasattr(tbm, "second_team") else "Unknown",
                goal_first_team=tbm.first_team.goals if hasattr(tbm, "first_team") else 0,
                goal_second_team=tbm.second_team.goals if hasattr(tbm, "second_team") else 0,
            )

    raise HTTPException(status_code=404, detail=f"Пользователь {user_id} не найден...")


# --- ✨ НОВИЙ, БІЛЬШ ЗРУЧНИЙ ЕНДПОІНТ ✨ ---
@router.post("/match/donate_by_user", response_model=DonateEnergyResponse, tags=["blitz", "match actions"])
async def donate_energy_by_user(body: DonateEnergyRequest):
    """
    Додає енергію від гравця. Автоматично знаходить активний матч за user_id.
    """
    # Припускаємо, що ці константи імпортовані або визначені
    MIN_ENERGY_DONATE_MATCH = 10

    # 1. Валідація вхідних даних (аналогічно до попередньої версії)
    energy = body.energy
    user_id = body.user_id
    if energy < MIN_ENERGY_DONATE_MATCH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Мінімум {MIN_ENERGY_DONATE_MATCH} енергії"
        )

    user = await UserService.get_user(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Користувача не знайдено")

    if user.energy < energy:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="У вас не вистачає енергії!"
        )

    # 2. ✨ Пошук матчу за user_id
    match_data: Optional[BlitzMatchData] = None

    # Получаем список всех активных матчей из Redis
    all_match_ids = await TeamBlitzMatchManager.get_all_match_ids()

    for match_id in all_match_ids:
        match_data_candidate = await TeamBlitzMatchManager.get_match(match_id)
        if not match_data_candidate:
            continue
        await match_data_candidate.init_teams()

        # Проверяем, есть ли нужный юзер в матче
        if user_id in getattr(match_data_candidate, "all_user_ids_in_match", []):
            match_data = match_data_candidate
            break  # нашли нужный матч, выходим

    if not match_data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="Активний матч для цього користувача не знайдено")

    # if not body.end_time or int(time.time()) > body.end_time:
    #     raise HTTPException(
    #         status_code=status.HTTP_400_BAD_REQUEST,
    #         detail="Час для цього голу вже закінчився"
    #     )
    match_data = TBMatchManager.get_match(match_data.blitz_match_id)
    old_chance_team = match_data.get_chance_teams()
    old_first_club_chance = old_chance_team[0] * 100
    old_second_club_chance = old_chance_team[1] * 100

    my_team = None
    if user.user_id in match_data.first_team.users_match_ids:
        match_data.first_team.episode_donate_energy += energy
        my_team = match_data.first_team
    elif user.user_id in match_data.second_team.users_match_ids:
        match_data.second_team.episode_donate_energy += energy
        my_team = match_data.second_team

    # Ця перевірка по суті вже не потрібна, якщо логіка пошуку правильна, але залишаємо для надійності
    if not my_team:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Не вдалося визначити команду гравця в знайденому матчі.")

    # 4. Списання енергії
    await UserService.consume_energy(user_id=user.user_id, amount_energy_consume=energy)

    # 5. Логіка бонусних повідомлень та сповіщень
    if my_team.episode_donate_energy >= MIN_DONATE_ENERGY_TO_BONUS_KOEF and not my_team.text_is_send_epizode_donate_energy:
        # Тут можна залишити вашу логіку відправки бонусного фото
        my_team.text_is_send_epizode_donate_energy = True
        pass

    after_chance_club = match_data.get_chance_teams()
    chance_first_team_after = after_chance_club[0] * 100
    chance_second_team_after = after_chance_club[1] * 100

    text = f"""
⚽️ <b>{user.main_character.name} додав {energy}🔋 до сил команді {my_team.team_name}!</b> ⚽️  

🔥 <b>Зміни шансів на гол:</b>  
- ⚽️ Команда: {match_data.first_team.team_name} - <b>{old_first_club_chance:.2f}%</b> → <b>{chance_first_team_after:.2f}%</b>  
- ⚽️ Команда: {match_data.second_team.team_name} - <b>{old_second_club_chance:.2f}%</b> → <b>{chance_second_team_after:.2f}%</b>  

💪 Завдяки підтримці команда {my_team.team_name} отримала значний поштовх! 🚀 
    """

    payloads = make_payloads_for_users(
        "show_top_alert",
        match_data.all_users,
        payload_factory=lambda u: {
            "message": f"{text}",
            "team1": match_data.first_team.team_name,
            "team2": match_data.second_team.team_name,
            "chance_first_team_after": chance_first_team_after,
            "chance_second_team_after": chance_second_team_after,
        }
    )
    await publish_batch(payloads, batch_size=32)
    text = f"""
    ⚽️ <b>{user.main_character.name} додав {energy}🔋 до сил команді {my_team.team_name}!</b> ⚽️  
    🔥 <b>Зміни шансів на гол:</b>  
    - ⚽️ Команда: {match_data.first_team.team_name} - <b>{old_first_club_chance:.2f}%</b> → <b>{chance_first_team_after:.2f}%</b>  
    - ⚽️ Команда: {match_data.second_team.team_name} - <b>{old_second_club_chance:.2f}%</b> → <b>{chance_second_team_after:.2f}%</b>  
    """
    await TeamBlitzMatchManager.set_match_state(
        match_data.blitz_match_id,
        BlitzStateData(state=BlitzState.PING, message=text),
    )
    await publish_match_state(match_data.blitz_match_id)
    await send_message_user_team(
        user_team=match_data.all_users,
        my_user=None,
        text=text
    )

    # 6. Повернення успішної відповіді
    return DonateEnergyResponse(
        ok=True,
        message=f"{user.main_character.name} додав {energy}🔋 до сил команді!",
        chance_first_team=chance_first_team_after,
        chance_second_team=chance_second_team_after,
    )


@router.get("/next/participants", response_model=ParticipantsResponse)
async def next_blitz_participants():
    """
    Возвращает информацию о ближайшем грядущем блице:
    - blitz_id, start_at, blitz_type, participants_count, max_participants
    Если нет будущих блиц -> возвращает поля с None и participants_count 0.
    """
    blitz_list = await BlitzService.get_all_blitz()
    if not blitz_list:
        return ParticipantsResponse(blitz_id=None, start_at=None, blitz_type=None, participants_count=0, max_participants=None)

    now = datetime.now()
    future = [b for b in blitz_list if b.start_at > now]
    if not future:
        return ParticipantsResponse(blitz_id=None, start_at=None, blitz_type=None, participants_count=0, max_participants=None)

    next_blitz = sorted(future, key=lambda b: b.start_at)[0]
    max_part = BLITZ_LIMITS.get(next_blitz.blitz_type, None)
    participants_count = len(getattr(next_blitz, "users", []) or [])

    return ParticipantsResponse(
        blitz_id=next_blitz.id,
        start_at=next_blitz.start_at,
        blitz_type=BLITZ_TYPE_NAMES.get(next_blitz.blitz_type, str(next_blitz.blitz_type)),
        participants_count=participants_count,
        max_participants=max_part
    )


# --- ИЗМЕНЕНО ---
@router.get("/next", response_model=BlitzResponse)
async def seconds_to_next_blitz():
    """
    Возвращает количество секунд и ID до ближайшего грядущего блица.
    """
    blitz_list = await BlitzService.get_all_blitz()
    if not blitz_list:
        return BlitzResponse(seconds_remaining=0)

    now = datetime.now()
    future = [b for b in blitz_list if b.start_at > now]
    if not future:
        return BlitzResponse(seconds_remaining=0)

    next_blitz: Blitz = sorted(future, key=lambda b: b.start_at)[0]
    seconds = max(0, int((next_blitz.start_at - now).total_seconds()))
    max_participants = BLITZ_LIMITS.get(next_blitz.blitz_type)

    # Возвращаем расширенную информацию, включая ID
    return BlitzResponse(
        blitz_id=next_blitz.id,
        seconds_remaining=seconds,
        info={
            "title": BLITZ_TYPE_NAMES.get(next_blitz.blitz_type, str(next_blitz.blitz_type)),
            "participants_count": len(next_blitz.users),
            "max_participants": max_participants,
            "blitz_time": next_blitz.start_at.strftime("%H:%M"),
        }
    )
