import asyncio
import random
from datetime import datetime, timedelta

from blitz.blitz_match.core.manager import BlitzStateData, BlitzState
from blitz.blitz_match.core.match import BlitzMatch
from blitz.blitz_match.core.redis_manager import TeamBlitzMatchManager
from blitz.blitz_match.core.manager import TeamBlitzMatchManager as TBMatchManager
from blitz.blitz_match.entities import MatchTeamBlitz, BlitzMatchData
from blitz.blitz_match.utils import generate_blitz_match_id
from blitz.blitz_reminder import BlitzReminder
from blitz.enum_blitz import BlitzStatus
from blitz.services.blitz_announce_service import BlitzAnnounceService
from blitz.services.blitz_reward_service import BlitzRewardService, RewardEnergyBlitzTeam
from blitz.services.blitz_service import BlitzService
from blitz.services.blitz_team_service import BlitzTeamService
from blitz.services.message_sender.blitz_sender import send_message
from blitz.utils import BlitzData
from database.models.blitz import Blitz
from database.models.blitz_character import BlitzUser
from database.models.blitz_team import BlitzTeam
from database.models.user_bot import UserBot
from logging_config import logger
from services.user_service import UserService
from webapp.fastapi.publisher import publish_match_state, publish_all_matches_state, make_payloads_for_users, \
    publish_batch, _delayed_publish, _delayed_publish_all_match


class StartBlitzs:
    @staticmethod
    async def start(blitzs_data: list[BlitzData]):
        """
        Запускает цикл по расписанию блицтурниров.
        Принимает список BlitzData (start_time: time, stages_of_final: int).
        """
        StartBlitzs._validate_blitzs_data(blitzs_data)

        while True:
            now = datetime.now()
            next_start_datetime = None
            selected_blitz_data: BlitzData | None = None

            for bd in sorted(blitzs_data, key=lambda x: (x.start_time.hour, x.start_time.minute)):
                potential_start = datetime.combine(now.date(), bd.start_time)
                if potential_start < now:
                    potential_start += timedelta(days=1)

                if next_start_datetime is None or potential_start < next_start_datetime:
                    next_start_datetime = potential_start
                    selected_blitz_data = bd

            logger.info(f"Планирую следующий блиц на {next_start_datetime} (стадий: {selected_blitz_data.blitz_pack.stages_of_final})")
            await StartBlitz(
                start_datetime=next_start_datetime,
                blitz_data=selected_blitz_data
            ).start()
            await asyncio.sleep(1)

    @staticmethod
    def _validate_blitzs_data(blitzs_data: list[BlitzData]):
        if not blitzs_data:
            raise ValueError("Нужно передать хотя бы один BlitzData")

        # Проверка stages_of_final > 1 для каждого элемента
        for bd in blitzs_data:
            if bd.blitz_pack.stages_of_final <= 1:
                raise ValueError(f"Для времени {bd.start_time} количество стадий должно быть > 1")

        # Проверка интервалов между временами (не менее 1 часа), включая переход через полночь
        times_sorted = sorted([bd.start_time for bd in blitzs_data])
        minutes = [t.hour * 60 + t.minute for t in times_sorted]

        for i in range(1, len(minutes)):
            delta = minutes[i] - minutes[i - 1]
            if delta < 60:
                raise ValueError(
                    f"Времена {times_sorted[i - 1]} и {times_sorted[i]} находятся ближе чем за 1 час"
                )

        if len(minutes) >= 2:
            wrap_around_delta = (1440 - minutes[-1]) + minutes[0]
            if wrap_around_delta < 60:
                raise ValueError(
                    f"Времена {times_sorted[-1]} и {times_sorted[0]} (через полночь) находятся ближе чем за 1 час"
                )


