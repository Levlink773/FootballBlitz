import random
from asyncio import Semaphore
from datetime import datetime, timedelta

from database.models.blitz_team import BlitzTeam
from database.models.character import Position
from database.models.user_bot import UserBot
from .goal_generator import GoalGenerator
from ..constans import TIME_EVENT_DONATE_ENERGY, TIME_BLITZ_FIGHT
from ..entities import BlitzMatchData, MatchTeamBlitz
from ..enum_blitz_match import TypeGoalEvent
from ..message_sender.match_sender import BlitzMatchSender
from ...services.blitz_character_service import BlitzUserService

semaphore_add_key = Semaphore(2)


class BlitzMatch:
    SCORE_POINTS_BY_EVENT = {
        TypeGoalEvent.GOAL: 1,
        TypeGoalEvent.NO_GOAL: 0.25
    }

    def __init__(
            self,
            match_data: BlitzMatchData,
            start_time: datetime
    ) -> None:

        self.match_data = match_data
        self.match_sender = BlitzMatchSender(match_data)
        self.count_goals = self._generate_count_goals()

        end_time = start_time + TIME_BLITZ_FIGHT

        self.goal_generator = GoalGenerator(
            start_time=start_time,
            end_time=end_time,
            count_goals=self.count_goals
        )

    def _generate_count_goals(self) -> int:
        choices = [1] * 29 + [3] * 70 + [5] * 1
        count = random.choice(choices)
        return count

    async def start_match(self) -> tuple[BlitzTeam, BlitzTeam]:
        # await self.match_data.init_teams()

        await self.goal_generator.start()
        await self.match_sender.start_match()
        await self.match_sender.send_participants_match()
        await self.event_watcher()
        winner_team, looser_team = await self.end_match()
        return winner_team.team, looser_team.team

    async def event_watcher(self) -> None:
        event_func: dict[TypeGoalEvent, callable] = {
            TypeGoalEvent.NO_GOAL: self.no_goal_event,
            TypeGoalEvent.PING_DONATE_ENERGY: self.ping_donate_energy_event,
            TypeGoalEvent.GOAL: self.goal_event,
        }

        async for event in self.goal_generator.generate_goals():
            if event is None:
                break
            await event_func[event]()
            for team in self.match_data.all_teams:
                team.anulate_donate_energy()

    async def no_goal_event(self) -> None:
        TYPE_EVENT = TypeGoalEvent.NO_GOAL

        # 1. Атакуюча команда
        attacking_team = random.choice(self.match_data.all_teams)
        defending_team = self.match_data.get_opposite_team(attacking_team.team_id)

        # 2. Вибираємо ПЕРСОНАЖІВ (Character), а не юзерів
        attacker_char = attacking_team.get_character_by_position(Position.ATTACKER) or \
                        attacking_team.get_character_by_position(Position.MIDFIELDER) or \
                        attacking_team.get_random_character()

        defender_char = defending_team.get_character_by_position(Position.GOALKEEPER)
        if not defender_char or random.random() > 0.7:
            defender_char = defending_team.get_character_by_position(Position.DEFENDER) or \
                            defending_team.get_random_character()

        if not attacker_char or not defender_char: return

        # 3. Відправляємо (тепер sender і renderer приймають Character)
        await self.match_sender.send_event_scene(
            goal_event=TYPE_EVENT,
            scorer=attacker_char,  # Передаємо Character
            user_enemy=defender_char,  # Передаємо Character
            users_scene=[]
        )

        # 4. Нарахування балів (потрібно дістати UserBot з Character)
        # Оскільки у нас є characters_user_id, ми можемо нарахувати бали по ID
        await self._add_event_by_id(attacker_char.characters_user_id, 0.25)
        await self._add_event_by_id(defender_char.characters_user_id, 0.25)

    async def ping_donate_energy_event(self) -> None:
        goal_time = (
                datetime.now() + timedelta(seconds=TIME_EVENT_DONATE_ENERGY)
        ).timestamp()
        await self.match_sender.send_ping_donate_energy(int(goal_time))

    async def goal_event(self) -> None:
        goal_team = self.match_data.get_goal_team()
        goal_team.add_goal()
        defending_team = self.match_data.get_opposite_team(goal_team.team_id)

        # Шукаємо бомбардира (Character)
        scorer_char = goal_team.get_character_by_position(Position.ATTACKER) or \
                      goal_team.get_character_by_position(Position.MIDFIELDER) or \
                      goal_team.get_random_character()

        if not scorer_char: return

        # Шукаємо асистента (Character)
        assistant_char = goal_team.get_character_by_position(Position.MIDFIELDER, exclude_chars=[scorer_char]) or \
                         goal_team.get_character_by_position(Position.ATTACKER, exclude_chars=[scorer_char]) or \
                         goal_team.get_random_character(exclude_chars=[scorer_char])

        # Шукаємо жертву (Character)
        enemy_char = defending_team.get_character_by_position(Position.GOALKEEPER)
        if random.random() > 0.7:
            enemy_char = defending_team.get_character_by_position(Position.DEFENDER)
        if not enemy_char: enemy_char = defending_team.get_random_character()

        await self.match_sender.send_event_scene(
            goal_event=TypeGoalEvent.GOAL,
            scorer=scorer_char,
            assistant=assistant_char,
            user_enemy=enemy_char,
            goal_team=goal_team
        )

        # Нарахування балів власнику персонажа
        await self._add_event_by_id(scorer_char.characters_user_id, 1)
        await BlitzUserService.add_goal_to_user(user_id=scorer_char.characters_user_id)

        if assistant_char:
            await self._add_event_by_id(assistant_char.characters_user_id, 0.75)

    # Допоміжний метод для нарахування балів по ID
    async def _add_event_by_id(self, user_id: int, score_add: float):
        await BlitzUserService.add_score_to_user(user_id=user_id, add_score=score_add)

    async def _add_event(
            self,
            user: UserBot,
            score_add: float = 0.25
    ) -> None:
        await BlitzUserService.add_score_to_user(
            user_id=user.user_id,
            add_score=score_add
        )

    async def end_match(self) -> tuple[MatchTeamBlitz, MatchTeamBlitz]:
        """
        Завершує матч, визначає переможця та відправляє фінальне повідомлення.
        """
        # 1. Визначаємо переможця (по голах або силі)
        winner_match_team, required_consider_power = await self.match_data.get_winner_team()

        # 2. Відправляємо повідомлення про кінець матчу
        await self.match_sender.send_end_match(winner_match_team, required_consider_power)

        # 3. Визначаємо команду, що програла
        lose_team = self.match_data.get_opposite_team(winner_match_team.team_id)

        return winner_match_team, lose_team
