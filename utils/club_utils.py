import random
from datetime import datetime, timedelta
from typing import Optional

from aiogram.types import FSInputFile, Message

from database.models.character import Character
from database.models.user_bot import UserBot
from loader import bot
from logging_config import logger


async def send_message_user_team(
    user_team: list[UserBot],
    my_user: Character | None,
    text: str,
    photo: Optional[str | FSInputFile] = None
) -> Optional[Message]:
        
    messages_photos = []
    for user in user_team:
        if my_user and user.user_id == user.user_id:
            continue
        try:
            if photo:
                message_photo = await bot.send_photo(
                    chat_id=user.user_id,
                    photo=photo,
                    caption=text
                )
                messages_photos.append(message_photo)
            else:
                await bot.send_message(chat_id= user.user_id, text = text)
                
        except Exception as E:
            logger.error(f"НЕ СМОГ ОТПРАВИТЬ СООБЩЕНИЕ ПЕРСОНАЖУ {user.user_name}")
    
    return random.choice(messages_photos) if messages_photos else []


def get_text_education_center_reward(coins: int, energy: int, delta_time_education_reward: timedelta) -> str:
    current_time = datetime.now()
    next_reward_time = current_time + delta_time_education_reward
    next_reward_time_formatted = next_reward_time.strftime("%d-%m-%Y %H:%M:%S")

    message = f"""
🎓 <b>Після навчального центру ваш персонаж отримав:</b>
💰 {coins} <b>монет</b>
🔋 {energy} <b>енергії</b>

🕒 <b>Ви зможете отримати наступну нагороду через:</b> {delta_time_education_reward} <b>о {next_reward_time_formatted}</b>
"""
    return message