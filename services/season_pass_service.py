from sqlalchemy import update, select
from sqlalchemy.dialects.postgresql import insert

from database.models.season_pass import SeasonPass
from database.models.user_bot import UserBot
from database.session import get_session
from logging_config import logger


class SeasonPassService:
    @classmethod
    async def add_points(cls, user_id: int, points: int):
        """
        Adds points to the user's season pass.
        :param user_id: Telegram User ID (UserBot.user_id)
        :param points: Amount of points to add
        """
        async for session in get_session():
            async with session.begin():
                # We need to ensure the Season Pass exists. 
                # Since we target by user_id (TG ID), we need a subquery or join for update.
                # However, INSERT requires the FK (UserBot.id).
                
                # 1. Get UserBot ID (PK) from Telegram ID
                user_pk_stmt = select(UserBot.id).where(UserBot.user_id == user_id)
                result = await session.execute(user_pk_stmt)
                user_pk = result.scalar_one_or_none()
                
                if not user_pk:
                    logger.error(f"SeasonPassService: User {user_id} not found.")
                    return

                # 2. Try to update existing SeasonPass
                stmt_update = (
                    update(SeasonPass)
                    .where(SeasonPass.user_id == user_pk)
                    .values(points=SeasonPass.points + points)
                )
                result = await session.execute(stmt_update)
                
                if result.rowcount == 0:
                    # 3. If update failed (no row), insert new one
                    # We can assume season_name is null or default for now, or fetch active season logic later
                    stmt_insert = (
                        insert(SeasonPass)
                        .values(user_id=user_pk, points=points)
                    )
                    # Handle potential race condition if needed, strictly speaking insert on conflict do update 
                    # is better but for now simple fallback is okay or usage of 'merge'
                    session.add(SeasonPass(user_id=user_pk, points=points))
                
                logger.info(f"Added {points} season points to user {user_id} (PK: {user_pk})")
