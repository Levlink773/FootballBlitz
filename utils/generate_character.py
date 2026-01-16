import random
from dataclasses import dataclass
from enum import Enum

from config import Gender, Country
from constants import POWER_MUL, TALENT_MUL, AGE_MUL, MIN_PRICE_FIRST_CHARACTER
from database.models.character import Position
from utils.name_loader import load_male_names


@dataclass
class CharacterData:
    name: str
    talent: int
    age: int
    power: float
    gender: Gender
    country: Country
    position: Position = Position.MIDFIELDER

    @property
    def price(self):
        return (self.power * POWER_MUL) + (self.talent * TALENT_MUL) - (self.age * AGE_MUL)


# Веса стран по популярности футбола (чем больше число — тем чаще страна выпадает)
COUNTRY_WEIGHTS = {
    Country.BRAZIL: 10,
    Country.ARGENTINA: 9,
    Country.FRANCE: 8,
    Country.GERMANY: 8,
    Country.SPAIN: 8,
    Country.ENGLAND: 8,
    Country.PORTUGAL: 7,
    Country.ITALY: 7,
    Country.NETHERLANDS: 6,
    Country.BELGIUM: 6,
    Country.CROATIA: 6,
    Country.URUGUAY: 5,
    Country.MEXICO: 5,
    Country.UKRAINE: 5,
    Country.MOROCCO: 4,
    Country.SENEGAL: 4,
    Country.NIGERIA: 4,
    Country.JAPAN: 3,
    Country.SOUTH_KOREA: 3,
    Country.USA: 2,
    Country.CANADA: 1,
}

# Примеры имен



class CheckCharacterType(Enum):
    SUCCESS = 0
    INVALID_NAME = 1
    INVALID_MIN_PRICE = 2

def generate_talent():
    # Генерация таланта по вероятностям
    talent_ranges = [
        (list(range(1, 4)), 0.60),  # 1–3 → 60%
        (list(range(4, 7)), 0.25),  # 4–6 → 25%
        ([7], 0.075),  # 7 → 7.5%
        ([8], 0.05),  # 8 → 5%
        ([9], 0.025)  # 9 → 2.5%
    ]

    # Сначала выбираем диапазон по весам
    range_choices = [rng for rng, _ in talent_ranges]
    range_weights = [w for _, w in talent_ranges]
    chosen_range = random.choices(range_choices, weights=range_weights, k=1)[0]

    # Потом случайное значение из диапазона
    return random.choice(chosen_range)

def generate_power() -> float:
    return random.randint(20, 100)

def generate_character(male_names: set[str]) -> CharacterData:
    # Определяем пол
    gender = Gender.MAN

    # Выбираем имя по полу
    name = random.choice(list(male_names))

    # Выбираем страну с учетом весов
    countries = list(COUNTRY_WEIGHTS.keys())
    weights = list(COUNTRY_WEIGHTS.values())
    country = random.choices(countries, weights=weights, k=1)[0]
    talent = generate_talent()
    age_ranges = [
        (range(18, 24), 0.50),  # 18–23 → 50%
        (range(24, 31), 0.35),  # 24–30 → 35%
        (range(31, 35), 0.10),  # 31–34 → 10%
        (range(35, 40), 0.05)  # 35–39 → 5%
    ]

    chosen_age_range = random.choices(
        [rng for rng, _ in age_ranges],
        weights=[w for _, w in age_ranges],
        k=1
    )[0]
    age = random.choice(list(chosen_age_range))

    # Сила
    power = generate_power()

    return CharacterData(
        name=name,
        talent=talent,
        age=age,
        power=power,
        gender=gender,
        country=country
    )


async def check_character(character_data: CharacterData) -> CheckCharacterType:
    from services.character_service import CharacterService
    if character_data.price < MIN_PRICE_FIRST_CHARACTER:
        return CheckCharacterType.INVALID_MIN_PRICE
    character = await CharacterService.get_character_by_name(character_data.name)
    if character:
        return CheckCharacterType.INVALID_NAME
    return CheckCharacterType.SUCCESS


async def get_character():
    male_names = load_male_names()
    attempts = 0

    while attempts < 50:
        if not male_names:
            break

        character_data = generate_character(male_names)
        check_type = await check_character(character_data)

        match check_type:
            case CheckCharacterType.SUCCESS:
                return character_data

            case CheckCharacterType.INVALID_NAME:
                male_names.discard(character_data.name)

            case CheckCharacterType.INVALID_MIN_PRICE:
                pass

        attempts += 1

    # Фоллбек — гарантированно уникальное имя
    fallback_name = f"Player {random.randint(10_000, 1_000_000)}"
    return generate_character({fallback_name})



def character_created_message(character: CharacterData) -> str:
    country_flag = COUNTRY_FLAGS.get(character.country)
    return (
        f"🎉 Вітаємо! Вам випав новий персонаж — **{character.name} {country_flag}**.\n\n"
        f"🔹 Вік: {character.age} років\n"
        f"🔹 Талант: {character.talent}\n"
        f"🔹 Сила: {character.power}\n"
        f"🔹 Країна: {character.country.name.capitalize()} {country_flag}\n\n"
        f"Нехай цей персонаж принесе вам багато перемог і радості!"
    )
COUNTRY_FLAGS = {
    Country.UKRAINE: "🇺🇦",
    Country.ARGENTINA: "🇦🇷",
    Country.BRAZIL: "🇧🇷",
    Country.FRANCE: "🇫🇷",
    Country.GERMANY: "🇩🇪",
    Country.SPAIN: "🇪🇸",
    Country.ENGLAND: "🇬🇧",  # флаг Англии отдельный, но часто используют Великобритании 🇬🇧
    Country.ITALY: "🇮🇹",
    Country.PORTUGAL: "🇵🇹",
    Country.NETHERLANDS: "🇳🇱",
    Country.BELGIUM: "🇧🇪",
    Country.CROATIA: "🇭🇷",
    Country.URUGUAY: "🇺🇾",
    Country.MEXICO: "🇲🇽",
    Country.USA: "🇺🇸",
    Country.CANADA: "🇨🇦",
    Country.JAPAN: "🇯🇵",
    Country.SOUTH_KOREA: "🇰🇷",
    Country.MOROCCO: "🇲🇦",
    Country.SENEGAL: "🇸🇳",
    Country.NIGERIA: "🇳🇬",
}