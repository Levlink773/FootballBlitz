from datetime import datetime, timedelta

from sqlalchemy import select, update

from config import CONST_VIP_ENERGY
from database.models.user_bot import UserBot
from database.session import get_session
from logging_config import logger


class VipPassService:
    
    @classmethod
    async def update_vip_pass_time(
        cls,
        user: UserBot,
        day_vip_pass: int
    ):
        async for session in get_session():
            async with session.begin():
                current_time = datetime.now()
                
                new_vip_pass_time = current_time + timedelta(days=day_vip_pass)
                   
                if user.vip_pass_expiration_date is not None:
                    if user.vip_pass_expiration_date > current_time:
                        new_vip_pass_time = user.vip_pass_expiration_date + timedelta(days=day_vip_pass)
                    
                stmt = (
                    update(UserBot)
                    .where(UserBot.user_id == user.user_id)
                    .values(vip_pass_expiration_date=new_vip_pass_time)
                )
                await session.execute(stmt)
                await session.commit()
    
    
    @classmethod
    async def get_have_vip_pass_characters(cls) -> list[UserBot] | None:
        async for session in get_session():
            try:
                stmt = (
                    select(UserBot)
                    .where(UserBot.energy <= CONST_VIP_ENERGY)
                    .where(UserBot.vip_pass_expiration_date >  datetime.now())
                )
                result = await session.execute(stmt)
                return list(result.unique().scalars().all())
            except Exception as E:
                logger.error(f"Failed to get vip pass characters\nError: {E}")