from aiogram.filters.state import State, StatesGroup

class RegisterUserState(StatesGroup):
    send_team_name = State()