from sqlalchemy import select

from database.models.transfer_character import TransferCharacter, TransferType
from database.session import get_session


class TransferCharacterService:
    @classmethod
    async def get_all(cls) -> list[TransferCharacter] | None:
        async for session in get_session():
            async with session.begin():
                result = await session.execute(select(TransferCharacter).where(TransferCharacter.transfer_type == TransferType.TRANSFER))
                return list(result.scalars().all())

    @classmethod
    async def get_by_id(cls, transfer_id: int) -> TransferCharacter | None:
        async for session in get_session():
            async with session.begin():
                result = await session.execute(
                    select(TransferCharacter).where(TransferCharacter.id == transfer_id)
                )
                return result.scalar_one_or_none()

    @classmethod
    async def create(
        cls,
        characters_id: int,
        price: int,
        transfer_type,
    ) -> TransferCharacter | None:
        async for session in get_session():
            async with session.begin():
                transfer = TransferCharacter(
                    characters_id=characters_id,
                    price=price,
                    transfer_type=transfer_type
                )
                session.add(transfer)
                await session.flush()
                return transfer

    @classmethod
    async def update(
        cls,
        transfer_id: int,
        characters_id: int | None = None,
        price: int | None = None,
        transfer_type=None,
    ) -> type[TransferCharacter] | None:
        async for session in get_session():
            async with session.begin():
                transfer = await session.get(TransferCharacter, transfer_id)
                if not transfer:
                    return None

                if characters_id is not None:
                    transfer.characters_id = characters_id
                if price is not None:
                    transfer.price = price
                if transfer_type is not None:
                    transfer.transfer_type = transfer_type

                await session.flush()
                return transfer

    @classmethod
    async def delete(cls, transfer_id: int) -> bool | None:
        async for session in get_session():
            async with session.begin():
                transfer = await session.get(TransferCharacter, transfer_id)
                if not transfer:
                    return False
                await session.delete(transfer)
                return True