class StartBlitz:
    def __init__(self,
                 start_datetime: datetime,
                 blitz_data: BlitzData,
                 ):
        self.start_datetime = start_datetime.replace(microsecond=0)
        if blitz_data.blitz_pack.stages_of_final <= 1:
            raise ValueError("count of final must be greater than 1")
        self.stages_of_final = blitz_data.blitz_pack.stages_of_final
        self.necessary_users = 2 ** blitz_data.blitz_pack.stages_of_final
        self.register_photo_path = blitz_data.path_register_image
        self.registration_cost = blitz_data.registration_cost
        self.blitz_pack = blitz_data.blitz_pack
        self.blitz_reward_pack = blitz_data.blitz_pack.blitz_reward_pack

    @staticmethod
    async def _start_blitz_match(teams: tuple[BlitzTeam, BlitzTeam], stage: int, text_init: str) -> tuple[BlitzTeam, BlitzTeam]:
        first_team_id = teams[0].id
        second_team_id = teams[1].id
        logger.info(f"teams for match: {teams}")
        match_team_first = MatchTeamBlitz(team_id=first_team_id)
        match_team_second = MatchTeamBlitz(team_id=second_team_id)
        blitz_match_id = generate_blitz_match_id(first_team_id, second_team_id)
        logger.info(f"blitz_match_id: {blitz_match_id}, stage: {stage}")
        match_data = BlitzMatchData(
            blitz_match_id=blitz_match_id,
            stage=stage,
            first_team=match_team_first,
            second_team=match_team_second
        )
        await match_data.init_teams()
        await TeamBlitzMatchManager.add_match(
            match_data,
            BlitzStateData(state=BlitzState.STARTED, message=text_init)
        )
        TBMatchManager.add_match(match_data, BlitzStateData(state=BlitzState.STARTED, message=text_init))
        await publish_match_state(match_data.blitz_match_id)
        payloads = make_payloads_for_users(
            "show_alert",
            teams[0].users + teams[1].users,
            payload_factory=lambda u: {
                "message": "Бліц турнір почався!"
            }
        )

        # 2а) Лучший вариант — отправить пакетами через pipeline
        results = await publish_batch(payloads, batch_size=32)
        logger.info("publish_batch results: sent=%s total=%s", sum(1 for r in results if r), len(results))

        blitz_match = BlitzMatch(match_data, datetime.now())
        await asyncio.sleep(60)
        winner_team, looser_team = await blitz_match.start_match()
        winner_user: BlitzUser = winner_team.users[0]
        looser_user: BlitzUser = looser_team.users[0]
        await UserService.add_final_count_matches_winner(winner_user.user_id)
        await UserService.add_final_count_matches(winner_user.user_id)
        await UserService.add_final_count_matches(looser_user.user_id)
        return winner_team, looser_team

    async def reward_rating(self, final_winner: BlitzTeam, final_looser: BlitzTeam, pure_semifinal_losers: list[BlitzTeam]):
        await asyncio.sleep(3)
        await UserService.add_rating(
            user_id=final_winner.users[0].user_id,
            rating_to_add=3
        )
        # Епічний фініш повідомлення про енергію
        await send_message(
            user=final_winner.users[0],
            text=f"📊 <b>+3 очок рейтингу</b> за результат у турнірі Football Bliz! "
                 "Ваші досягнення вже враховано у загальному рейтингу гравців. "
                 "Продовжуйте боротися за вершину турнірної таблиці! 🏆"
        )
        await UserService.add_rating(
            user_id=final_looser.users[0].user_id,
            rating_to_add=2
        )
        # Епічний фініш повідомлення про енергію
        await send_message(
            user=final_looser.users[0],
            text=f"📊 <b>+2 очок рейтингу</b> за результат у турнірі Football Bliz! "
                 "Ваші досягнення вже враховано у загальному рейтингу гравців. "
                 "Продовжуйте боротися за вершину турнірної таблиці! 🏆"
        )
        for semi_team in pure_semifinal_losers:
            await UserService.add_rating(
                user_id=semi_team.users[0].user_id,
                rating_to_add=1
            )
            # Епічний фініш повідомлення про енергію
            await send_message(
                user=semi_team.users[0],
                text=f"📊 <b>+1 очок рейтингу</b> за результат у турнірі Football Bliz! "
                     "Ваші досягнення вже враховано у загальному рейтингу гравців. "
                     "Продовжуйте боротися за вершину турнірної таблиці! 🏆"
            )

    async def finish_match(self, final_winner: BlitzTeam, final_looser: BlitzTeam):
        """Завершает блиц: отправляет событие финалистам и очищает состояние матчей."""
        # Собираем всех пользователей из команд финалистов
        finalist_users = final_winner.users + final_looser.users
        if finalist_users:
            logger.info(f"Отправка финального события 'remove_user' {len(finalist_users)} финалистам.")
            # Формируем и отправляем событие для перенаправления на клиенте
            payloads = make_payloads_for_users(
                event_type="remove_user",
                users=finalist_users,
                payload_factory=lambda u: {
                    "message": "Вітаємо. Енергія та рейтинг начисленно, лутбокси можете забрати у телеграмі!",
                }
            )
            asyncio.create_task(_delayed_publish(payloads))

        await TeamBlitzMatchManager.clear_matches()
        TBMatchManager.clear_matches()
        logger.info("Состояние матчей очищено.")

    async def _start_blitz(self, blitz_id: int):
        teams: list[BlitzTeam] = await BlitzTeamService.create_teams(
            team_count=self.necessary_users,
            blitz_id=blitz_id
        )
        all_teams = teams.copy()
        for team in all_teams:
            user = team.users[0]
            if not user.user_id:
                logger.error("WTF? user must be have attribute 'user_id'")
                continue
            await UserService.add_final_count_blitz(user_id=user.user_id)
        logger.info("Teams created")
        random.shuffle(teams)
        # await BlitzTeamSender.send_teams_message(teams)
        logger.info("Teams sended")
        users: list[UserBot] = await BlitzService.get_users_from_blitz_users(blitz_id)
        reward_energy_garanted = 50
        reward_patch = self.blitz_reward_pack.reward_guaranteed[0]
        if isinstance(reward_patch, RewardEnergyBlitzTeam):
            reward_energy_garanted = reward_patch.reward_exp
        semifinal_teams = []
        while len(teams) > 2:
            if len(teams) == 4:
                semifinal_teams = teams.copy()
            pair_teams = BlitzTeamService.pair_teams(teams)
            logger.info(f"pair_teams: {pair_teams} for stage {len(pair_teams)}")
            text = await BlitzAnnounceService.announce_matchups(pair_teams)
            tasks = [
                StartBlitz._start_blitz_match((first, second), len(pair_teams), text)
                for first, second in pair_teams
            ]
            logger.info(f"tasks: {tasks}")
            logger.info("blitz match started")
            results_match = await asyncio.gather(*tasks)
            await TeamBlitzMatchManager.clear_matches()
            logger.info(f"blitz match finish: {results_match}")
            looser_teams_stage = [looser for _, looser in results_match]
            winner_teams_stage = [winner for winner, _ in results_match]
            logger.info(f"winner_teams_stage: {winner_teams_stage}")
            # --- ШАГ 3: Отправляем событие 'remove_user' проигравшим в раунде ---
            loser_users = [user for team in looser_teams_stage for user in team.users]
            if loser_users:
                logger.info(f"Отправка события 'remove_user' {len(loser_users)} выбывшим пользователям.")
                # Формируем payload для каждого выбывшего пользователя
                payloads = make_payloads_for_users(
                    event_type="remove_user",
                    users=loser_users,
                    payload_factory=lambda u: {
                        "message": "Ви вибули. Нагороди Ви отримаєте по завершеню турніра!"
                    }
                )
                # Отправляем в фоне, чтобы не блокировать основной процесс
                asyncio.create_task(_delayed_publish(payloads))
            # --- Конец нового блока ---
            asyncio.create_task(
                BlitzAnnounceService.announce_round_results(winner_teams_stage, looser_teams_stage, reward_energy_garanted))
            teams = winner_teams_stage
        pair_teams = [(teams[0], teams[1])]
        logger.info(f"pair_teams final: {pair_teams}")
        text_init = await BlitzAnnounceService.announce_matchups(pair_teams)
        logger.info("Blitz match final started")
        final_winner, final_looser = await StartBlitz._start_blitz_match(pair_teams[0], 1, text_init)
        logger.info(f"final_winner: {final_winner}")
        pure_semifinal_losers = [
            team for team in semifinal_teams
            if team.id not in {final_winner.id, final_looser.id}
        ]
        bz_reward = BlitzRewardService.reward_blitz_team
        text = await BlitzAnnounceService.announce_end(users, final_winner, final_looser, reward_energy_garanted)

        await TeamBlitzMatchManager.set_all_matches_state(
            BlitzStateData(state=BlitzState.FINISHED, message=text),
        )
        asyncio.create_task(_delayed_publish_all_match())
        await bz_reward(self.blitz_reward_pack.reward_winner, final_winner)
        await bz_reward(self.blitz_reward_pack.reward_final_looser, final_looser)
        for semi_team in pure_semifinal_losers:
            await bz_reward(self.blitz_reward_pack.reward_semi_final, semi_team)
        await asyncio.gather(
            *[
                bz_reward(self.blitz_reward_pack.reward_guaranteed, team)
                for team in all_teams
            ]
        )
        # --- ИСПРАВЛЕННЫЙ КОД ---
        logger.info("Reward blitz match")

        # Создаем список всех финальных задач, которые должны быть выполнены до очистки
        final_tasks = [
            self.reward_rating(final_winner, final_looser, pure_semifinal_losers),
            self.finish_match(final_winner, final_looser)
            # Добавьте сюда другие асинхронные задачи, если они есть
        ]

        # Ждем завершения ВСЕХ финальных задач
        await asyncio.gather(*final_tasks)

        logger.info("All final tasks are completed. Finishing blitz.")
        return final_winner

    async def start(self) -> BlitzStatus:
        blitz: Blitz = await BlitzService.get_or_create_blitz_by_start(
            self.start_datetime,
            self.registration_cost,
            self.blitz_pack.blitz_type
        )
        try:
            status = await BlitzReminder(
                blitz=blitz,
                registration_cost=self.registration_cost,
                remind_for_simple_users=0 if self.blitz_pack.vip_blitz else 20,
                remind_for_vip_users=30,
                necessary_count_users=self.necessary_users,
                register_photo_path=self.register_photo_path
            ).remind()
            if not status:
                logger.warn("Блиц турнир отменен!")
                return BlitzStatus.CANCELED
            logger.info("🏁 Блиц начинается!")
            await self._start_blitz(blitz.id)
            logger.info("🏁 Блиц завершен!")
            return BlitzStatus.FINISH
        finally:
            TBMatchManager.clear_matches()
            await TeamBlitzMatchManager.clear_matches()
            await BlitzService.remove_all_blitzes()
            await BlitzTeamService.remove_all_blitz_teams()
            await UserService.delete_all_bots()
            logger.info("🏁 Блиц удален!")
