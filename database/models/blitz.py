from datetime import datetime

from sqlalchemy import Column, Integer, DateTime, Enum
from sqlalchemy.orm import relationship
from database.model_base import Base
from enum import Enum as EnumBase

class BlitzType(EnumBase):
    VIP_BLITZ_V8 = 0
    BLITZ_V8 = 1
    BLITZ_V16 = 2
    BLITZ_V32 = 3
    BLITZ_V64 = 4

class Blitz(Base):
    __tablename__ = 'blitzs'
    id = Column(Integer, primary_key=True)
    start_at = Column(DateTime, default=datetime.now)
    blitz_type = Column(Enum(BlitzType), nullable=False, default=BlitzType.BLITZ_V16)
    cost = Column(Integer, nullable=False, default=0)
    users = relationship("BlitzUser", back_populates="blitz", cascade="all, delete-orphan")

    @property
    def can_register(self) -> bool:
        now = datetime.now()
        return now < self.start_at