import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
NAMES_FILE = BASE_DIR / "male_names_generated.json"

def load_male_names() -> set[str]:
    with open(NAMES_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    names = data.get("names")
    if not isinstance(names, list):
        raise ValueError("Invalid male_names_generated.json format")

    return set(names)
