# transfer_character.py
import datetime
from enum import Enum as EnumBase

from sqlalchemy import Column, BigInteger, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship

from database.model_base import Base

class TransferType(EnumBase):
    TRANSFER = 0
    FREE_AGENTS = 1

class TransferCharacter(Base):
    __tablename__ = 'transfer_characters'

    id = Column(BigInteger, primary_key=True, index=True)
    characters_id = Column(BigInteger, ForeignKey('characters.id'), unique=True)  # <<< делаем уникальным
    created_at = Column(DateTime, default=datetime.datetime.now)
    price = Column(BigInteger, nullable=False, default=0)
    transfer_type = Column(Enum(TransferType), default=TransferType.TRANSFER)

    character = relationship(
        "Character",
        back_populates="transfer",
        lazy="selectin"
    )