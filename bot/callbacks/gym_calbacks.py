from aiogram.filters.callback_data import CallbackData
from datetime import timedelta
    
class SelectTimeGym(CallbackData, prefix="select_time_gym"):
    gym_time: timedelta
    
class SelectCountDonateEnergy(CallbackData, prefix = "select_donate_energy"):
    count_energy: int
    club_id: int