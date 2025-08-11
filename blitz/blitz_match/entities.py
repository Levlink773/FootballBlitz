import random
from dataclasses import dataclass, field
from typing import Optional, Tuple

from database.models.blitz_character import BlitzUser
from database.models.blitz_team import BlitzTeam
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
            character.power
            for user in self.users_in_match
            for character in user.characters
        )

    @property
    def team_name(self) -> str:
        if not self.team:
            return "Team Unknown"
        return self.team.name

    @property
    def users_match_ids(self) -> list[int]:
        return [
            user.id
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

        weights = [
            character.power
            for user in filtered_users
            for character in user.characters
        ]

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
            donate_energy = self.first_team.episode_donate_energy,
            power_club = self.first_team.team_power,
            power_opponent_club = self.second_team.team_power,
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
            donate_energy = self.second_team.episode_donate_energy,
            power_club = self.second_team.team_power,
            power_opponent_club = self.first_team.team_power,
        )
        power = (
            base_power +
            donate_energy_bonus
        )
        return power

    @property
    def total_power(self) -> int:
        return self.power_first_team + self.power_second_team
