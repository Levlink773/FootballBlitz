import random
import asyncio
from typing import Set, List, Optional

from blitz.services.blitz_service import BlitzService
from database.models.user_bot import STATUS_USER_REGISTER
from services.user_service import UserService
# from services.character_service import CharacterService # Твій сервіс персонажів
# from schemas.character import CharacterData # Твоя схема даних персонажа

from sqlalchemy import delete, select

from utils.generate_character import CharacterData, get_character

# Спробуємо імпортувати Faker для красивих імен, якщо ні - використовуємо заглушки
try:
    from faker import Faker

    fake = Faker()
except ImportError:
    fake = None

# --- КОНФІГУРАЦІЯ ---

# Великий набір назв команд
TEAM_NAMES_POOL: Set[str] = {
    "Red Dragons", "Blue Sharks", "Iron Giants", "Shadow Ninjas", "Cyber Punks",
    "Thunder Wolves", "Golden Eagles", "Space Marines", "Night Stalkers", "Fire Phoenix",
    "Storm Breakers", "Venom Cobras", "Steel Titans", "Atomic Ants", "Galaxy Guardians",
    "Mystic Mages", "Chaos Knights", "Silent Killers", "Rapid Racers", "Urban Legends",
    "Frozen Yetis", "Desert Scorpions", "Jungle Kings", "Ocean Raiders", "Solar Flares",
    "Lunar Walkers", "Phantom Ghosts", "Savage Beasts", "Noble Warriors", "Dark Matters",
    "Alpha Squad", "Omega Legion", "Delta Force", "Echo Rangers", "Bravo Bandits",
    "Spartan Elites", "Viking Raiders", "Samurai Souls", "Pirate Lords", "Ninja Turtles",
    "Rocket Stars", "Comet Crushers", "Meteor Smashers", "Asteroid Miners", "Black Holes",
    "White Dwarfs", "Red Giants", "Neutron Stars", "Pulsar Power", "Quasar Queens"
}


class BotGenerator:
    """
    Утиліта для генерації та видалення ботів.
    """

    @staticmethod
    def _get_random_team_name(used_names: Set[str]) -> str:
        """Повертає унікальне ім'я команди, яке ще не використано в цій сесії генерації."""
        available_names = list(TEAM_NAMES_POOL - used_names)

        if not available_names:
            # Якщо унікальні імена закінчились, генеруємо з числом
            return f"Bot Team {random.randint(1000, 99999)}"

        name = random.choice(available_names)
        used_names.add(name)
        return name

    @staticmethod
    def _generate_fake_user_data(bot_id_offset: int):
        """Генерує базові дані для UserBot."""
        # Генеруємо унікальний ID (від'ємний або дуже великий, щоб не перетинався з реальними TG ID)
        fake_user_id = 1000000000 + bot_id_offset

        if fake:
            name = fake.first_name()
            full_name = fake.name()
            username = fake.user_name()
        else:
            name = f"BotUser_{bot_id_offset}"
            full_name = f"Bot Full Name {bot_id_offset}"
            username = f"bot_user_{bot_id_offset}"

        return {
            "user_id": fake_user_id,
            "user_name": username,
            "user_full_name": full_name,
            "is_bot": True,
            "money": random.randint(100, 5000),
            "energy": 100,
            "count_of_training": random.randint(0, 10)
        }

    @classmethod
    async def create_bots(cls, count: int, add_to_blitz_id: Optional[int] = None, add_to_blitz_max_char: Optional[int] = None):
        """
        Створює задану кількість ботів, їх персонажів та налаштовує статус.
        """
        print(f"🔄 Починаю створення {count} ботів...")
        used_team_names = set()

        # Отримуємо CharacterService всередині методу, щоб уникнути циклічних імпортів, якщо вони є
        from services.character_service import CharacterService

        created_count = 0

        for i in range(count):
            try:
                # 1. Підготовка даних юзера
                user_kwargs = cls._generate_fake_user_data(i)
                user_kwargs['team_name'] = cls._get_random_team_name(used_team_names)

                # 2. Створення UserBot через існуючий сервіс
                user = await UserService.create_user(**user_kwargs)
                if not user:
                    print(f"⚠️ Не вдалося створити бота #{i}")
                    continue

                # 3. Генерація даних персонажа
                character_data: CharacterData = await get_character()

                # 4. Створення персонажа (використовуємо твій сервіс)
                # Припускаємо, що метод create_character приймає (data, user_id)
                await CharacterService.create_character(character_data, user.user_id)

                # 5. Прив'язка Main Character (Логіка з твого прикладу)
                # Цей метод знаходить персонажа і робить його головним
                user = await UserService.assign_main_character_if_none(user.user_id)

                # 6. Оновлення статусу реєстрації (Логіка з твого прикладу)
                await UserService.edit_status_register(user.user_id, STATUS_USER_REGISTER.END_REGISTER)
                if add_to_blitz_id and add_to_blitz_max_char:
                    await BlitzService.add_users_to_blitz(add_to_blitz_id, user, add_to_blitz_max_char)
                created_count += 1

                # Невеликий лог кожні 10 ботів
                if created_count % 10 == 0:
                    print(f"✅ Створено {created_count}/{count} ботів")

            except Exception as e:
                print(f"❌ Помилка при створенні бота #{i}: {e}")

        print(f"🎉 Готово! Успішно створено {created_count} ботів.")