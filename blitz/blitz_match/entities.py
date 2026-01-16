import random
from dataclasses import dataclass, field
from typing import Optional, Tuple, List

from database.models.blitz_character import BlitzUser
from database.models.blitz_team import BlitzTeam
from database.models.character import Position, Character
from database.models.user_bot import UserBot
from logging_config import logger
from .utils import (
    calculate_bonus_donate_energy
)
from ..services.blitz_character_service import BlitzUserService
from ..services.blitz_team_service import BlitzTeamService


@dataclass
class MatchTeamBlitz:
    team_id: int
    goals: int = 0

    episode_donate_energy: int = 0

    team: Optional[BlitzTeam] = None
    users_in_match: set[UserBot] = field(default_factory=set)

    text_is_send_epizode_donate_energy: bool = False

    async def init_data(self):
        self.team: BlitzTeam = await BlitzTeamService.get_by_id(team_id=self.team_id)
        blitzs_users: list[BlitzUser] = self.team.users
        for blitz_user in blitzs_users:
            user = await BlitzUserService.get_user_from_blitz_user(blitz_user)
            self.users_in_match.add(user)

    @property
    def team_power(self) -> int:
        return sum(
            user.team_power
            for user in self.users_in_match
        )

    @property
    def team_name(self) -> str:
        if not self.team:
            return "Team Unknown"
        return self.team.name

    @property
    def users_match_ids(self) -> list[int]:
        return [
            user.user_id
            for user in self.users_in_match
        ]

    def get_user_by_power(
            self,
            no_user: Optional[UserBot] = None
    ) -> Optional[UserBot]:
        if not self.users_in_match:
            return None

        filtered_users = [
            user for user in self.users_in_match
            if not no_user or user.user_id != no_user.user_id
        ]

        if not filtered_users:
            return None

        # Теперь длины совпадают
        weights = [user.team_power for user in filtered_users]

        selected_user = random.choices(filtered_users, weights=weights, k=1)[0]
        return selected_user

    def is_user_in_team(self, user: UserBot) -> bool:
        characters_ids = [
            user.user_id
            for user in self.users_in_match
        ]
        return user.user_id in characters_ids

    def add_goal(self) -> None:
        self.goals += 1

    def anulate_donate_energy(self) -> None:
        self.episode_donate_energy = 0
        self.text_is_send_epizode_donate_energy = False

    def get_user_by_position(self, position: Position, exclude_users: list[UserBot] = []) -> Optional[UserBot]:
        candidates = []
        for user in self.users_in_match:
            if user in exclude_users:
                continue
            # Проверяем позицию главного персонажа пользователя
            # Предполагаем, что у UserBot есть main_character и у него поле position
            if user.main_character and user.main_character.position == position:
                candidates.append(user)

        if not candidates:
            return None

        # Можно выбирать случайно или по силе
        # weights = [c.main_character.power for c in candidates]
        return random.choice(candidates)

    # 👇 НОВЫЙ МЕТОД: Получить любого игрока (как раньше, но с исключением)
    def get_random_user(self, exclude_users: list[UserBot] = []) -> Optional[UserBot]:
        candidates = [u for u in self.users_in_match if u not in exclude_users]
        if not candidates:
            return None
        # Выбираємо взвешенно по силе
        weights = [u.team_power for u in candidates]
        return random.choices(candidates, weights=weights, k=1)[0]

        # 👇 НОВИЙ МЕТОД: Шукаємо серед усіх персонажів команди

    def get_character_by_position(self, position: Position, exclude_chars: List[Character] = []) -> Optional[
        Character]:
        candidates = []
        for user in self.users_in_match:
            # Перебираємо ВСІХ персонажів користувача
            for char in user.characters:
                if char in exclude_chars:
                    continue
                # Якщо позиція збігається і гравець "в основі" (має squad_position)
                if char.position == position and char.squad_position is not None:
                    candidates.append(char)

        if not candidates:
            # Фолбек: якщо немає конкретної позиції, шукаємо будь-кого (хто не в exclude)
            return self.get_random_character(exclude_chars)

        # Вибираємо випадково, але з урахуванням сили
        weights = [c.power for c in candidates]
        return random.choices(candidates, weights=weights, k=1)[0]

        # 👇 НОВИЙ МЕТОД: Випадковий персонаж з усієї команди

    def get_random_character(self, exclude_chars: List[Character] = []) -> Optional[Character]:
        candidates = []
        for user in self.users_in_match:
            for char in user.characters:
                # Беремо тільки тих, хто в основі (squad_position не None)
                if char not in exclude_chars and char.squad_position is not None:
                    candidates.append(char)

        if not candidates:
            return None

        weights = [c.power for c in candidates]
        return random.choices(candidates, weights=weights, k=1)[0]


