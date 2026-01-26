import datetime
from sqlalchemy import Column, BigInteger, ForeignKey, Integer, Enum, DateTime, Boolean
from sqlalchemy.orm import relationship
from database.model_base import Base
from enum import Enum as PyEnum


class BoostType(PyEnum):
    TRAINING_EFFICIENCY = "TRAINING_EFFICIENCY"
    TEAM_POWER = "TEAM_POWER"
    TRAINING_SPEED = "TRAINING_SPEED"
    STRENGTH = "STRENGTH"


class UserBoost(Base):
    __tablename__ = 'user_boosts'

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey('users.user_id'), nullable=False)  # Обратите внимание, обычно users.user_id

    effect = Column(Enum(BoostType), nullable=False)
    percent = Column(Integer, nullable=False)
    duration = Column(Integer, nullable=False)  # Длительность в часах (справочно для инвентаря)

    # 🔥 ИЗМЕНЕНИЯ:
    is_active = Column(Boolean, nullable=False, default=False)  # False = в инвентаре
    date_end = Column(DateTime, nullable=True)  # Nullable, т.к. в инвентаре нет даты конца
    count = Column(Integer, default=1)  # Чтобы стакать одинаковые бусты (x5, x10)

    user = relationship("UserBot", back_populates="boosts")  # Изменили на boosts (множественное число)

    @property
    def is_expired(self) -> bool:
        if not self.is_active or not self.date_end:
            return False
        return datetime.datetime.now() > self.date_end