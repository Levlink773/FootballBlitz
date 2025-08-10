from aiogram.utils.keyboard import InlineKeyboardBuilder




def select_option_newsletter():
    return (
        InlineKeyboardBuilder()
        .button(text = "По exp", 
                callback_data = "newsletter_exp")
        # .button(text = "По дате регистрации",
        #         callback_data = "newsletter_time_reg")
        .button(text = "По всем пользователям", 
                callback_data = "newsletter_all_users")
        .adjust(1)
        .as_markup()
    )
        