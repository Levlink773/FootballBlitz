import logging
from datetime import timedelta

from aiogram import Bot
from aiogram.types import Message, CallbackQuery, ErrorEvent, User

from database.models.character import Character
from database.models.types import TypeBox
from database.models.user_bot import UserBot

from typing import Any, Awaitable, Callable, Dict, Coroutine

from logging_config import logger
from services.character_service import CharacterService
from services.reminder_character_service import RemniderCharacterService
from services.user_service import UserService

from loader import dp, task_scheduler
from utils.box_utils import give_scheduled_box


async def get_user(user_bot: User) -> UserBot | None:
    try:
        user = await UserService.get_user(user_id=user_bot.id)
        if not user:
            await UserService.create_user(
                user_id = user_bot.id,
                user_name = user_bot.username,
                user_full_name = user_bot.full_name,
            )
            user = await UserService.get_user(user_id=user_bot.id)
            await task_scheduler.schedule_task(
                func=give_scheduled_box,
                delay=timedelta(hours=6),
                # Передаем словарь аргументов. Теперь класс это обработает правильно.
                kwargs={
                    'user_id': user.user_id,
                    'box_type': TypeBox.SMALL_BOX,
                    'time_box': '6'
                },
                job_id=f"reg_bonus_6h_{user.user_id}"
            )

            # 24 часа
            await task_scheduler.schedule_task(
                func=give_scheduled_box,
                delay=timedelta(hours=24),
                kwargs={
                    'user_id': user.user_id,
                    'box_type': TypeBox.MEDIUM_BOX,
                    'time_box': '24'
                },
                job_id=f"reg_bonus_24h_{user.user_id}"
            )
        return user
    except Exception as E:
        logging.error(E)


@dp.error()
async def error_middleware(
    event: ErrorEvent,
    bot: Bot):
    logging.error("Critical error caused by %s", event.exception, exc_info=True)

@dp.callback_query.outer_middleware()
@dp.message.outer_middleware()
async def message_middleware(
    handler: Callable[[Message|CallbackQuery, Dict[str, Any]], Awaitable[Any]],
    event: Message|CallbackQuery,
    data: Dict[str, Any]
) -> Any:
    user  = await get_user(event.from_user)
    character = None
    if user.characters:
        if (not user.main_character) or (user.main_character not in user.characters):
            user = await UserService.assign_main_character_if_none(user.user_id)
        character: Character = user.main_character if user.main_character else None
    if character:
        if not character.reminder:
            logger.warning("Not reminder for character %s", character.id)
            await RemniderCharacterService.create_character_reminder(character_id=character.id)
            characters: list[Character] = await CharacterService.get_characters(character.id)
            character :Character = characters[0] if characters else None
    logger.info(f"Main character {character}")
    data.update({"user":user, "character": character})
    result = await handler(event, data)
    if isinstance(event, CallbackQuery):
        try:
            await event.answer()
        except:
            pass
    return result