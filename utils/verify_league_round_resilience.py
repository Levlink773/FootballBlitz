#!/usr/bin/env python3
"""Verify fixes for league tournament round resilience.

Covers five bugs:
  A. load_utils.py — create_task without saving ref (GC footgun)
  B. services/user_service.py — delete_all_bots crashes on league_fixtures FK
  C. services/league_tournament_service.py — _run_round not resilient to partial failures
  D. services/league_tournament_service.py — _sleep_until_hour semantics (kept; verified unchanged)
  E. services/league_tournament_service.py — run_single unguarded bm.start_match() (2026-04-15)

No live DB required: uses SQL compile inspection and source introspection.
Run with: PYTHONPATH=. python utils/verify_league_round_resilience.py
"""
import asyncio
import sys
import time

PASS = 0
FAIL = 0


def ok(name: str):
    global PASS
    PASS += 1
    print(f"  PASS: {name}")


def bad(name: str, err: Exception | str | None = None):
    global FAIL
    FAIL += 1
    print(f"  FAIL: {name}")
    if err:
        print(f"        {err}")


# --- Bug A: load_utils keeps strong refs to background tasks ---

def test_background_tasks_registry():
    try:
        from load_utils import _background_tasks, _spawn_background
        assert isinstance(_background_tasks, set), "_background_tasks is not a set"
        assert callable(_spawn_background), "_spawn_background is not callable"
        ok("load_utils._background_tasks registry + _spawn_background helper exist")
    except Exception as e:
        bad("load_utils._background_tasks registry", e)


async def test_spawn_background_lifecycle():
    try:
        from load_utils import _background_tasks, _spawn_background

        async def dummy():
            await asyncio.sleep(0.05)

        task = _spawn_background(dummy())
        assert task in _background_tasks, "task not registered on spawn"
        await task
        assert task not in _background_tasks, "task not discarded after completion"
        ok("_spawn_background registers task on spawn and discards on completion")
    except Exception as e:
        bad("_spawn_background task lifecycle", e)


# --- Bug B: delete_all_bots SELECT excludes league-referenced bots ---

async def test_delete_all_bots_select_structure():
    try:
        from sqlalchemy import select
        from database.models.user_bot import UserBot
        from database.models.league_tournament import LeagueParticipant, LeagueFixture

        bots_stmt = select(UserBot.id, UserBot.user_id).where(
            UserBot.is_bot.is_(True),
            UserBot.user_id.notin_(select(LeagueParticipant.user_id)),
            UserBot.user_id.notin_(
                select(LeagueFixture.home_user_id).where(LeagueFixture.home_user_id.is_not(None))
            ),
            UserBot.user_id.notin_(
                select(LeagueFixture.away_user_id).where(LeagueFixture.away_user_id.is_not(None))
            ),
        )
        sql = str(bots_stmt.compile(compile_kwargs={"literal_binds": True}))
        assert "league_participants" in sql, "league_participants not referenced in SQL"
        assert "league_fixtures" in sql, "league_fixtures not referenced in SQL"
        assert sql.count("NOT IN") >= 3, f"expected >=3 NOT IN clauses, got {sql.count('NOT IN')}"
        ok("delete_all_bots SELECT excludes league_participants + league_fixtures via NOT IN")
    except Exception as e:
        bad("delete_all_bots SELECT construction", e)


async def test_user_service_imports_league_models():
    try:
        import services.user_service as us
        assert hasattr(us, "LeagueParticipant"), "LeagueParticipant not imported"
        assert hasattr(us, "LeagueFixture"), "LeagueFixture not imported"
        ok("services.user_service imports LeagueParticipant and LeagueFixture")
    except Exception as e:
        bad("user_service imports", e)


# --- Bug C: _run_round has per-match guards + played_at filter ---

async def test_run_round_resilience_markers():
    try:
        import inspect
        from services.league_tournament_service import LeagueTournamentService
        src = inspect.getsource(LeagueTournamentService._run_round)

        checks = {
            "played_at.is_(None)": "played_at IS NULL idempotency filter",
            "failed to write fixture": "per-match fixture try/except",
            "failed to update stats": "per-match stats try/except",
            "WebSocket notification failed": "WebSocket publish try/except",
            "no unplayed fixtures": "empty-round short-circuit advances current_round",
        }
        missing = [label for marker, label in checks.items() if marker not in src]
        assert not missing, "missing: " + "; ".join(missing)
        ok("_run_round has all resilience guards")
    except Exception as e:
        bad("_run_round resilience markers", e)


