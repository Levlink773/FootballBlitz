from database.models.character import Character

from database.session import get_session
from sqlalchemy import select, desc


class AdminFunctionalService:
                    
    @classmethod
    async def get_new_members_character(cls, count_members: int) -> list[Character]:
        async for session in get_session():
            async with session.begin():
                try:
                    stmt = (
                        select(Character)
                        .order_by(desc(Character.created_at))
                        .limit(count_members)
                    )
                    result = await session.execute(stmt)
                    return result.unique().scalars().all()
                except Exception as E:
                    print(E)