import random

from config import Gender
from constants import MIN_PRICE_FIRST_CHARACTER
from utils.generate_character import COUNTRY_WEIGHTS, generate_power, CheckCharacterType, check_character, CharacterData
from utils.name_loader import load_male_names


def generate_talent(min_v=1, max_v=9):
    # Генерация таланта по вероятностям, но с фильтрацией по диапазону
    talent_ranges = [
        (list(range(1, 4)), 0.60),  # 1–3 → 60%
        (list(range(4, 7)), 0.25),  # 4–6 → 25%
        ([7], 0.075),  # 7 → 7.5%
        ([8], 0.05),  # 8 → 5%
        ([9], 0.025)  # 9 → 2.5%
    ]
    
    # 1. Фильтруем диапазоны, которые попадают (хотя бы частично) в [min_v, max_v]
    valid_ranges = []
    valid_weights = []
    
    for r_vals, weight in talent_ranges:
        # Пересечение запрошенного диапазона и диапазона из конфига
        intersection = [v for v in r_vals if min_v <= v <= max_v]
        if intersection:
            valid_ranges.append(intersection)
            valid_weights.append(weight)
            
    if not valid_ranges:
        # Фолбек, если ничего не попало (например min=8, max=8)
        return random.randint(min_v, max_v)
        
    # 2. Выбираем диапазон (по весам, которые есть)
    chosen_range = random.choices(valid_ranges, weights=valid_weights, k=1)[0]
    
    # 3. Случайное число из выбранного (пересеченного) диапазона
    return random.choice(chosen_range)


def generate_free_agent_character(male_names: set[str], min_talent=1, max_talent=9) -> CharacterData:
    # Определяем пол
    gender = Gender.MAN

    # Выбираем имя по полу
    name = random.choice(list(male_names))

    # Выбираем страну с учетом весов
    countries = list(COUNTRY_WEIGHTS.keys())
    weights = list(COUNTRY_WEIGHTS.values())
    country = random.choices(countries, weights=weights, k=1)[0]
    talent = generate_talent(min_talent, max_talent)
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


async def get_free_agent(min_talent=1, max_talent=9):
    male_names = load_male_names()
    attempts = 0

    while attempts < 50:
        if not male_names:
            break

        character_data = generate_free_agent_character(male_names, min_talent, max_talent)
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
    return generate_free_agent_character({fallback_name}, min_talent, max_talent)
