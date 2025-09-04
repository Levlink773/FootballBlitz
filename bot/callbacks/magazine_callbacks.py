from aiogram.filters.callback_data import CallbackData
from database.models.types import TypeBox
    
class SelectBox(CallbackData, prefix = "select_box"):
    type_box: TypeBox