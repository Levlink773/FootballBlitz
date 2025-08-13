def get_base():
    from database.model_base import Base
    from database.models.user_bot import UserBot
    from database.models.character import Character
    from database.models.item import Item
    from database.models.reminder_character import ReminderCharacter
    from database.models.payment.box_payment import BoxPayment
    from database.models.payment.energy_payment import EnergyPayment
    from database.models.payment.money_payment import MoneyPayment
    from database.models.payment.payments import Payment
    from database.models.training import TrainingTimer, CharacterJoinTraining
    from database.models.blitz import Blitz
    from database.models.blitz_character import BlitzUser
    from database.models.blitz_team import BlitzTeam
    from database.models.statistics import Statistics

    return Base