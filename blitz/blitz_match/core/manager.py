from dataclasses import dataclass
from enum import Enum

from blitz.blitz_match.entities import BlitzMatchData
class BlitzState(Enum):
    STARTED = "started"
    PREPARATION_MATCH = "preparation_match"
    GOAL = "goal"
    NO_GOAL = "no_goal"
    PING = "ping"
    END_MATCH = "end_match"
    FINISHED = "finished"

@dataclass
class BlitzStateData:
    state: BlitzState
    message: str


class TeamBlitzMatchManager:
    all_matches: dict[str, tuple[BlitzMatchData, BlitzStateData]] = {}

    @classmethod
    def add_match(cls, match_data: BlitzMatchData, blitz_state: BlitzStateData) -> None:
        cls.all_matches[match_data.blitz_match_id] = (match_data, blitz_state)

    @classmethod
    def get_match(cls, blitz_match_id: str) -> BlitzMatchData | None:
        data = cls.all_matches.get(blitz_match_id, [])
        if data:
            return data[0]
        return None
    @classmethod
    def get_match_state(cls, blitz_match_id: str) -> BlitzStateData | None:
        data = cls.all_matches.get(blitz_match_id, [])
        if len(data) > 1:
            return data[1]
        return None

    @classmethod
    def set_match_state(cls, blitz_match_id: str, new_state: BlitzStateData) -> bool:
        """
        Заменяет BlitzStateData для матча с заданным blitz_match_id.
        Возвращает True, если матч найден и состояние обновлено, иначе False.
        """
        existing = cls.all_matches.get(blitz_match_id)
        if not existing:
            return False

        match_data = existing[0]
        cls.all_matches[blitz_match_id] = (match_data, new_state)
        return True

    @classmethod
    def set_all_matches_state(cls, state_or_data: BlitzState | BlitzStateData, message: str | None = None) -> int:
        """
        Обновляет состояние всех матчей.

        Аргументы:
            state_or_data: либо BlitzStateData (полностью), либо BlitzState (enum).
            message: опциональное сообщение — используется только если передан BlitzState.

        Возвращает:
            Количество обновлённых матчей.
        """
        # нормализуем вход в BlitzStateData
        if isinstance(state_or_data, BlitzStateData):
            new_state_data = state_or_data
        else:
            # state_or_data — BlitzState
            new_state_data = BlitzStateData(state=state_or_data, message=message or "")

        # Используем list(...) чтобы не итерировать напрямую по изменяемому словарю
        updated = 0
        for key, (match_data, _) in list(cls.all_matches.items()):
            cls.all_matches[key] = (match_data, new_state_data)
            updated += 1
        return updated

    @classmethod
    def clear_matches(cls) -> None:
        cls.all_matches.clear()
