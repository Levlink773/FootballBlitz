from pydantic import BaseModel, Field
from enum import Enum
from typing import List, Optional

from blitz.blitz_match.core.manager import BlitzStateData
from blitz.blitz_match.entities import BlitzMatchData, MatchTeamBlitz
from webapp.fastapi.publisher import get_redis


# Ваш Enum остается без изменений
class BlitzState(Enum):
    STARTED = "started"
    PREPARATION_MATCH = "preparation_match"
    GOAL = "goal"
    NO_GOAL = "no_goal"
    PING = "ping"
    END_MATCH = "end_match"
    FINISHED = "finished"

# Модель для хранения состояния
class RedisBlitzStateData(BaseModel):
    state: BlitzState
    message: str

# Упрощенная модель команды для Redis
class RedisMatchTeamBlitz(BaseModel):
    team_id: int
    goals: int = 0
    episode_donate_energy: int = 0
    # Вместо объектов UserBot храним только их ID
    user_ids: List[int] = Field(default_factory=list)

# Упрощенная модель матча для Redis
class RedisBlitzMatchData(BaseModel):
    blitz_match_id: str
    stage: int
    first_team: RedisMatchTeamBlitz
    second_team: RedisMatchTeamBlitz

# Полная структура, которая будет храниться в Redis под одним ключом
class RedisMatchStorage(BaseModel):
    match_data: RedisBlitzMatchData
    state_data: RedisBlitzStateData


class TeamBlitzMatchManager:
    """
    Менеджер для управления состоянием блиц-матчей в Redis.
    """
    MATCH_KEY_PREFIX = "blitz_match"
    # Матчи будут автоматически удаляться из Redis через 2 часа
    MATCH_TTL_SECONDS = 7200

    @classmethod
    def _get_key(cls, blitz_match_id: str) -> str:
        """Формирует ключ для Redis."""
        return f"{cls.MATCH_KEY_PREFIX}:{blitz_match_id}"

    @classmethod
    async def add_match(cls, match_data: BlitzMatchData, blitz_state: BlitzStateData) -> None:
        """
        Сохраняет новый матч в Redis.
        Конвертирует сложные объекты в простые Pydantic-модели для хранения.
        """
        # Конвертация в Redis-совместимые модели
        storage_model = RedisMatchStorage(
            match_data={
                "blitz_match_id": match_data.blitz_match_id,
                "stage": match_data.stage,
                "first_team": {
                    "team_id": match_data.first_team.team_id,
                    "user_ids": [user.user_id for user in match_data.first_team.users_in_match]
                },
                "second_team": {
                    "team_id": match_data.second_team.team_id,
                    "user_ids": [user.user_id for user in match_data.second_team.users_in_match]
                }
            },
            state_data={
                "state": blitz_state.state,
                "message": blitz_state.message
            }
        )

        key = cls._get_key(match_data.blitz_match_id)
        # .json() превращает Pydantic-модель в JSON-строку
        r = get_redis()
        await r.set(key, storage_model.json(), ex=cls.MATCH_TTL_SECONDS)

    @classmethod
    async def get_match_storage(cls, blitz_match_id: str) -> Optional[RedisMatchStorage]:
        """Получает сырые данные матча из Redis в виде Pydantic-модели."""
        key = cls._get_key(blitz_match_id)
        r = get_redis()
        data_json = await r.get(key)

        if not data_json:
            return None

        return RedisMatchStorage.parse_raw(data_json)

    @classmethod
    async def get_match(cls, blitz_match_id: str) -> Optional[BlitzMatchData]:
        """
        Получает матч из Redis и восстанавливает его в полноценный dataclass-объект.
        ВАЖНО: Этот объект не "гидрирован", т.е. в нем нет полных данных из БД.
        Его нужно "оживить", вызвав .init_teams() после получения.
        """
        storage = await cls.get_match_storage(blitz_match_id)
        if not storage:
            return None

        redis_match_data = storage.match_data

        # Восстанавливаем оригинальные dataclass'ы
        match_data = BlitzMatchData(
            blitz_match_id=redis_match_data.blitz_match_id,
            stage=redis_match_data.stage,
            first_team=MatchTeamBlitz(team_id=redis_match_data.first_team.team_id),
            second_team=MatchTeamBlitz(team_id=redis_match_data.second_team.team_id)
        )
        return match_data

    @classmethod
    async def set_match_state(cls, blitz_match_id: str, new_state: BlitzStateData) -> bool:
        """Обновляет состояние для существующего матча."""
        storage = await cls.get_match_storage(blitz_match_id)
        if not storage:
            return False

        # Обновляем только часть данных о состоянии
        storage.state_data = RedisBlitzStateData(state=new_state.state, message=new_state.message)

        key = cls._get_key(blitz_match_id)
        r = get_redis()
        await r.set(key, storage.json(), ex=cls.MATCH_TTL_SECONDS)
        return True

    @classmethod
    async def get_all_match_ids(cls) -> List[str]:
        """Возвращает список ID всех активных матчей."""
        r = get_redis()
        keys = [key async for key in r.scan_iter(f"{cls.MATCH_KEY_PREFIX}:*")]
        # Извлекаем ID из ключа 'blitz_match:12345' -> '12345'
        return [key.split(":")[-1] for key in keys]

    @classmethod
    async def clear_matches(cls) -> None:
        """Удаляет все матчи из Redis."""
        match_ids = await cls.get_all_match_ids()
        if not match_ids:
            return
        keys_to_delete = [cls._get_key(match_id) for match_id in match_ids]
        r = get_redis()
        await r.delete(*keys_to_delete)