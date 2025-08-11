import random
import re
from typing import Optional

from database.models.user_bot import UserBot
from .templates import (
    NO_GOAL_EVENT_SCENES,
    GOAL_EVENT_SCENES
)
from .types import SceneTemplate
from ..entities import BlitzMatchData
from ..enum_blitz_match import TypeGoalEvent

EVENT_SCENES = {
    TypeGoalEvent.NO_GOAL : NO_GOAL_EVENT_SCENES, 
    TypeGoalEvent.GOAL: GOAL_EVENT_SCENES
}


class SceneRenderer:
    
    def __init__(
        self, 
        match_data: BlitzMatchData,
        goal_event: TypeGoalEvent,
        users_scene: list[UserBot] = [],  # Список персонажей, участвующих в моменте
        scorer: Optional[UserBot] = None,     # Игрок, забивший гол
        assistant: Optional[UserBot] = None, # Игрок, сделавший ассист
        user_enemy: Optional[UserBot] = None,
    ):
        self.match_data = match_data
        self.scenes = EVENT_SCENES[goal_event]
        self.users_scene = users_scene
        self.scorer = scorer
        self.assistant = assistant
        self.user_enemy = user_enemy
        self.custom_mapping = self._map_characters_to_positions()

    def _map_characters_to_positions(self) -> dict[str, UserBot]:
        """
        Определить роли персонажей и их принадлежность к командам.
        """
        mapping = {}

        for character in self.users_scene:
            team, prefix = self._get_team_and_prefix(character)
            if not team:
                continue
            mapping[prefix + "team_character"] = character

        if self.scorer:
            mapping["scorer"] = self.scorer
        if self.assistant:
            mapping["assistant"] = self.assistant
        if self.user_enemy:
            mapping[f"enemy_team_character"] = self.user_enemy

        return mapping

    def _get_team_and_prefix(self, user: UserBot) -> tuple[Optional[object], str]:
        if self.match_data.first_team.is_user_in_team(user):
            return self.match_data.first_team, ""
        elif self.match_data.second_team.is_user_in_team(user):
            return self.match_data.second_team, "enemy_"
        return None, ""

    def get_available_positions(self) -> set[str]:
        return set(self.custom_mapping.keys())

    def select_template(self) -> Optional[SceneTemplate]:
        available = self.get_available_positions()
        valid_templates = [
            tmpl for tmpl in self.scenes
            if all(pos in available for pos in tmpl.required_positions)
        ]
        return random.choice(valid_templates) if valid_templates else None

    def render(self) -> str:
        template = self.select_template()
        if not template:
            return "<i>Момент не відбувся — недостатньо гравців</i>"

        return self._fill_template(template.text)

    def _fill_template(
        self, 
        template_text: str, 
    ) -> str:
        def get_nick(position_key: str) -> str:
            if position_key in self.custom_mapping:
                return self.custom_mapping[position_key].main_character.name

            return "<i>Неизвестный игрок</i>"

        return re.sub(r"\{(\w+?)\}", lambda m: get_nick(m.group(1)), template_text)