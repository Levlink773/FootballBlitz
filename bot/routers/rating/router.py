from aiogram import Router

from bot.routers.rating.rating_router import rating_router

rating_characters_router = Router(name="rating_characters_router")

rating_characters_router.include_routers(
    rating_router,
)