@dataclass
class BlitzMatchData:
    blitz_match_id: str
    stage: int

    first_team: MatchTeamBlitz
    second_team: MatchTeamBlitz

    @property
    def first_team_id(self) -> int:
        return self.first_team.team_id

    @property
    def second_team_id(self) -> int:
        return self.second_team.team_id

    async def init_teams(self) -> None:
        await self.first_team.init_data()
        await self.second_team.init_data()

    @property
    def all_teams(self) -> list[MatchTeamBlitz]:
        return [
            self.first_team,
            self.second_team
        ]

    @property
    def all_users(self) -> list[UserBot]:
        return [
            user for team in self.all_teams
            for user in team.users_in_match
        ]

    @property
    def all_user_ids_in_match(self) -> list[int]:
        return [
            user.user_id
            for team in self.all_teams
            for user in team.users_in_match
        ]

    def get_chance_teams(self) -> Tuple[int, int]:
        """
        Get the chance of teams to score a goal.
        :return: Tuple of chances for the first and second teams
        """
        first_team_chance = self.power_first_team / self.total_power
        second_team_chance = self.power_second_team / self.total_power

        first_team_chance = round(first_team_chance, 6)
        second_team_chance = round(second_team_chance, 6)

        return first_team_chance, second_team_chance

    def get_goal_team(self) -> MatchTeamBlitz:
        values = [
            self.power_first_team,
            self.power_second_team
        ]
        return random.choices(self.all_teams, weights=values, k=1)[0]

    def get_opposite_team(self, team_id: int) -> MatchTeamBlitz:

        return (
            self.second_team
            if team_id == self.first_team.team_id
            else self.first_team
        )

    async def get_winner_team(self) -> tuple[MatchTeamBlitz, bool]:
        """
        Get the winner team of the match.
        :return: The winner team
        """
        if self.first_team.goals > self.second_team.goals:
            return self.first_team, False
        elif self.second_team.goals > self.first_team.goals:
            return self.second_team, False
        else:
            first_team_score = await BlitzTeamService.get_score_team(self.first_team.team.id)
            first_team_power = self.power_first_team + first_team_score
            second_team_score = await BlitzTeamService.get_score_team(self.second_team.team.id)
            second_team_power = self.power_second_team + second_team_score
            if first_team_power > second_team_power:
                return self.first_team, True
            elif second_team_power > first_team_power:
                return self.second_team, True
            return random.choices([self.first_team, self.second_team]), True

    @property
    def power_first_team(self) -> int:
        base_power = self.first_team.team_power
        logger.info(f"Donate energy ft: {self.first_team.episode_donate_energy}")
        donate_energy_bonus = calculate_bonus_donate_energy(
            donate_energy=self.first_team.episode_donate_energy,
            power_club=self.first_team.team_power,
            power_opponent_club=self.second_team.team_power,
        )
        power = (
                base_power +
                donate_energy_bonus
        )
        return power

    @property
    def power_second_team(self) -> int:
        base_power = self.second_team.team_power
        logger.info(f"Donate energy st: {self.second_team.episode_donate_energy}")
        donate_energy_bonus = calculate_bonus_donate_energy(
            donate_energy=self.second_team.episode_donate_energy,
            power_club=self.second_team.team_power,
            power_opponent_club=self.first_team.team_power,
        )
        power = (
                base_power +
                donate_energy_bonus
        )
        return power

    @property
    def total_power(self) -> int:
        return self.power_first_team + self.power_second_team
