from aiogram.types import InlineKeyboardButton, WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder

from database.models.user_bot import (
    UserBot,
    STATUS_USER_REGISTER
)

from bot.callbacks.magazine_callbacks import (
    SelectBox,
)

from database.models.types import TypeBox

ALL_BUTTONS_MENU_STORE = {
    "🎁 Крамниця лутбоксів": "store_boxes",
    "⚡ Крамниця енергії": "massage_room",
    "🏦 Банк": "bank",
    "🎫 V.I.P Пасс": "vip_pass",
}

AVAILABLE_BUTTONS_BY_STATUS = {
    STATUS_USER_REGISTER.END_REGISTER: list(ALL_BUTTONS_MENU_STORE.keys())
}


def menu_stores(user: UserBot):
    builder = InlineKeyboardBuilder()
    available_buttons = AVAILABLE_BUTTONS_BY_STATUS.get(user.status_register, [])

    for button_text, callback in ALL_BUTTONS_MENU_STORE.items():
        if button_text in available_buttons:
            if user.status_register != STATUS_USER_REGISTER.END_REGISTER:
                final_text = f"✅ {button_text} ✅"
            else:
                final_text = button_text
            callback_data = callback
        else:
            final_text = f"🔒 {button_text}"
            callback_data = "block"

        builder.button(text=final_text, callback_data=callback_data)

    builder.adjust(2)
    builder.row(
        InlineKeyboardButton(
            text="⚽ Купити у WebApp",
            web_app=WebAppInfo(
                url=f"https://football-blitz.online/shop?user_id={user.user_id}")
        )
    )
    return builder.as_markup(resize_keyboard=True)

#===================BOXES
def select_box():
    return (InlineKeyboardBuilder()
            .button(
                text="▪️ Маленький бокс футболіста", 
                callback_data=SelectBox(
                    type_box = TypeBox.SMALL_BOX
                )
            )
            .button(
                text="◾️ Середній бокс футболіста", 
                callback_data=SelectBox(
                    type_box = TypeBox.MEDIUM_BOX
                )
            )
            .button(
                text="◼️ Преміум Бокс",
                callback_data=SelectBox(
                    type_box = TypeBox.LARGE_BOX
                )
            )
            
            .adjust(1)
            .as_markup()
            )

def buy_box(url_payment: str):
    return (InlineKeyboardBuilder()
            .button(
                text = "🎁 Купити бокс", 
                url = url_payment
            )
            .as_markup()
            )
    
