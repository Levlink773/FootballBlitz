from sqlalchemy.orm import selectinload

from database.models.character import Character
from database.models.user_bot import UserBot

from database.session import get_session
from sqlalchemy import select, desc


class AdminFunctionalService:

    @classmethod
    async def get_new_members_users(cls, count_members: int) -> list[UserBot]:
        async for session in get_session():
            async with session.begin():
                try:
                    stmt = (
                        select(UserBot)
                        .order_by(desc(UserBot.user_time_register))
                        .limit(count_members).options(
                            selectinload(UserBot.characters)
                            .selectinload(Character.reminder),
                            selectinload(UserBot.characters)
                            .selectinload(Character.owner),
                            selectinload(UserBot.main_character)
                            .selectinload(Character.reminder),
                            selectinload(UserBot.main_character)
                            .selectinload(Character.owner),
                            selectinload(UserBot.statistics)
                        )
                    )
                    result = await session.execute(stmt)
                    return result.unique().scalars().all()
                except Exception as E:
                    print(E)
