from aiogram.utils.keyboard import InlineKeyboardBuilder, ReplyKeyboardBuilder

from bot.callbacks.switcher import Switcher

def menu_plosha():
    keyboard = ReplyKeyboardBuilder()
    keyboard.button(text = "⬅️ Головна площа")
    keyboard.adjust(1)
    return keyboard