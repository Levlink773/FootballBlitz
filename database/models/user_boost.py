import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, BigInteger, ForeignKey, Integer, Enum, DateTime
from sqlalchemy.orm import relationship

from database.model_base import Base


class BoostType(PyEnum):
    TRAINING_EFFICIENCY = "TRAINING_EFFICIENCY"
    TEAM_POWER = "TEAM_POWER"
    TRAINING_SPEED = "TRAINING_SPEED"


class UserBoost(Base):
    __tablename__ = 'user_boosts'

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey('users.id'), unique=True, nullable=False)
    
    effect = Column(Enum(BoostType), nullable=False)
    percent = Column(Integer, nullable=False)  # e.g., 50 for +50%
    duration = Column(Integer, nullable=False) # Duration in hours (stored for reference)
    
    date_start = Column(DateTime, default=datetime.datetime.now)
    date_end = Column(DateTime, nullable=False)

    user = relationship("UserBot", back_populates="boost")

    @property
    def is_active(self) -> bool:
        return datetime.datetime.now() < self.date_end
