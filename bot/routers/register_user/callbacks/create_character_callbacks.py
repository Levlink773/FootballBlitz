from aiogram.filters.callback_data import CallbackData
from config import Gender

class SelectGender(CallbackData, prefix="select_gender"):
    gender: Gender