import asyncio
import random
import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select, update, delete, func, desc

from blitz.blitz_match.core.manager import TeamBlitzMatchManager as TBMatchManager, BlitzStateData, BlitzState
from blitz.blitz_match.core.redis_manager import TeamBlitzMatchManager
from blitz.blitz_match.core.match import BlitzMatch
from blitz.blitz_match.entities import BlitzMatchData, MatchTeamBlitz
from blitz.blitz_match.utils import generate_blitz_match_id
from blitz.services.blitz_team_service import BlitzTeamService
from database.models.blitz import Blitz, BlitzType, BlitzGroup
from database.models.blitz_character import BlitzUser
from database.models.blitz_team import BlitzTeam
from database.models.league_tournament import (
    LeagueTournament, LeagueTournamentStatus, LeagueParticipant, LeagueFixture,
)
from database.models.user_bot import UserBot, STATUS_USER_REGISTER
from database.session import get_session
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from blitz.services.message_sender.blitz_sender import send_message
from logging_config import logger
from services.character_service import CharacterService
from services.user_service import UserService
from database.models.character import Position
from webapp.fastapi.publisher import publish_match_state, make_payload, publish_batch, get_redis

# --- Constants ---
ENERGY_COST = 20
MAX_PARTICIPANTS = 8
TOTAL_ROUNDS = 7
POINTS_WIN = 3
POINTS_DRAW = 1
POINTS_LOSS = 0
ROUND_START_HOURS = [10, 12, 14, 16, 18, 20, 22]  # Kyiv time
KYIV_TZ = ZoneInfo("Europe/Kyiv")

# Redis key
ACTIVE_TOURNAMENT_KEY = "league_tournament:active"

# Sentinel Blitz ID — set during startup
_league_sentinel_id: int | None = None

# Bot user_ids tracked per tournament cycle (for scoped cleanup)
_bot_user_ids: list[int] = []

# Bot team names — pool large enough to avoid duplicates for 7 bots max
_BOT_TEAM_NAMES = [
    "Liga FC", "United Stars", "Dynamo Bots", "Academy XI",
    "Reserve FC", "Prospect United", "League Masters", "Bot Rangers",
    "Phoenix FC", "Storm City", "Fortuna XI", "Iron Wolves",
    "Shadow FC", "Nova United", "Titan Stars", "Cobalt FC",
]
_used_bot_names: list[str] = []

WEBAPP_BASE = "https://football-blitz.online"

_LEAGUE_REGISTRATION_TEMPLATES = [
    """⚽ <b>ЩОДЕННА ЛІГА ВІДКРИТА!</b>

🏟 Реєстрація на сьогоднішній турнір розпочалась!
🔋 Вартість участі: {energy_cost} енергії
👥 Максимум {max_participants} учасників — поспішай!

Натисни кнопку нижче, щоб зареєструватися! 👇""",

    """🏆 <b>ЛІГА ДНЯ — РЕЄСТРАЦІЯ ВІДКРИТА!</b>

⚽ 7 турів, 4 матчі за тур — покажи свою силу!
🔋 Участь: {energy_cost} енергії
👥 Місць: {max_participants}

Приєднуйся зараз! 👇""",

    """📣 <b>УВАГА! ЩОДЕННА ЛІГА ЧЕКАЄ!</b>

🏟 Сьогодні новий турнір — 7 раундів чистого футболу!
🔋 Вхід: {energy_cost} енергії
🏅 Топ-3 отримують нагороди!

Тисни та реєструйся! 👇""",

    """⚡ <b>ЛІГА СТАРТУЄ СЬОГОДНІ!</b>

⚽ Реєстрація відкрита — збери команду та вперед!
🔋 Ціна: {energy_cost} енергії
👥 Вільних місць: {max_participants}

Не пропусти — натискай! 👇""",

    """🔥 <b>ЩОДЕННА ЛІГА — ВХІД ВІЛЬНИЙ!</b>

🏟 Турнір дня вже чекає на учасників!
🔋 Всього {energy_cost} енергії за участь
🏆 Нагороди для топ-3 гравців!

Реєструйся прямо зараз! 👇""",
]


_LEAGUE_REMINDER_TEMPLATES = [
    """⏰ <b>РЕЄСТРАЦІЯ ЗАКРИВАЄТЬСЯ ЧЕРЕЗ 30 ХВИЛИН!</b>

⚽ Денна ліга — останній шанс приєднатися!
🔋 Вартість: {energy_cost} енергії
👥 Вільних місць: ще є!

Не пропусти — натискай! 👇""",

    """🔔 <b>НАГАДУВАННЯ: ЛІГА ЗАКРИВАЄТЬСЯ О 10:00!</b>

⚽ Залишилось 30 хвилин на реєстрацію!
🔋 Участь: {energy_cost} енергії
🏅 Топ-3 отримують нагороди!

Встигни зареєструватися! 👇""",

    """⚠️ <b>ОСТАННІЙ ШАНС — ДЕННА ЛІГА!</b>

⏰ Реєстрація закривається о 10:00!
🔋 Всього {energy_cost} енергії за участь
🏆 Нагороди для найкращих!

Приєднуйся, поки не пізно! 👇""",
]


