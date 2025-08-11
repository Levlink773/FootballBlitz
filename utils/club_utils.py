import random
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
            
            