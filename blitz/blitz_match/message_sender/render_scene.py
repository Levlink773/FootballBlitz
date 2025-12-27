import random
import re
from typing import Optional, Dict, List

from database.models.character import Character, Position
from .templates import (
    NO_GOAL_EVENT_SCENES,
    GOAL_EVENT_SCENES
)
from .types import SceneTemplate
from ..entities import BlitzMatchData
from ..enum_blitz_match import TypeGoalEvent

EVENT_SCENES = {
    TypeGoalEvent.NO_GOAL: NO_GOAL_EVENT_SCENES,
    TypeGoalEvent.GOAL: GOAL_EVENT_SCENES
}


class SceneRenderer:

    def __init__(
            self,
            match_data: BlitzMatchData,
            goal_event: TypeGoalEvent,
            # 👇 ТЕПЕРЬ ПРИНИМАЕМ CHARACTER, А НЕ USERBOT
            users_scene: List[Character] = [],
            scorer: Optional[Character] = None,
            assistant: Optional[Character] = None,
            user_enemy: Optional[Character] = None,
    ):
        self.match_data = match_data
        self.scenes = EVENT_SCENES[goal_event]

        self.users_scene = users_scene
        self.scorer = scorer
        self.assistant = assistant
        self.user_enemy = user_enemy

        # 1. Определяем атакующую команду (по ID владельца персонажа)
        self.attacking_team = self._determine_attacking_team()

        # 2. Создаем карту ролей { "enemy_goalkeeper": Character, ... }
        self.custom_mapping = self._map_characters_to_positions()

    def _determine_attacking_team(self):
        """
        Визначає команду, що володіє м'ячем у цьому епізоді.
        Перевірка йде через порівняння user_id власника персонажа зі складом команди.
        """

        def is_in_first_team(char: Character) -> bool:
            # users_match_ids - це властивість MatchTeamBlitz, що повертає список ID юзерів
            return char.characters_user_id in self.match_data.first_team.users_match_ids

        if self.scorer:
            return self.match_data.first_team if is_in_first_team(self.scorer) else self.match_data.second_team
        elif self.assistant:
            return self.match_data.first_team if is_in_first_team(self.assistant) else self.match_data.second_team
        elif self.users_scene:
            # Якщо немає явних героїв, беремо першого з масовки як "свого"
            u = self.users_scene[0]
            return self.match_data.first_team if is_in_first_team(u) else self.match_data.second_team

        return None

    def _map_characters_to_positions(self) -> Dict[str, Character]:
        """
        Формує словник ролей.
        Ключі: рядки для шаблону (напр. 'enemy_goalkeeper').
        Значення: об'єкти Character.
        """
        mapping = {}

        # Збираємо всіх унікальних учасників
        all_participants = []
        if self.scorer: all_participants.append(self.scorer)
        if self.assistant: all_participants.append(self.assistant)
        if self.user_enemy: all_participants.append(self.user_enemy)
        all_participants.extend(self.users_scene)

        # Видаляємо дублікати, зберігаючи порядок
        unique_participants = list(dict.fromkeys(all_participants))

        for char in unique_participants:
            # А. Базові параметри
            prefix = self._get_prefix(char)  # "" або "enemy_"
            pos_name = self._get_position_name(char)  # "goalkeeper", "attacker"...

            # Б. Додаємо ключі в маппінг

            # 1. Специфічний ключ позиції (напр. "enemy_goalkeeper")
            pos_key = f"{prefix}{pos_name}"
            if pos_key not in mapping:
                mapping[pos_key] = char

            # 2. Загальний ключ (для старих шаблонів: "enemy_team_character")
            general_key = f"{prefix}team_character"
            if general_key not in mapping:
                mapping[general_key] = char

            # 3. Спеціальні ролі події (хто забив, хто віддав)
            if char == self.scorer:
                mapping["scorer"] = char
            if char == self.assistant:
                mapping["assistant"] = char

        return mapping

    def _get_prefix(self, char: Character) -> str:
        """Повертає 'enemy_', якщо власник персонажа не в атакуючій команді."""
        if not self.attacking_team:
            return ""

        # Перевіряємо по ID власника
        if char.characters_user_id in self.attacking_team.users_match_ids:
            return ""

        return "enemy_"

    def _get_position_name(self, char: Character) -> str:
        """
        Конвертує Enum Position у рядок для шаблону.
        Беремо дані прямо з об'єкта Character.
        """
        if not char.position:
            return "midfielder"  # Дефолт

        pos = char.position

        if pos == Position.GOALKEEPER:
            return "goalkeeper"
        elif pos == Position.DEFENDER:
            return "defender"
        elif pos == Position.MIDFIELDER:
            return "midfielder"
        elif pos == Position.ATTACKER:
            return "attacker"

        return "midfielder"

    def get_available_positions(self) -> set[str]:
        return set(self.custom_mapping.keys())

    def select_template(self) -> Optional[SceneTemplate]:
        available = self.get_available_positions()

        # Фільтруємо: шаблон підходить ТІЛЬКИ якщо у нас є ВСІ необхідні ролі
        valid_templates = [
            tmpl for tmpl in self.scenes
            if all(req_pos in available for req_pos in tmpl.required_positions)
        ]

        if not valid_templates:
            return None

        return random.choice(valid_templates)

    def render(self) -> str:
        template = self.select_template()

        if not template:
            return self._render_fallback()

        return self._fill_template(template.text)

    def _fill_template(self, template_text: str) -> str:
        def get_nick(match) -> str:
            key = match.group(1)
            if key in self.custom_mapping:
                # Беремо ім'я конкретного персонажа (напр. "Lionel Messi", а не юзера)
                return self.custom_mapping[key].name
            return "<i>Гравець</i>"

        # Шукаємо всі входження {key} і замінюємо на імена
        return re.sub(r"\{(\w+?)\}", get_nick, template_text)

    def _render_fallback(self) -> str:
        """Заглушка на випадок, якщо не знайдено жодного шаблону."""
        if self.scorer:
            return f"⚽ <b>{self.scorer.name}</b> забиває важливий гол!"
        elif self.user_enemy:
            # Наприклад, сейв
            return f"🧤 <b>{self.user_enemy.name}</b> рятує ворота в неймовірному стрибку!"

        return "🔥 На полі точиться запекла боротьба! Емоції зашкалюють!"