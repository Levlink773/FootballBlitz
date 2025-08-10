import asyncio
from datetime import datetime, time

from blitz.start_blitz import StartBlitzs, BlitzData
from schedulers.scheduler_energy import EnergyResetScheduler, EnergyApliedClubResetScheduler
from schedulers.scheduler_education import EducationRewardReminderScheduler
from schedulers.scheduler_buy_energy import ReminderBuyEnergy
from schedulers.scheduler_gym_rasks import GymStartReseter
from schedulers.scheduler_training import ReminderTraning
from schedulers.scheduler_vip_pass import VipPassSchedulerService
from schedulers.scheduler_reset_training_key import ResetTrainingKeyScheduler

from training.timers.starter_taimers import SchedulerRegisterTraining


from database.events.event_listener import (
    energy_listener,
    exp_listener,
    new_member_exp_listener
)

async def start_utils():

    asyncio.create_task(StartBlitzs.start([
        BlitzData(start_time=time(15, 0), stages_of_final=4, reward_exp=30),
        BlitzData(start_time=time(19, 0), stages_of_final=5, path_register_image="blitz/blitz_match/photos/reg_blitz19.png")
    ])) # bltiz init
    await energy_listener.start_listener()
    await exp_listener.start_listener()
    await new_member_exp_listener.start_listener()

    await reset_energy_characters.start_reset_energy()
    await reset_aplied_energy_club.start_reset_energy()
    await education_reward_reminder.start_reminder()    
    # await gym_reminder.start_iniatialization_gym()
    await reminder_buy_energy.start()
    await reminder_go_to_training.start()
    await reminder_vip_pass.start_timers()
    await scheduler_reset_training_key.start()
    await scheduler_training.start()




reset_energy_characters   = EnergyResetScheduler()
reset_aplied_energy_club  = EnergyApliedClubResetScheduler()
education_reward_reminder = EducationRewardReminderScheduler()
# gym_reminder              = GymStartReseter()
reminder_buy_energy       = ReminderBuyEnergy()
reminder_go_to_training   = ReminderTraning()
reminder_vip_pass         = VipPassSchedulerService()
scheduler_reset_training_key = ResetTrainingKeyScheduler()

scheduler_training = SchedulerRegisterTraining()