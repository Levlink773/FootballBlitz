import asyncio

from blitz.start_blitz import StartBlitzs
from blitz.utils import blitz_scheduler
from database.events.event_listener import (
    energy_listener,
    exp_listener,
    new_member_exp_listener
)
from gym_character.core.scheduler import GymStartReseter
from schedulers.scheduler_anulate_statistics import AnulateStatisticsScheduler
from schedulers.scheduler_buy_energy import ReminderBuyEnergy
from schedulers.scheduler_change_age import AgeUpdateScheduler
from schedulers.scheduler_education import EducationRewardReminderScheduler
from schedulers.scheduler_energy import EnergyResetScheduler
from schedulers.scheduler_training import ReminderTraning
from schedulers.transfer_scheduler import FreeAgentsScheduler


async def start_utils():

    asyncio.create_task(StartBlitzs.start(blitz_scheduler)) # bltiz init
    await free_agent_scheduler.start()
    await energy_listener.start_listener()
    await exp_listener.start_listener()
    await new_member_exp_listener.start_listener()
    await age_update_scheduler.start()
    await reset_energy_characters.start_reset_energy()
    await education_reward_reminder.start_reminder()    
    await gym_reminder.start_iniatialization_gym()
    await reminder_buy_energy.start()
    await reminder_go_to_training.start()
    await anulate_statics.start()
    # await reminder_vip_pass.start_timers()
    # await scheduler_reset_training_key.start()
    # await scheduler_training.start()



reset_energy_characters   = EnergyResetScheduler()
education_reward_reminder = EducationRewardReminderScheduler()
gym_reminder              = GymStartReseter()
age_update_scheduler = AgeUpdateScheduler()
reminder_buy_energy       = ReminderBuyEnergy()
reminder_go_to_training   = ReminderTraning()
anulate_statics = AnulateStatisticsScheduler()
free_agent_scheduler = FreeAgentsScheduler()
# reminder_vip_pass         = VipPassSchedulerService()
# scheduler_reset_training_key = ResetTrainingKeyScheduler()

# scheduler_training = SchedulerRegisterTraining()