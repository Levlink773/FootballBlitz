import random
from typing import Optional

from aiogram.types import FSInputFile, Message

from database.models.character import Character
from loader import bot
from logging_config import logger


async def send_message_characters_club(
    characters_club: list[Character],                                   
    my_character: Character | None, 
    text: str,
    photo: Optional[str | FSInputFile] = None
) -> Optional[Message]:
        
    messages_photos = []
    for character in characters_club:
        if my_character and character.characters_user_id == my_character.characters_user_id:
            continue
        try:
            if photo:
                message_photo = await bot.send_photo(
                    chat_id=character.characters_user_id,
                    photo=photo,
                    caption=text
                )
                messages_photos.append(message_photo)
            else:
                await bot.send_message(chat_id= character.characters_user_id, text = text)
                
        except Exception as E:
            logger.error(f"НЕ СМОГ ОТПРАВИТЬ СООБЩЕНИЕ ПЕРСОНАЖУ {character.name}")
    
    return random.choice(messages_photos) if messages_photos else []
            
            