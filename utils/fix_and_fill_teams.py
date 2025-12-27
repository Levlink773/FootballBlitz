import asyncio
from typing import List, Dict

from sqlalchemy import select
from sqlalchemy.orm import selectinload

# Переконайтесь, що імпорти правильні для вашої структури проекту
from database.models.character import Character, Position
from database.models.user_bot import UserBot
from database.session import get_session
from services.character_service import CharacterService
from logging_config import logger
from utils.generate_character import CharacterData, get_character

# 🎯 ЦІЛЬОВА СХЕМА (1-4-3-3)
TARGET_QUOTA = {
    Position.GOALKEEPER: 1,
    Position.DEFENDER: 4,
    Position.MIDFIELDER: 3,
    Position.ATTACKER: 3
}

# Мапінг Enum позицій на префікси для squad_position
POSITION_PREFIXES = {
    Position.GOALKEEPER: "gk",
    Position.DEFENDER: "def",
    Position.MIDFIELDER: "mid",
    Position.ATTACKER: "att"
}


async def process_teams():
    logger.info("🚀 Починаємо балансування, дозаповнення та розстановку команд...")

    async for session in get_session():
        # Вибираємо користувачів, які зіграли хоча б 1 матч
        stmt = (
            select(UserBot)
            .where(UserBot.final_count_of_matches > 0)
            .options(selectinload(UserBot.characters))
        )
        result = await session.execute(stmt)
        users = result.scalars().all()

        count_processed = 0

        for user in users:
            # -------------------------------------------------------------
            # ПЕРЕВІРКА: Чи потребує команда втручання?
            # -------------------------------------------------------------

            # 1. Перевірка кількості
            if len(user.characters) < 11:
                needs_fix = True
            else:
                # 2. Перевірка позицій (Squad Position)
                # Якщо хоч один гравець з "основи" (найсильніші) не має позиції або має неправильну
                # (наприклад, воротар стоїть у нападі), вважаємо, що треба фіксити.
                # Для спрощення: перевіряємо, чи заповнені слоти.

                # Рахуємо поточні ролі
                current_roles = {pos: 0 for pos in Position}
                for char in user.characters:
                    if char.position:
                        current_roles[char.position] += 1

                # Чи відповідають ролі схемі?
                roles_ok = all(current_roles.get(p, 0) >= q for p, q in TARGET_QUOTA.items())

                # Чи проставлені squad_position у 11 гравців?
                squad_pos_count = sum(1 for c in user.characters if c.squad_position is not None)
                pos_assigned = squad_pos_count == 11

                if roles_ok and pos_assigned:
                    continue  # Все добре, пропускаємо юзера

                needs_fix = True

            if not needs_fix:
                continue

            count_processed += 1
            logger.info(f"🔧 Обробка User {user.user_id} (Гравців: {len(user.characters)})...")

            # --- ЕТАП 1: БАЛАНСУВАННЯ ТА ЗМІНА РОЛЕЙ ---

            # Сортуємо за силою (найсильніші мають пріоритет на свої рідні позиції)
            current_chars: List[Character] = sorted(
                user.characters,
                key=lambda c: c.power,
                reverse=True
            )

            filled_slots = {pos: 0 for pos in Position}
            excess_players: List[Character] = []

            # Розподіляємо наявних: хто влізає в квоту, а хто "зайвий"
            for char in current_chars:
                pos = char.position
                # Якщо позиція є і квота ще не заповнена — займаємо слот
                if pos and filled_slots.get(pos, 0) < TARGET_QUOTA.get(pos, 0):
                    filled_slots[pos] += 1
                else:
                    excess_players.append(char)

            # Визначаємо, яких позицій НЕ ВИСТАЧАЄ
            needed_positions_queue = []
            for pos, target in TARGET_QUOTA.items():
                missing = target - filled_slots.get(pos, 0)
                if missing > 0:
                    needed_positions_queue.extend([pos] * missing)

            # Перекваліфікація "зайвих" гравців на потрібні позиції
            for char in excess_players:
                if needed_positions_queue:
                    new_pos = needed_positions_queue.pop(0)
                    if char.position != new_pos:
                        logger.warning(f"🔄 User {user.user_id}: Зміна ролі {char.name} ({char.position} -> {new_pos})")
                        char.position = new_pos
                        # Скидаємо стару розстановку, щоб не було конфліктів
                        char.squad_position = None
                        session.add(char)
                else:
                    # Якщо черга потреб пуста, але є зайві гравці -> вони йдуть на лавку (squad_position=None)
                    # Їхню роль (Position) можна не міняти, хай лишаються ким були
                    if char.squad_position is not None:
                        char.squad_position = None
                        session.add(char)

            # --- ЕТАП 2: ГЕНЕРАЦІЯ ВІДСУТНІХ ---

            if needed_positions_queue:
                logger.info(f"➕ User {user.user_id}: Додаємо {len(needed_positions_queue)} нових гравців...")
                for pos in needed_positions_queue:
                    try:
                        character_data: CharacterData = await get_character()
                        # Встановлюємо конкретну позицію
                        if isinstance(character_data, dict):
                            character_data['position'] = pos
                        else:
                            character_data.position = pos

                        # Створюємо персонажа
                        await CharacterService.create_character(character_data, user.user_id)
                    except Exception as e:
                        logger.error(f"Error creating char: {e}")

            # Зберігаємо проміжні зміни (створення та зміна ролей)
            await session.commit()

            # --- ЕТАП 3: ПРИЗНАЧЕННЯ SQUAD_POSITION (РОЗСТАНОВКА) ---

            # Оновлюємо список персонажів юзера, щоб побачити новостворених і змінених
            await session.refresh(user, attribute_names=['characters'])

            # Сортуємо всіх за силою (найсильніші йдуть в основу першими)
            all_chars = sorted(user.characters, key=lambda c: c.power, reverse=True)

            # Лічильники для індексів: {GK: 0, DEF: 0, MID: 0, ATT: 0}
            counters = {pos: 0 for pos in Position}

            for char in all_chars:
                pos = char.position

                # Якщо чомусь позиції немає (старі дані), ставимо дефолт
                if not pos:
                    pos = Position.MIDFIELDER
                    char.position = pos
                    session.add(char)

                # Перевіряємо, чи є місце в схемі для цієї позиції
                if counters[pos] < TARGET_QUOTA[pos]:
                    # Формуємо рядок типу "def_0", "att_2"
                    prefix = POSITION_PREFIXES.get(pos, "mid")
                    idx = counters[pos]

                    new_squad_pos = f"{prefix}_{idx}"

                    # Призначаємо, тільки якщо змінилось
                    if char.squad_position != new_squad_pos:
                        char.squad_position = new_squad_pos
                        session.add(char)

                    counters[pos] += 1
                else:
                    # Квота вичерпана, гравець йде на лавку
                    if char.squad_position is not None:
                        char.squad_position = None
                        session.add(char)

        # Фінальне збереження розстановки
        await session.commit()
        logger.info(f"✅ Успішно! Оброблено {count_processed} команд.")


if __name__ == "__main__":
    asyncio.run(process_teams())