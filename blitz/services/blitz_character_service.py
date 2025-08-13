from sqlalchemy import select, update
from sqlalchemy.orm import selectinload

from database.models.blitz_character import BlitzUser
from database.models.user_bot import UserBot
from database.session import get_session


class BlitzUserService:
    @classmethod
    async def get_user_from_blitz_user(cls, blitz_users: BlitzUser) -> UserBot | None:
        async for session in get_session():
            result = await session.execute(
                select(UserBot)
                .where(UserBot.user_id == blitz_users.user_id).options(
                    selectinload(UserBot.characters),
                    selectinload(UserBot.main_character),
                    selectinload(UserBot.statistics)
                )
            )
            return result.scalar_one_or_none()

    @classmethod
    async def add_goal_to_user(cls, user_id: int):
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(BlitzUser)
                    .where(BlitzUser.user_id == user_id)
                    .values(goals_count=BlitzUser.goals_count + 1)
                )
                await session.execute(stmt)
                await session.commit()

    @classmethod
    async def add_score_to_user(
            cls,
            user_id: int,
            add_score: float
    ) -> None:
        async for session in get_session():
            async with session.begin():
                stmt = (
                    update(BlitzUser)
                    .where(BlitzUser.user_id == user_id)
                    .values(count_score=BlitzUser.count_score + add_score)
                )
                await session.execute(stmt)
                await session.commit()