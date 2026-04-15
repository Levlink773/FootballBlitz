#!/usr/bin/env python3
"""Recover stuck league fixtures.

Scans league_fixtures for rows where played_at IS NULL — the match engine
crashed mid-round and left the fixture unfilled. Writes them as 0:0 draws
and updates participant stats retroactively.

Pair with the run_single try/except guard in services/league_tournament_service.py
— that guard prevents future stuck fixtures; this script cleans up the ones
that happened before the guard landed.

Run with: PYTHONPATH=. python utils/recover_stuck_league_fixtures.py

Note: rewards for COMPLETED tournaments have already been paid out based on
the incomplete standings. This script fixes the fixture display (so the UI
stops showing "— : —") and brings participant counts back into sync, but
does NOT retroactively award missed rewards.
"""
import asyncio
from datetime import datetime

from sqlalchemy import select, update

from database.models.league_tournament import LeagueFixture
from database.session import get_session
from logging_config import logger
from services.league_tournament_service import LeagueTournamentService


async def recover() -> int:
    async for session in get_session():
        stmt = select(LeagueFixture).where(
            LeagueFixture.played_at.is_(None),
            LeagueFixture.home_goals.is_(None),
        )
        result = await session.execute(stmt)
        stuck = list(result.scalars().all())
        break

    if not stuck:
        print("No stuck fixtures found. Database clean.")
        return 0

    print(f"Found {len(stuck)} stuck fixtures:")
    by_tournament: dict[int, int] = {}
    for f in stuck:
        by_tournament[f.tournament_id] = by_tournament.get(f.tournament_id, 0) + 1
        print(
            f"  tournament={f.tournament_id} round={f.round_number} "
            f"fix={f.id} home={f.home_user_id} away={f.away_user_id}"
        )
    print(f"Per-tournament counts: {by_tournament}")
    print()

    now = datetime.now()
    recovered = 0
    stats_updated = 0

    for f in stuck:
        try:
            async for session in get_session():
                async with session.begin():
                    await session.execute(
                        update(LeagueFixture)
                        .where(LeagueFixture.id == f.id)
                        .values(
                            home_goals=0,
                            away_goals=0,
                            is_draw=True,
                            winner_user_id=None,
                            played_at=now,
                        )
                    )
                break
            recovered += 1
        except Exception:
            logger.exception("Failed to recover fixture %s", f.id)
            continue

        try:
            await LeagueTournamentService._update_participant_stats(
                f.tournament_id, f.home_user_id, f.away_user_id,
                home_goals=0, away_goals=0, is_draw=True, winner_uid=None,
            )
            stats_updated += 1
        except Exception:
            logger.exception("Failed to update stats for fixture %s", f.id)

    print()
    print(f"Fixtures recovered: {recovered}/{len(stuck)}")
    print(f"Participant stats updated: {stats_updated}/{len(stuck)}")
    return 0 if recovered == len(stuck) and stats_updated == len(stuck) else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(recover()))
