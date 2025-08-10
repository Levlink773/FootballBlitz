import datetime

from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, Integer, Boolean, Enum
from sqlalchemy.orm import relationship, Mapped

from config import Country, Gender
from constants import POWER_MUL, TALENT_MUL, AGE_MUL
from database.models.reminder_character import ReminderCharacter

from database.model_base import Base



class Character(Base):
    __tablename__ = 'characters'

    id = Column(BigInteger, primary_key=True, index=True)

    characters_user_id = Column(BigInteger, ForeignKey('users.user_id'))

    name = Column(String(255), index=True)
    age = Column(Integer, default=0)
    talent = Column(Integer, default=0)
    power = Column(Integer, default=0)
    gender = Column(Enum(Gender), nullable=False, default=Gender.MAN)
    country = Column(Enum(Country), default=Country.UKRAINE)

    created_at = Column(DateTime, default=datetime.datetime.now)

    owner = relationship("UserBot", back_populates="characters", lazy="selectin")

    reminder: Mapped["ReminderCharacter"] = relationship(
        "ReminderCharacter",
        back_populates="character",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    training_key = Column(Integer, default=1, server_default="1", nullable=False)
    time_get_member_bonus = Column(DateTime, nullable=True)

    points = Column(BigInteger, nullable=False, default=0)

    @property
    def absolute_age(self):
        return self.age / 12 + 18

    @property
    def character_price(self):
        return (self.power * POWER_MUL) + (self.talent * TALENT_MUL) - (self.absolute_age * AGE_MUL)

    def how_much_power_can_add(self, duration_seconds: int):
        duration_minutes = duration_seconds // 60
        return max((duration_minutes / 60) * (0.4 * self.talent) * (1 - self.age * 0.02), 0)