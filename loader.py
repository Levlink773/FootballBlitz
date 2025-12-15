from aiogram.types import MenuButtonWebApp, WebAppInfo
from aiohttp import web
from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.types.bot_command import BotCommand
from aiogram.types.bot_command_scope_chat import BotCommandScopeChat

from database.session import engine
from database.model_base import Base

from config import (
    BOT_TOKEN, 
    ADMINS, 
)
from logging_config import logger
from schedulers.one_off_scheduler import OneOffScheduler


async def init_bot_command():
    commands = [
        BotCommand(command="send_message", description="Отправить сообщение всем пользователям")]

    for admin_id in ADMINS:
        try:
            await bot.set_my_commands(commands,
                              scope=BotCommandScopeChat(chat_id=admin_id))
        except Exception as e:
            logger.warning(f"Warn: {e}")

async def set_default_menu():
    await bot.set_chat_menu_button(
        # не передаём chat_id => это будет default (у всех пользователей)
        menu_button=MenuButtonWebApp(
            text="Open",
            web_app=WebAppInfo(url="https://football-blitz.online/")
        )
    )
  
async def start():
    await init_bot_command()
    await set_default_menu()
    await init_db()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

dp = Dispatcher()
bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
dp.startup.register(start)
task_scheduler = OneOffScheduler()
app = web.Application()

