import asyncio

from blitz.blitz_match.constans import END_BLITZ_PHOTO, BLITZ_STAGES_PATCH
from blitz.services.blitz_team_service import BlitzTeamService
from blitz.services.message_sender.blitz_sender import send_message_all_users
from database.models.blitz_team import BlitzTeam
from database.models.user_bot import UserBot


class BlitzAnnounceService:
    PARSE_MODE = 'HTML'

    @classmethod
    async def announce_matchups(cls, pairs: list[tuple[BlitzTeam, BlitzTeam]]):
        if not pairs:
            raise ValueError("На жаль, пар для матчів не знайдено.")

        stage_map = {
            32: ("1/32 фіналу", BLITZ_STAGES_PATCH[4]),
            16: ("1/16 фіналу", BLITZ_STAGES_PATCH[4]),
            8: ("1/8 фіналу", BLITZ_STAGES_PATCH[0]),
            4: ("1/4 фіналу", BLITZ_STAGES_PATCH[1]),
            2: ("1/2 фіналу", BLITZ_STAGES_PATCH[2]),
            1: ("Фінал", BLITZ_STAGES_PATCH[3]),
        }
        stage = stage_map.get(len(pairs), ("Наступний раунд", BLITZ_STAGES_PATCH[0]))

        lines = [f"⚽️ <b>Через хвилину починається бліц раунд ({stage[0]})!</b> ⚽️", ""]
        for idx, (team_a, team_b) in enumerate(pairs, start=1):
            lines.append(f"🔸 Матч {idx}: <b>{team_a.name}</b> vs <b>{team_b.name}</b>")
        lines.append("")
        lines.append("Нехай переможе найсильніший! 💥")

        text = "\n".join(lines)
        # 👥 Собираем всех участников из команд
        involved_characters = []
        for team_a, team_b in pairs:
            users = await BlitzTeamService.get_user_from_blitz_team(team_a)
            users1 = await BlitzTeamService.get_user_from_blitz_team(team_b)
            involved_characters.extend(users + users1)

        # 🧹 Убираем дубликаты по ID (если надо)
        unique_user = {user.user_id: user for user in involved_characters}.values()
        asyncio.create_task(send_message_all_users(list(unique_user), text, photo_path=stage[1]))
        return text

    @classmethod
    async def announce_end(cls, users: list[UserBot], final_winner: BlitzTeam, final_looser: BlitzTeam, reward_energy: int) -> str:
        res_winner, res_looser = await asyncio.gather(
            BlitzTeamService.get_user_from_blitz_team(final_winner),
            BlitzTeamService.get_user_from_blitz_team(final_looser)
        )
        ch_win_first = res_winner[0].main_character.name or res_winner[0].user_name
        ch_loose_first = res_looser[0].main_character.name or res_looser[0].user_name
        end_text = f"""
🏆 <b>Результати блиц-турніру!</b>

🥇 Команда <b>«{final_winner.name}»</b> здобуває 1 місце та отримує середній лутбокс! Вітаємо {ch_win_first} — справжні чемпіони! 🎉

🥈 Команда <b>«{final_looser.name}»</b> посідає 2 місце та отримує маленький лутбокс — чудова гра від {ch_loose_first}! 👏

⚡ Усі учасники отримують +{reward_energy} енергії! Дякуємо за гру — до наступного блиц-турніру! 💪
"""
        await send_message_all_users(users, end_text, photo_path=END_BLITZ_PHOTO)
        return end_text

    @classmethod
    async def announce_round_results(cls, winners: list[BlitzTeam], losers: list[BlitzTeam], reward_energy: int) -> None:
        if not winners and not losers:
            raise ValueError("Немає даних про результати раунду.")

        next_stage_map = {
            64: "1/32 фіналу",
            32: "1/16 фіналу",
            16: "1/8 фіналу",
            8: "1/4 фіналу",
            4: "1/2 фіналу",
            2: "ФІНАЛ 🏆",
            1: "Матч за 3-є місце"
        }
        next_stage = next_stage_map.get(len(winners), "Наступний раунд")

        lines = [f"🔔 <b>Результати раунду!</b> 🔔", ""]
        if losers:
            lines.append("🚫 <b>Вибули:</b>")
            for team in losers:
                lines.append(f"- {team.name}")
            lines.append("")
        if winners:
            lines.append("✅ <b>Пройшли далі:</b>")
            for team in winners:
                lines.append(f"- {team.name}")
            lines.append("")
        lines.append(f"🔥 <b>Наступний етап: {next_stage}</b> 🔥")

        text = "\n".join(lines)
        involved_characters = []
        for team in winners + losers:
            users = await BlitzTeamService.get_user_from_blitz_team(team)
            involved_characters.extend(users)
        await send_message_all_users(involved_characters, text)

        # Нотифікація команд індивідуально
        for w in winners:
            await cls.notify_team_advancement(w, next_stage)
        for l in losers:
            await cls.notify_team_elimination(l, reward_energy)

    @classmethod
    async def notify_team_advancement(cls,
                                      team: BlitzTeam,
                                      next_stage: str):
        users = await BlitzTeamService.get_user_from_blitz_team(team)
        prep_text = 'раунду, який вирішить долю вашої команди у цьому Бліц турнірі 🔥' if next_stage == 'ФІНАЛ 🏆' else 'наступного раунду'
        text = (
            f"🎉 Ваша команда <b>{team.name}</b> проходить у <b>{next_stage}</b>! 🎉\n"
            f"У вас є 60 секунд на підготовку до {prep_text}. ⏱️"
        )
        await send_message_all_users(users, text)

    @classmethod
    async def notify_team_elimination(cls,
                                      team: BlitzTeam, reward_energy: int):
        users = await BlitzTeamService.get_user_from_blitz_team(team)
        text = (
            f"⚠️ Ваша команда <b>{team.name}</b> не пройшла далі цього раунду. ⚠️\n"
            f"Дякуємо за участь! Наприкінці турніру вам буде нараховано +{reward_energy} енергії."
        )
        await send_message_all_users(users, text)