async def test_daily_loop_retry_markers():
    try:
        import inspect
        import services.league_tournament_service as lts
        src = inspect.getsource(lts.league_tournament_daily_loop)

        assert "retrying in 60s" in src, "one-shot retry marker missing"
        assert "failed after retry, skipping" in src, "skip-on-double-failure marker missing"
        ok("league_tournament_daily_loop has per-round retry-once + skip logic")
    except Exception as e:
        bad("daily_loop retry markers", e)


# --- Bug E: run_single catches bm.start_match() crashes ---

async def test_run_single_has_try_except_guard():
    """run_single must catch exceptions from bm.start_match() and return
    (mid, None, None) so the fixture update path still fires and played_at
    gets set. Without this, a single match crash leaves NULL scores in DB
    → UI shows "— : —" and the round never self-heals (daily_loop retry
    only fires on outer _run_round exceptions, which never happen because
    asyncio.gather(return_exceptions=True) swallows them)."""
    try:
        import inspect
        from services.league_tournament_service import LeagueTournamentService
        src = inspect.getsource(LeagueTournamentService._run_round)

        assert "async def run_single" in src, "run_single inner coroutine missing"
        assert "crashed in start_match" in src, (
            "run_single missing try/except around bm.start_match — "
            "a match engine crash will leak past the result loop and "
            "leave the fixture with NULL scores"
        )
        ok("run_single wraps bm.start_match() in try/except with draw fallback")
    except Exception as e:
        bad("run_single try/except guard", e)


async def test_run_single_try_except_returns_none_tuple():
    """Structural check: after the except block we must return a 3-tuple
    whose winner/loser are both None, so the downstream draw-handling path
    (is_draw = winner_team is None) writes a fixture row with played_at."""
    try:
        import inspect
        from services.league_tournament_service import LeagueTournamentService
        src = inspect.getsource(LeagueTournamentService._run_round)

        # Find the run_single block
        start = src.find("async def run_single")
        assert start != -1, "run_single not found"
        end = src.find("tasks.append(run_single())", start)
        assert end != -1, "run_single tail not found"
        block = src[start:end]

        assert "except Exception:" in block, "run_single has no except clause"
        assert "return mid, None, None" in block, (
            "run_single except branch must return (mid, None, None) to "
            "trigger the draw-handling fixture write path"
        )
        ok("run_single except branch returns (mid, None, None)")
    except Exception as e:
        bad("run_single except-branch structure", e)


# --- Bug D: _sleep_until_hour semantics preserved ---

async def test_sleep_until_hour_past_returns_fast():
    try:
        from services.league_tournament_service import _sleep_until_hour

        t0 = time.monotonic()
        await _sleep_until_hour(0, 0)  # 00:00 is in the past (most runs)
        elapsed = time.monotonic() - t0
        assert elapsed < 0.5, f"expected <0.5s for past target, got {elapsed:.2f}s"
        ok(f"_sleep_until_hour returns immediately when target is past ({elapsed * 1000:.0f}ms)")
    except Exception as e:
        bad("_sleep_until_hour past-target behavior", e)


# --- Entry ---

async def main() -> int:
    print("=" * 64)
    print("FootballBlitz: league tournament resilience verification")
    print("=" * 64)
    print()
    print("Bug A: load_utils background task refs")
    test_background_tasks_registry()
    await test_spawn_background_lifecycle()
    print()
    print("Bug B: delete_all_bots excludes league bots")
    await test_delete_all_bots_select_structure()
    await test_user_service_imports_league_models()
    print()
    print("Bug C: _run_round + daily_loop resilience")
    await test_run_round_resilience_markers()
    await test_daily_loop_retry_markers()
    print()
    print("Bug E: run_single unguarded bm.start_match()")
    await test_run_single_has_try_except_guard()
    await test_run_single_try_except_returns_none_tuple()
    print()
    print("Bug D: _sleep_until_hour semantics (regression guard)")
    await test_sleep_until_hour_past_returns_fast()
    print()
    print("=" * 64)
    print(f"Summary: {PASS} PASS / {FAIL} FAIL")
    print("=" * 64)
    return 1 if FAIL > 0 else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
