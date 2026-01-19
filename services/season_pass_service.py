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
                    stmt_insert = (
                        insert(SeasonPass)
                        .values(user_id=user_pk, points=points)
                    )
                    session.add(SeasonPass(user_id=user_pk, points=points))
                
                logger.info(f"Added {points} season points to user {user_id} (PK: {user_pk})")

    @classmethod
    async def claim_reward(cls, user_id: int, points_milestone: int, tier: str) -> bool:
        """
        :param user_id: Telegram User ID
        :param points_milestone: The point milestone to claim (e.g. 20, 40)
        :param tier: 'standard' or 'vip'
        """
        async for session in get_session():
            async with session.begin():
                # 1. Fetch SeasonPass + UserBot (to check VIP status)
                # Use selectinload to eagerly load the user relationship
                from sqlalchemy.orm import selectinload
                stmt = (
                    select(SeasonPass)
                    .join(UserBot)
                    .where(UserBot.user_id == user_id)
                    .options(selectinload(SeasonPass.user))
                )
                
                result = await session.execute(stmt)
                sp = result.scalar_one_or_none()
                
                if not sp:
                    logger.warning(f"SeasonPass not found for user {user_id}")
                    return False

                # 2. Check if locked
                if sp.points < points_milestone:
                    return False
                
                # 3. Check if already collected
                rewards = sp.rewards_collected or {"standard": [], "vip": []}
                # Ensure dict structure
                if "standard" not in rewards: rewards["standard"] = []
                if "vip" not in rewards: rewards["vip"] = []
                
                if points_milestone in rewards[tier]:
                    return False # Already collected

                # 4. Check VIP status if tier is vip
                if tier == 'vip':
                     if not sp.user or not sp.user.vip_pass_is_active:
                         return False
                
                # 5. Get reward string
                reward_map = SeasonPass.VIP_REWARDS if tier == 'vip' else SeasonPass.STANDARD_REWARDS
                reward_str = reward_map.get(points_milestone)
                
                if not reward_str:
                    return False
                
                # 6. Apply reward
                from services.user_service import UserService
                await UserService._apply_reward(user_id, reward_str)
                
                # 7. Update Collected
                rewards[tier].append(points_milestone)
                
                # Force update the JSON column
                stmt_update = (
                    update(SeasonPass)
                    .where(SeasonPass.id == sp.id)
                    .values(rewards_collected=rewards)
                )
                await session.execute(stmt_update)
                
                return True

    @classmethod
    async def get_pass_info(cls, user_id: int):
        from database.models.season_pass import SeasonPass
        async for session in get_session():
            async with session.begin():
                stmt = select(SeasonPass).join(UserBot).where(UserBot.user_id == user_id)
                result = await session.execute(stmt)
                sp = result.scalar_one_or_none()
                return sp

