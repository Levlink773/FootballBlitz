from datetime import datetime
from typing import Optional

from sqlalchemy import select, update

from database.models.character import Character
from database.models.training import TrainingTimer, CharacterJoinTraining
from database.session import get_session


class TrainingService:
    
    @classmethod
    async def add_character_to_training(
        cls, 
        character_id: int,
        user_id: int
    ) -> None:
        async for session in get_session():
            async with session as sess:  
                obj = CharacterJoinTraining(
                    character_id=character_id,
                    user_id=user_id,
                )
                sess.add(obj)
                await sess.commit()
                
    @classmethod
    async def register_training_timer(
        cls,
        time_start: datetime
    ) -> None:
        async for session in get_session():
            async with session as sess:
                obj = TrainingTimer(
                    time_start = time_start
                )
                sess.add(obj)
                await sess.commit()
          
    @classmethod
    async def get_last_training_timer(cls) -> TrainingTimer | None:
        async for session in get_session():
            async with session as sess:
                query = (
                    select(TrainingTimer)
                    .order_by(TrainingTimer.id.desc())
                    .limit(1)
                )
                result = await session.execute(query)
                return result.scalar()
            
    @classmethod
    async def get_joined_users(
        cls, 
        range_training_times: tuple[datetime, datetime]
    ) -> list[CharacterJoinTraining] | None:
        
        start_time = range_training_times[0]
        end_time = range_training_times[1]
        
        async for session in get_session():
            async with session as sess:
                query = (
                    select(CharacterJoinTraining)
                    .where(
                        CharacterJoinTraining.time_join >= start_time,
                        CharacterJoinTraining.time_join < end_time
                    )
                )
                result = await sess.execute(query)
                return list(result.unique().scalars().all())

            
    @classmethod
    async def end_user_training(cls, user_id: int) -> None:
        async for session in get_session():
            async with session as sess:
                query = (
                    update(CharacterJoinTraining)
                    .where(CharacterJoinTraining.user_id == user_id)
                    .values(training_is_end = True)
                )
                await sess.execute(query)
                await sess.commit()
        
    @classmethod
    async def update_score_user(
        cls, 
        user_id: int, 
        score: int
    ) -> None:
        
        async for session in get_session():
            async with session as sess:
                query = (
                    update(CharacterJoinTraining)
                    .where(CharacterJoinTraining.user_id == user_id)
                    .where(CharacterJoinTraining.training_is_end == False)
                    .values(scores = score)
                )
                await sess.execute(query)
                await sess.commit()
                
    @classmethod
    async def user_is_join_to_training(
        cls, 
        user_id: int,
        range_training_times: list[datetime]
    ) -> Optional[CharacterJoinTraining]:
        
        start_time = range_training_times[0]
        end_time = range_training_times[1]
        async for session in get_session():
            async with session as sess:
                query = (
                    select(CharacterJoinTraining)
                    .where(CharacterJoinTraining.user_id == user_id)
                    .where(CharacterJoinTraining.time_join >= start_time)
                    .where(CharacterJoinTraining.time_join < end_time)
                )
                result = await sess.execute(query)
                return result.scalar()


    @classmethod
    async def reset_training_keys(cls) -> None:
        async for session in get_session():
            async with session as sess:
                query_increment = (
                    update(Character)
                    .where(Character.training_key < 3)
                    .values(training_key=Character.training_key + 1)
                )
                await sess.execute(query_increment)

                query_reset_negative = (
                    update(Character)
                    .where(Character.training_key <= 0)
                    .values(training_key=1)
                )
                await sess.execute(query_reset_negative)

                await sess.commit()
                
    @classmethod
    async def get_characters_how_not_have_key(cls) -> list[Character] | None:
        async for session in get_session():
            async with session as sess:
                query = (
                    select(Character)
                    .where(Character.training_key < 3)
                )
                result = await sess.execute(query)
                return list(result.unique().scalars().all())
            
    @classmethod
    async def anulate_user_training(cls, user_id: int) -> None:
        async for session in get_session():
            async with session as sess:
                query = (
                    update(CharacterJoinTraining)
                    .where(CharacterJoinTraining.user_id == user_id)
                    .values(training_is_end = False)
                    .values(scores = 0)
                )
                await sess.execute(query)
                await sess.commit()
                