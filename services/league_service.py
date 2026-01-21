import math
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from database.models.user_bot import UserBot, LeagueEnum
from database.models.season_pass import SeasonPass
# Импортируем генератор сессии (проверь, чтобы путь совпадал с твоим проектом)
from database.session import get_session

# Порядок ліг від найнижчої до найвищої
LEAGUE_ORDER = [
    LeagueEnum.BRONZE,
    LeagueEnum.SILVER,
    LeagueEnum.GOLD,
    LeagueEnum.PLATINUM,
    LeagueEnum.DIAMOND,
    LeagueEnum.MASTER,
    LeagueEnum.GRAND,
    LeagueEnum.LEGENDARY,
    LeagueEnum.WORLD
]


class LeagueService:
    """
    Сервіс для управління лігами.
    Враховує очки Season Pass для ранжування.
    Сесія створюється всередині методів (атомарні операції).
    """

    @classmethod
    async def process_season_transition(cls) -> list[str]:
        """
        Головна функція перерахунку ліг.
        Сортує гравців за очками SEASON PASS.
        """
        report = []

        # 1. Отримуємо сесію
        async for session in get_session():
            async with session.begin():  # 2. Відкриваємо транзакцію

                # Проходимо по всіх лігах
                for league in LEAGUE_ORDER:

                    # --- ЗАПИТ: Гравці конкретної ліги, відсортовані за SeasonPass.points ---
                    stmt = (
                        select(UserBot)
                        .join(UserBot.season_pass)  # Приєднуємо таблицю SeasonPass
                        .where(UserBot.league == league)
                        .order_by(SeasonPass.points.desc())  # СОРТУВАННЯ ЗА ОЧКАМИ ПАССА!
                    )

                    result = await session.execute(stmt)
                    users = result.scalars().all()

                    total_players = len(users)
                    if total_players == 0:
                        continue

                    # Налаштування відсотків (15%)
                    PROMOTION_PERCENT = 0.15
                    DEMOTION_PERCENT = 0.15

                    # Розрахунок кількості людей для переміщення
                    promote_count = math.ceil(total_players * PROMOTION_PERCENT)
                    demote_count = math.ceil(total_players * DEMOTION_PERCENT)

                    # === ЛОГІКА ПІДВИЩЕННЯ (PROMOTION) ===
                    # Якщо це не остання ліга (World)
                    if league != LeagueEnum.WORLD:
                        current_idx = LEAGUE_ORDER.index(league)
                        next_league = LEAGUE_ORDER[current_idx + 1]

                        # Беремо ТОП-N гравців за очками пасса
                        promoted_users = users[:promote_count]

                        for u in promoted_users:
                            # Змінюємо лігу
                            u.league = next_league
                            # Тут можна додати лог або видачу нагороди за підвищення

                        if promoted_users:
                            report.append(
                                f"[{league.value}] ⬆️ Promoted top {len(promoted_users)} (Best: {promoted_users[0].user_name}) to {next_league.value}")

                    # === ЛОГІКА ПОНИЖЕННЯ (DEMOTION) ===
                    # Якщо це не перша ліга (Bronze)
                    if league != LeagueEnum.BRONZE:
                        current_idx = LEAGUE_ORDER.index(league)
                        prev_league = LEAGUE_ORDER[current_idx - 1]

                        # Понижуємо, тільки якщо в лізі достатньо людей (наприклад, > 10)
                        # Це захист, щоб не понижувати, якщо в лізі всього 3 людини
                        if total_players >= 10:
                            # Беремо НИЗ списку (найменше очок пасса)
                            demoted_users = users[-demote_count:]

                            for u in demoted_users:
                                u.league = prev_league

                            if demoted_users:
                                report.append(
                                    f"[{league.value}] ⬇️ Demoted bottom {len(demoted_users)} players to {prev_league.value}")

                # В цьому місці (кінець async with) відбудеться автоматичний COMMIT змін ліг

            return report
        return []

    @classmethod
    async def reset_season_points(cls):
        """
        Обнулення очок SEASON PASS у всіх користувачів.
        Викликається ПІСЛЯ перерахунку ліг.
        """
        async for session in get_session():
            async with session.begin():
                # Масове оновлення таблиці season_pass
                await session.execute(update(SeasonPass).values(points=0))
            return

    @classmethod
    async def end_season_procedure(cls):
        """
        Повний цикл закриття сезону:
        1. Перерахунок ліг на основі поточних очок.
        2. Обнулення очок.
        """
        # Спочатку перераховуємо ліги, поки очки ще є!
        report = await cls.process_season_transition()

        # Потім обнуляємо очки
        await cls.reset_season_points()

        return report