async def _notify_league_registration_reminder(tournament_id: int):
    """Send a reminder notification 30 minutes before registration closes."""
    r = get_redis()
    guard_key = f"league_tournament:reminder:{tournament_id}"

    already_sent = await r.get(guard_key)
    if already_sent:
        logger.info("League reminder already sent for tournament %s, skipping", tournament_id)
        return

    await r.set(guard_key, "1", ex=86400)

    users = await UserService.get_all_users_where_end_register()
    if not users:
        return

    eligible = [u for u in users if not u.is_bot and not u.disable_spam]
    logger.info("League reminder: sending to %d eligible users (tournament %s)", len(eligible), tournament_id)

    text = random.choice(_LEAGUE_REMINDER_TEMPLATES).format(
        energy_cost=ENERGY_COST,
    )

    sent_count = 0
    for user in eligible:
        try:
            markup = InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(
                    text="⚽ Зареєструватися",
                    web_app=WebAppInfo(url=f"{WEBAPP_BASE}/?user_id={user.user_id}")
                )
            ]])
            await send_message(user, text, reply_markup=markup)
            sent_count += 1
        except Exception as e:
            logger.error("League reminder failed for user %s: %s", user.user_id, e)

    logger.info("League reminder sent to %d/%d users", sent_count, len(eligible))


async def _notify_league_registration(tournament_id: int):
    """Send a one-time Telegram notification about league registration to all eligible users."""
    r = get_redis()
    guard_key = f"league_tournament:notified:{tournament_id}"

    # Redis guard — don't re-send on server restart
    already_sent = await r.get(guard_key)
    if already_sent:
        logger.info("League notification already sent for tournament %s, skipping", tournament_id)
        return

    # Mark as sent first (prevent race conditions on multi-process)
    await r.set(guard_key, "1", ex=86400)

    users = await UserService.get_all_users_where_end_register()
    if not users:
        logger.info("League notification: no registered users found")
        return

    eligible = [u for u in users if not u.is_bot and not u.disable_spam]
    logger.info("League notification: sending to %d eligible users (tournament %s)", len(eligible), tournament_id)

    text = random.choice(_LEAGUE_REGISTRATION_TEMPLATES).format(
        energy_cost=ENERGY_COST,
        max_participants=MAX_PARTICIPANTS,
    )

    sent_count = 0
    for user in eligible:
        try:
            markup = InlineKeyboardMarkup(inline_keyboard=[[
                InlineKeyboardButton(
                    text="⚽ Зареєструватися",
                    web_app=WebAppInfo(url=f"{WEBAPP_BASE}/?user_id={user.user_id}")
                )
            ]])
            await send_message(user, text, reply_markup=markup)
            sent_count += 1
        except Exception as e:
            logger.error("League notification failed for user %s: %s", user.user_id, e)

    logger.info("League notification sent to %d/%d users", sent_count, len(eligible))


async def ensure_league_sentinel() -> int:
    """Create or find the sentinel Blitz record for league tournament FK constraints."""
    global _league_sentinel_id
    if _league_sentinel_id is not None:
        return _league_sentinel_id

    async for session in get_session():
        async with session.begin():
            stmt = select(Blitz).where(Blitz.blitz_type == BlitzType.LEAGUE_TOURNAMENT)
            result = await session.execute(stmt)
            blitz = result.scalar_one_or_none()
            if blitz:
                _league_sentinel_id = blitz.id
                return _league_sentinel_id

            sentinel = Blitz(
                start_at=datetime(2099, 1, 1),
                blitz_type=BlitzType.LEAGUE_TOURNAMENT,
                cost=0,
                group=BlitzGroup.GLOBAL,
            )
            session.add(sentinel)
            await session.flush()
            _league_sentinel_id = sentinel.id
            logger.info("Created sentinel Blitz for league tournament: id=%s", _league_sentinel_id)
            return _league_sentinel_id


# --- Helpers ---

async def _sleep_until_hour(hour: int, minute: int = 0):
    """Sleep until the specified hour:minute in Kyiv time. Returns immediately if past.

    The round loop in league_tournament_daily_loop relies on this return-if-past
    behavior to quickly skip through already-played rounds after a restart.
    """
    now = datetime.now(KYIV_TZ)
    target = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
    if now >= target:
        return
    sleep_seconds = (target - now).total_seconds()
    if sleep_seconds > 0:
        await asyncio.sleep(sleep_seconds)


async def _get_current_round(tournament_id: int) -> int:
    async for session in get_session():
        stmt = select(LeagueTournament.current_round).where(LeagueTournament.id == tournament_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none() or 0
    return 0


async def _get_human_participant_uids(tournament_id: int) -> list[int]:
    async for session in get_session():
        stmt = select(LeagueParticipant.user_id).where(
            LeagueParticipant.tournament_id == tournament_id,
            LeagueParticipant.is_bot.is_(False),
        )
        result = await session.execute(stmt)
        return [r[0] for r in result.all()]
    return []


async def _get_avg_participant_ovr(tournament_id: int) -> int:
    async for session in get_session():
        stmt = select(LeagueParticipant.user_id).where(
            LeagueParticipant.tournament_id == tournament_id,
            LeagueParticipant.is_bot.is_(False),
        )
        result = await session.execute(stmt)
        user_ids = [r[0] for r in result.all()]
        break

    if not user_ids:
        return 500

    total_ovr = 0
    for uid in user_ids:
        user = await UserService.get_user(uid)
        if user:
            total_ovr += user.team_power or 0

    return max(300, total_ovr // len(user_ids))


async def _create_league_bot(target_ovr: int) -> int | None:
    """Create a bot user with characters matching target OVR."""
    try:
        from services.character_service import CharacterService
        from utils.generate_character import get_character
        from database.models.character import Position
        from utils.fix_and_fill_teams import TARGET_QUOTA, POSITION_PREFIXES

        bot_offset = int(time.time() * 1000) % 900_000_000
        bot_user_id = 4_000_000_000 + bot_offset

        available = [n for n in _BOT_TEAM_NAMES if n not in _used_bot_names]
        if not available:
            available = list(_BOT_TEAM_NAMES)
        chosen_name = random.choice(available)
        _used_bot_names.append(chosen_name)

        bot_user = await UserService.create_user(
            user_id=bot_user_id,
            user_name=f"league_bot_{bot_offset}",
            user_full_name="League Bot",
            is_bot=True,
            money=1000,
            energy=100,
            team_name=chosen_name,
        )
        if not bot_user:
            return None

        positions_list = []
        for pos, qty in TARGET_QUOTA.items():
            positions_list.extend([pos] * qty)
        random.shuffle(positions_list)

        num_chars = 11
        power_per_char = max(50, target_ovr // num_chars)
        power_min = max(30, int(power_per_char * 0.8))
        power_max = int(power_per_char * 1.2)

        for char_idx in range(num_chars):
            character_data = await get_character(power_range=(power_min, power_max))
            if char_idx < len(positions_list):
                character_data.position = positions_list[char_idx]
            await CharacterService.create_character(character_data, bot_user_id)

        await UserService.assign_main_character_if_none(bot_user_id)

        from sqlalchemy.orm import selectinload
        async for session in get_session():
            stmt = (
                select(UserBot)
                .where(UserBot.user_id == bot_user_id)
                .options(selectinload(UserBot.characters))
            )
            result = await session.execute(stmt)
            bot = result.scalar_one_or_none()
            if bot:
                sorted_chars = sorted(bot.characters, key=lambda c: c.power, reverse=True)
                counters = {pos: 0 for pos in Position}
                for char in sorted_chars:
                    pos = char.position or Position.MIDFIELDER
                    prefix = POSITION_PREFIXES.get(pos, "mid")
                    if counters[pos] < TARGET_QUOTA.get(pos, 0):
                        char.squad_position = f"{prefix}_{counters[pos]}"
                        counters[pos] += 1
                        session.add(char)
                    else:
                        if char.squad_position is not None:
                            char.squad_position = None
                            session.add(char)
                await session.commit()
            break

        await UserService.edit_status_register(bot_user_id, STATUS_USER_REGISTER.END_REGISTER)
        return bot_user_id

    except Exception as e:
        logger.exception("Failed to create league bot: %s", e)
        return None


async def _cleanup_league_bots():
    """Delete league-specific bot users by tracked IDs."""
    global _bot_user_ids
    if not _bot_user_ids:
        return

    from database.models.character import Character

    for bot_uid in _bot_user_ids:
        try:
            async for session in get_session():
                async with session.begin():
                    await session.execute(
                        delete(Character).where(Character.characters_user_id == bot_uid)
                    )
                    await session.execute(
                        delete(UserBot).where(UserBot.user_id == bot_uid)
                    )
                break
        except Exception as e:
            logger.warning("League bot cleanup failed for uid=%s: %s", bot_uid, e)

    logger.info("Cleaned up %s league bots", len(_bot_user_ids))
    _bot_user_ids = []


def _generate_round_robin_pairings(n: int = MAX_PARTICIPANTS) -> list[list[tuple[int, int]]]:
    """Generate round-robin pairings using circle method. Returns list of rounds, each a list of (slot, slot) pairs."""
    slots = list(range(n))
    fixed = slots[0]
    rotating = slots[1:]
    rounds = []

    for _ in range(n - 1):
        round_pairs = [(fixed, rotating[0])]
        for i in range(1, len(rotating) // 2 + 1):
            round_pairs.append((rotating[i], rotating[-i]))
        rounds.append(round_pairs)
        rotating = rotating[-1:] + rotating[:-1]

    return rounds


async def _generate_fixtures(tournament_id: int, participants: list[tuple[int, int]]):
    """Generate all 28 fixtures using round-robin circle method.
    participants: list of (slot, user_id) sorted by slot.
    """
    uid_by_slot = {slot: uid for slot, uid in participants}
    rounds = _generate_round_robin_pairings(len(participants))

    fixtures = []
    for round_idx, pairs in enumerate(rounds):
        round_number = round_idx + 1
        for home_slot, away_slot in pairs:
            fixtures.append(LeagueFixture(
                tournament_id=tournament_id,
                round_number=round_number,
                home_user_id=uid_by_slot[home_slot],
                away_user_id=uid_by_slot[away_slot],
            ))

    async for session in get_session():
        async with session.begin():
            session.add_all(fixtures)
        break

    logger.info("League tournament %s: generated %s fixtures", tournament_id, len(fixtures))


# --- Tournament Lifecycle ---

async def _check_existing_active_tournament() -> int | None:
    """Check if an active tournament exists without creating one."""
    async for session in get_session():
        stmt = select(LeagueTournament.id).where(
            LeagueTournament.status.in_([
                LeagueTournamentStatus.REGISTRATION,
                LeagueTournamentStatus.IN_PROGRESS,
            ])
        ).order_by(LeagueTournament.created_at.desc())
        result = await session.execute(stmt)
        return result.scalar_one_or_none()


async def _get_or_create_tournament() -> int | None:
    """Get active tournament or create new one. Returns tournament_id."""
    global _bot_user_ids, _used_bot_names
    _bot_user_ids = []
    _used_bot_names = []

    r = get_redis()

    async for session in get_session():
        async with session.begin():
            stmt = select(LeagueTournament).where(
                LeagueTournament.status.in_([
                    LeagueTournamentStatus.REGISTRATION,
                    LeagueTournamentStatus.IN_PROGRESS,
                ])
            ).order_by(LeagueTournament.created_at.desc())
            result = await session.execute(stmt)
            existing = result.scalars().first()

            if existing:
                await r.set(ACTIVE_TOURNAMENT_KEY, str(existing.id), ex=86400)
                return existing.id

            tournament = LeagueTournament(
                status=LeagueTournamentStatus.REGISTRATION,
                current_round=0,
            )
            session.add(tournament)
            await session.flush()
            tid = tournament.id
        break

    await r.set(ACTIVE_TOURNAMENT_KEY, str(tid), ex=86400)
    logger.info("Created league tournament id=%s", tid)
    return tid


async def _close_registration_and_prepare(tournament_id: int):
    """Close registration, fill empty slots with bots, generate fixtures."""
    global _bot_user_ids

    # Idempotent: check if already closed
    async for session in get_session():
        stmt = select(LeagueTournament.status).where(LeagueTournament.id == tournament_id)
        result = await session.execute(stmt)
        status = result.scalar_one_or_none()
        break

    if status != LeagueTournamentStatus.REGISTRATION:
        return

    # Count current participants
    async for session in get_session():
        stmt = select(func.count(LeagueParticipant.id)).where(
            LeagueParticipant.tournament_id == tournament_id
        )
        result = await session.execute(stmt)
        participant_count = result.scalar_one()
        break

    # Fill empty slots with bots
    slots_to_fill = MAX_PARTICIPANTS - participant_count
    if slots_to_fill > 0:
        avg_ovr = await _get_avg_participant_ovr(tournament_id)
        for i in range(slots_to_fill):
            bot_uid = await _create_league_bot(avg_ovr)
            if bot_uid:
                _bot_user_ids.append(bot_uid)
                slot = participant_count + i
                async for session in get_session():
                    async with session.begin():
                        p = LeagueParticipant(
                            tournament_id=tournament_id,
                            user_id=bot_uid,
                            is_bot=True,
                            slot=slot,
                        )
                        session.add(p)
                    break

    # Generate fixtures
    async for session in get_session():
        stmt = (
            select(LeagueParticipant)
            .where(LeagueParticipant.tournament_id == tournament_id)
            .order_by(LeagueParticipant.slot)
        )
        result = await session.execute(stmt)
        participants = list(result.scalars().all())
        participant_data = [(p.slot, p.user_id) for p in participants]
        break

    await _generate_fixtures(tournament_id, participant_data)

    # Update status to IN_PROGRESS
    async for session in get_session():
        async with session.begin():
            await session.execute(
                update(LeagueTournament)
                .where(LeagueTournament.id == tournament_id)
                .values(status=LeagueTournamentStatus.IN_PROGRESS)
            )
        break

    logger.info("League tournament %s: registration closed, %s bots added", tournament_id, slots_to_fill)


# --- Service Class ---

class LeagueTournamentService:

    @classmethod
    async def join_tournament(cls, user_id: int) -> dict:
        r = get_redis()
        active_id = await r.get(ACTIVE_TOURNAMENT_KEY)

        if not active_id:
            return {"ok": False, "message": "Немає активного турніру"}

        tournament_id = int(active_id)

        # Check tournament status
        async for session in get_session():
            stmt = select(LeagueTournament.status).where(LeagueTournament.id == tournament_id)
            result = await session.execute(stmt)
            status = result.scalar_one_or_none()
            break

        if status != LeagueTournamentStatus.REGISTRATION:
            return {"ok": False, "message": "Реєстрація закрита"}

        # Check not already registered
        async for session in get_session():
            stmt = select(LeagueParticipant.id).where(
                LeagueParticipant.tournament_id == tournament_id,
                LeagueParticipant.user_id == user_id,
            )
            result = await session.execute(stmt)
            if result.scalar_one_or_none():
                return {"ok": False, "message": "Ви вже зареєстровані"}
            break

        # Check participant count
        async for session in get_session():
            stmt = select(func.count(LeagueParticipant.id)).where(
                LeagueParticipant.tournament_id == tournament_id,
            )
            result = await session.execute(stmt)
            count = result.scalar_one()
            break

        if count >= MAX_PARTICIPANTS:
            return {"ok": False, "message": "Ліга заповнена"}

        # Consume energy
        consumed = await UserService.consume_energy(user_id, ENERGY_COST)
        if not consumed:
            return {"ok": False, "message": "Недостатньо енергії"}

        # Create participant
        async for session in get_session():
            async with session.begin():
                p = LeagueParticipant(
                    tournament_id=tournament_id,
                    user_id=user_id,
                    is_bot=False,
                    slot=count,
                )
                session.add(p)
            break

        return {"ok": True, "message": "Ви зареєстровані!"}

    @classmethod
    async def get_standings(cls, tournament_id: int) -> list[dict]:
        async for session in get_session():
            stmt = (
                select(LeagueParticipant)
                .where(LeagueParticipant.tournament_id == tournament_id)
                .order_by(
                    desc(LeagueParticipant.points),
                    desc(LeagueParticipant.goals_for - LeagueParticipant.goals_against),
                    desc(LeagueParticipant.goals_for),
                )
            )
            result = await session.execute(stmt)
            participants = list(result.scalars().all())
            break

        standings = []
        for rank, p in enumerate(participants, 1):
            user = await UserService.get_user(p.user_id)
            team_name = user.team_name_user if user else f"Team {p.user_id}"

            standings.append({
                "rank": rank,
                "user_id": p.user_id,
                "team_name": team_name,
                "is_bot": p.is_bot,
                "played": p.wins + p.draws + p.losses,
                "wins": p.wins,
                "draws": p.draws,
                "losses": p.losses,
                "goals_for": p.goals_for,
                "goals_against": p.goals_against,
                "goal_difference": p.goals_for - p.goals_against,
                "points": p.points,
            })

        return standings

    @classmethod
    async def get_schedule(cls, tournament_id: int) -> list[dict]:
        async for session in get_session():
            stmt = (
                select(LeagueFixture)
                .where(LeagueFixture.tournament_id == tournament_id)
                .order_by(LeagueFixture.round_number, LeagueFixture.id)
            )
            result = await session.execute(stmt)
            fixtures = list(result.scalars().all())
            break

        # Batch lookup team names
        user_ids = set()
        for f in fixtures:
            user_ids.add(f.home_user_id)
            user_ids.add(f.away_user_id)

        name_map = {}
        for uid in user_ids:
            user = await UserService.get_user(uid)
            name_map[uid] = user.team_name_user if user else f"Team {uid}"

        schedule = []
        for f in fixtures:
            schedule.append({
                "id": f.id,
                "round_number": f.round_number,
                "home_team": name_map.get(f.home_user_id, f"Team {f.home_user_id}"),
                "away_team": name_map.get(f.away_user_id, f"Team {f.away_user_id}"),
                "home_user_id": f.home_user_id,
                "away_user_id": f.away_user_id,
                "home_goals": f.home_goals,
                "away_goals": f.away_goals,
                "is_draw": f.is_draw,
                "winner_user_id": f.winner_user_id,
                "played": f.played_at is not None,
                "match_id": f.match_id,
                "scheduled_time": f"{ROUND_START_HOURS[f.round_number - 1]}:30" if 1 <= f.round_number <= len(ROUND_START_HOURS) else None,
            })

        return schedule

    @classmethod
    async def get_status(cls, user_id: int) -> dict:
        r = get_redis()
        active_id = await r.get(ACTIVE_TOURNAMENT_KEY)

        tournament = None
        tournament_id = None

        if active_id:
            tournament_id = int(active_id)
            async for session in get_session():
                stmt = select(LeagueTournament).where(LeagueTournament.id == tournament_id)
                result = await session.execute(stmt)
                tournament = result.scalar_one_or_none()
                break

        if not tournament:
            # Fallback: check DB for most recent tournament
            async for session in get_session():
                stmt = (
                    select(LeagueTournament)
                    .order_by(LeagueTournament.created_at.desc())
                    .limit(1)
                )
                result = await session.execute(stmt)
                tournament = result.scalar_one_or_none()
                break

            if not tournament:
                return {"status": "none"}
            tournament_id = tournament.id

        # Check if user is registered
        is_registered = False
        async for session in get_session():
            stmt = select(LeagueParticipant.id).where(
                LeagueParticipant.tournament_id == tournament_id,
                LeagueParticipant.user_id == user_id,
            )
            result = await session.execute(stmt)
            is_registered = result.scalar_one_or_none() is not None
            break

        # Count participants
        async for session in get_session():
            stmt = select(func.count(LeagueParticipant.id)).where(
                LeagueParticipant.tournament_id == tournament_id,
            )
            result = await session.execute(stmt)
            participant_count = result.scalar_one()
            break

        return {
            "status": "active",
            "tournament_id": tournament_id,
            "tournament_status": tournament.status.value,
            "current_round": tournament.current_round,
            "is_registered": is_registered,
            "participant_count": participant_count,
        }

    @classmethod
    async def _run_round(cls, tournament_id: int, round_number: int):
        """Run all 4 matches of a round concurrently."""
        sentinel_id = await ensure_league_sentinel()

        # Load fixtures for this round. played_at IS NULL filter makes this idempotent:
        # on retry/restart, already-played fixtures are skipped so we don't double-score.
        async for session in get_session():
            stmt = select(LeagueFixture).where(
                LeagueFixture.tournament_id == tournament_id,
                LeagueFixture.round_number == round_number,
                LeagueFixture.played_at.is_(None),
            )
            result = await session.execute(stmt)
            fixtures = list(result.scalars().all())
            fixture_data = [(f.id, f.home_user_id, f.away_user_id) for f in fixtures]
            break

        if not fixture_data:
            logger.info(
                "League tournament %s: round %s has no unplayed fixtures, skipping",
                tournament_id, round_number,
            )
            # Still advance current_round so the daily loop moves on.
            async for session in get_session():
                async with session.begin():
                    await session.execute(
                        update(LeagueTournament)
                        .where(LeagueTournament.id == tournament_id)
                        .values(current_round=round_number)
                    )
                break
            return

        temp_team_ids = set()
        round_match_ids = set()
        match_fixture_map = {}  # blitz_match_id -> (fix_id, home_uid, away_uid, t1_id, t2_id)
        match_data_map = {}  # blitz_match_id -> BlitzMatchData

        try:
            tasks = []
            for fix_id, home_uid, away_uid in fixture_data:
                # Load team names
                home_user = await UserService.get_user(home_uid)
                away_user = await UserService.get_user(away_uid)
                home_name = home_user.team_name_user if home_user else f"Team {home_uid}"
                away_name = away_user.team_name_user if away_user else f"Team {away_uid}"

                # Create temp BlitzTeam + BlitzUser
                async for session in get_session():
                    async with session.begin():
                        team1 = BlitzTeam(name=home_name)
                        team2 = BlitzTeam(name=away_name)
                        session.add_all([team1, team2])
                        await session.flush()

                        bu1 = BlitzUser(user_id=home_uid, blitz_id=sentinel_id, team_id=team1.id)
                        bu2 = BlitzUser(user_id=away_uid, blitz_id=sentinel_id, team_id=team2.id)
                        session.add_all([bu1, bu2])
                        await session.flush()

                        t1_id, t2_id = team1.id, team2.id
                    break

                temp_team_ids.update([t1_id, t2_id])

                # Build match data
                mt_first = MatchTeamBlitz(team_id=t1_id)
                mt_second = MatchTeamBlitz(team_id=t2_id)
                blitz_match_id = generate_blitz_match_id(t1_id, t2_id)

                match_data = BlitzMatchData(
                    blitz_match_id=blitz_match_id,
                    stage=round_number,
                    first_team=mt_first,
                    second_team=mt_second,
                    match_type="league",
                )
                await match_data.init_teams()

                round_match_ids.add(blitz_match_id)
                match_fixture_map[blitz_match_id] = (fix_id, home_uid, away_uid, t1_id, t2_id)
                match_data_map[blitz_match_id] = match_data

                # Register in managers
                init_msg = f"⚽ Ліга — Тур {round_number}"
                await TeamBlitzMatchManager.add_match(
                    match_data,
                    BlitzStateData(state=BlitzState.STARTED, message=init_msg),
                )
                TBMatchManager.add_match(
                    match_data,
                    BlitzStateData(state=BlitzState.STARTED, message=init_msg),
                )
                await publish_match_state(blitz_match_id)

                # Create match coroutine (default args capture current loop values).
                # Internal try/except is load-bearing: any crash inside start_match
                # must still return a result tuple so the downstream loop writes the
                # fixture row and sets played_at. A bare raise here lets gather turn
                # the task into an Exception result, the continue at the top of the
                # result loop skips fixture update, played_at stays NULL forever →
                # UI shows "— : —" and the round can't be retried (daily_loop retry
                # only fires on outer _run_round exceptions, which never happen).
                async def run_single(md=match_data, mid=blitz_match_id):
                    await asyncio.sleep(3)
                    bm = BlitzMatch(md, datetime.now(), allow_draw=True)
                    try:
                        winner_team, loser_team = await bm.start_match()
                    except Exception:
                        logger.exception(
                            "League match %s crashed in start_match; treating as draw with current goals",
                            mid,
                        )
                        return mid, None, None
                    return mid, winner_team, loser_team

                tasks.append(run_single())

            # Run all matches concurrently
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Process results
            for result in results:
                if isinstance(result, Exception):
                    logger.exception("League round match failed: %s", result)
                    continue

                match_id, winner_team, loser_team = result
                fix_id, home_uid, away_uid, t1_id, t2_id = match_fixture_map[match_id]
                md = match_data_map[match_id]

                # Extract goals from match_data (updated during match by reference)
                home_goals = md.first_team.goals if md.first_team else 0
                away_goals = md.second_team.goals if md.second_team else 0

                is_draw = winner_team is None
                winner_uid = None
                if not is_draw and winner_team:
                    winner_uid = home_uid if winner_team.id == t1_id else away_uid

                # Update fixture. Wrapped so one bad DB write doesn't block the rest of the round.
                try:
                    async for session in get_session():
                        async with session.begin():
                            await session.execute(
                                update(LeagueFixture)
                                .where(LeagueFixture.id == fix_id)
                                .values(
                                    home_goals=home_goals,
                                    away_goals=away_goals,
                                    winner_user_id=winner_uid,
                                    is_draw=is_draw,
                                    match_id=match_id,
                                    played_at=datetime.now(),
                                )
                            )
                        break
                except Exception:
                    logger.exception(
                        "League tournament %s round %s: failed to write fixture %s",
                        tournament_id, round_number, fix_id,
                    )
                    continue  # move to next match; don't fail stats or the whole round

                # Update participant stats — also guarded.
                try:
                    await cls._update_participant_stats(
                        tournament_id, home_uid, away_uid,
                        home_goals, away_goals, is_draw, winner_uid,
                    )
                except Exception:
                    logger.exception(
                        "League tournament %s round %s: failed to update stats for fixture %s",
                        tournament_id, round_number, fix_id,
                    )

            # Update tournament current_round
            async for session in get_session():
                async with session.begin():
                    await session.execute(
                        update(LeagueTournament)
                        .where(LeagueTournament.id == tournament_id)
                        .values(current_round=round_number)
                    )
                break

            # Notify human participants via WebSocket — failures here must not block
            # round completion (the round IS done, clients can refetch).
            try:
                participant_uids = await _get_human_participant_uids(tournament_id)
                if participant_uids:
                    payloads = [
                        make_payload("league_round_result", user_id=uid, payload={
                            "tournament_id": tournament_id,
                            "round": round_number,
                        })
                        for uid in participant_uids
                    ]
                    await publish_batch(payloads)
            except Exception:
                logger.exception(
                    "League tournament %s round %s: WebSocket notification failed",
                    tournament_id, round_number,
                )

            logger.info("League tournament %s: round %s completed", tournament_id, round_number)

        finally:
            # Guaranteed cleanup
            await asyncio.sleep(10)
            TBMatchManager.clear_matches_by_ids(list(round_match_ids))
            await TeamBlitzMatchManager.clear_matches_by_ids(list(round_match_ids))
            await BlitzTeamService.remove_teams_by_ids(list(temp_team_ids))

    @classmethod
    async def _update_participant_stats(cls, tournament_id: int, home_uid: int, away_uid: int,
                                        home_goals: int, away_goals: int, is_draw: bool,
                                        winner_uid: int | None):
        async for session in get_session():
            async with session.begin():
                # Home participant
                home_stmt = select(LeagueParticipant).where(
                    LeagueParticipant.tournament_id == tournament_id,
                    LeagueParticipant.user_id == home_uid,
                )
                result = await session.execute(home_stmt)
                home_p = result.scalar_one_or_none()

                away_stmt = select(LeagueParticipant).where(
                    LeagueParticipant.tournament_id == tournament_id,
                    LeagueParticipant.user_id == away_uid,
                )
                result = await session.execute(away_stmt)
                away_p = result.scalar_one_or_none()

                if home_p:
                    home_p.goals_for += home_goals
                    home_p.goals_against += away_goals
                    if is_draw:
                        home_p.draws += 1
                        home_p.points += POINTS_DRAW
                    elif winner_uid == home_uid:
                        home_p.wins += 1
                        home_p.points += POINTS_WIN
                    else:
                        home_p.losses += 1

                if away_p:
                    away_p.goals_for += away_goals
                    away_p.goals_against += home_goals
                    if is_draw:
                        away_p.draws += 1
                        away_p.points += POINTS_DRAW
                    elif winner_uid == away_uid:
                        away_p.wins += 1
                        away_p.points += POINTS_WIN
                    else:
                        away_p.losses += 1
            break

    @classmethod
    async def _settle_tournament(cls, tournament_id: int):
        """Award rewards to top 3 and mark tournament completed."""
        standings = await cls.get_standings(tournament_id)

        rewards = [
            (5, 1000, 50),  # 1st: +5 rating, +1000 money, +50 energy
            (3, 600, 30),  # 2nd
            (1, 300, 20),  # 3rd
        ]

        for i, (rating, money, energy) in enumerate(rewards):
            if i >= len(standings):
                break
            entry = standings[i]
            uid = entry["user_id"]
            if entry.get("is_bot"):
                continue

            await UserService.add_rating(uid, rating)
            await UserService.add_money_user(uid, money)
            await UserService.add_energy_user(uid, energy)

            # Lootbox rewards
            if i == 0:
                # 1st place: large lootbox
                await UserService.add_count_of_big_box(uid, 1)
            elif i == 1:
                # 2nd place: medium lootbox
                await UserService.add_count_of_medium_box(uid, 1)
            elif i == 2:
                # 3rd place: small lootbox
                await UserService.add_count_of_small_box(uid, 1)

        # Mark completed
        async for session in get_session():
            async with session.begin():
                await session.execute(
                    update(LeagueTournament)
                    .where(LeagueTournament.id == tournament_id)
                    .values(
                        status=LeagueTournamentStatus.COMPLETED,
                        finished_at=datetime.now(),
                    )
                )
            break

        # Clear Redis
        r = get_redis()
        await r.delete(ACTIVE_TOURNAMENT_KEY)

        # Notify via WebSocket
        participant_uids = await _get_human_participant_uids(tournament_id)
        if participant_uids:
            payloads = [
                make_payload("league_tournament_result", user_id=uid, payload={
                    "tournament_id": tournament_id,
                })
                for uid in participant_uids
            ]
            await publish_batch(payloads)

        logger.info("League tournament %s settled", tournament_id)


# --- Daily Loop ---

async def league_tournament_daily_loop():
    """Background task: manages daily league tournament lifecycle."""
    while True:
        try:
            # Guard: don't create a new tournament if registration window has closed
            now = datetime.now(KYIV_TZ)
            if now.hour >= 10:
                active_tid = await _check_existing_active_tournament()
                if not active_tid:
                    logger.info(
                        "Past registration window (%s), no active tournament — sleeping until tomorrow 08:00",
                        now.strftime("%H:%M"),
                    )
                    next_start = (now + timedelta(days=1)).replace(hour=8, minute=0, second=0, microsecond=0)
                    await asyncio.sleep((next_start - now).total_seconds())
                    continue

            # Ensure tournament exists immediately (so status endpoint never returns "none")
            tournament_id = await _get_or_create_tournament()
            if not tournament_id:
                logger.warning("Failed to create league tournament")
                await asyncio.sleep(3600)
                continue

            # Check current status to decide where to resume
            current_status = None
            async for session in get_session():
                stmt = select(LeagueTournament.status).where(LeagueTournament.id == tournament_id)
                result = await session.execute(stmt)
                current_status = result.scalar_one_or_none()
                break

            if current_status == LeagueTournamentStatus.COMPLETED:
                # Tournament already finished today — wait for next day
                now = datetime.now(KYIV_TZ)
                next_start = (now + timedelta(days=1)).replace(hour=8, minute=0, second=0, microsecond=0)
                sleep_seconds = (next_start - now).total_seconds()
                if sleep_seconds > 0:
                    await asyncio.sleep(sleep_seconds)
                continue

            if current_status == LeagueTournamentStatus.REGISTRATION:
                # Notify users about registration (idempotent via Redis guard)
                await _notify_league_registration(tournament_id)
                # Send reminder at 9:30 (30 min before close)
                await _sleep_until_hour(9, 30)
                await _notify_league_registration_reminder(tournament_id)
                # Wait for registration window to close
                await _sleep_until_hour(10, 0)
                await _close_registration_and_prepare(tournament_id)

            # Run 7 rounds at scheduled hours (skips already-played)
            for i, hour in enumerate(ROUND_START_HOURS):
                round_number = i + 1
                await _sleep_until_hour(hour, 30)

                # Resume support: skip already-played rounds
                current_round = await _get_current_round(tournament_id)
                if current_round >= round_number:
                    continue

                # One-shot retry: a round can fail on a transient DB/network hiccup.
                # If it still fails after the retry, log and continue to the next round —
                # don't freeze the whole tournament on a single bad round.
                try:
                    await LeagueTournamentService._run_round(tournament_id, round_number)
                except Exception:
                    logger.exception(
                        "League tournament %s: round %s crashed, retrying in 60s",
                        tournament_id, round_number,
                    )
                    await asyncio.sleep(60)
                    try:
                        await LeagueTournamentService._run_round(tournament_id, round_number)
                    except Exception:
                        logger.exception(
                            "League tournament %s: round %s failed after retry, skipping",
                            tournament_id, round_number,
                        )

            # Settle tournament and cleanup
            await LeagueTournamentService._settle_tournament(tournament_id)
            await _cleanup_league_bots()

        except Exception as e:
            logger.exception("league_tournament_daily_loop error: %s", e)

        # Wait until next day's 8:00
        now = datetime.now(KYIV_TZ)
        next_start = (now + timedelta(days=1)).replace(hour=8, minute=0, second=0, microsecond=0)
        sleep_seconds = (next_start - now).total_seconds()
        if sleep_seconds > 0:
            await asyncio.sleep(sleep_seconds)
