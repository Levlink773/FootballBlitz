import datetime

from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, Integer, Boolean, Enum, Float
from sqlalchemy.orm import relationship, Mapped
from enum import Enum as EnumBase
from config import Country, Gender
from constants import POWER_MUL, TALENT_MUL, AGE_MUL
from database.models.reminder_character import ReminderCharacter

from database.model_base import Base
from database.models.transfer_character import TransferCharacter

class Position(str, EnumBase):
    GOALKEEPER = "GOALKEEPER"  # Воротар
    DEFENDER = "DEFENDER"      # Захисник
    MIDFIELDER = "MIDFIELDER"  # Півзахисник
    ATTACKER = "ATTACKER"      # Нападник


class CharacterRarity(EnumBase):
    STANDARD = "STANDARD"  # Обычный
    RARE = "RARE"          # Редкий
    EXCLUSIVE = "EXCLUSIVE" # Эксклюзивный
class Character(Base):
    __tablename__ = 'characters'

    id = Column(BigInteger, primary_key=True, index=True)

    characters_user_id = Column(BigInteger, ForeignKey('users.user_id'), nullable=True)

    name = Column(String(255), index=True)
    age = Column(Integer, default=0)
    talent = Column(Integer, default=0)
    power = Column(Float, default=0)
    gender = Column(Enum(Gender), nullable=False, default=Gender.MAN)
    country = Column(Enum(Country), default=Country.UKRAINE)
    position = Column(Enum(Position), nullable=False, default=Position.MIDFIELDER)
    squad_position = Column(String(50), nullable=True, default=None)

    created_at = Column(DateTime, default=datetime.datetime.now)

    owner = relationship("UserBot",
                         back_populates="characters",
                         lazy="selectin",
                         foreign_keys=[characters_user_id]
                         )

    reminder: Mapped["ReminderCharacter"] = relationship(
        "ReminderCharacter",
        back_populates="character",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    transfer: Mapped["TransferCharacter"] = relationship(
        "TransferCharacter",
        back_populates="character",
        uselist=False,  # <<< важный момент для one-to-one
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    training_key = Column(Integer, default=1, server_default="1", nullable=False)
    time_get_member_bonus = Column(DateTime, nullable=True)

    @property
    def character_price(self) -> float:
        price = (self.power * POWER_MUL) + (self.talent * TALENT_MUL) - (self.age * AGE_MUL)
        return price

    @property
    def how_much_power_can_add(self):
        return max(1.0 * (0.2 * self.talent) * (1 - self.age * 0.02), 0) * 2

    @property
    def rarity(self) -> CharacterRarity:
        """
        Calculates character rarity based on talent and age.
        
        Logic:
        - Talent 1-6: STANDARD
        - Talent 7-8: RARE
        - Talent 9: EXCLUSIVE (but if Age > 30 -> RARE)
        """
        if self.talent <= 6:
            return CharacterRarity.STANDARD
        elif 7 <= self.talent <= 8:
            return CharacterRarity.RARE
        elif self.talent >= 9:
            if self.age > 30:
                return CharacterRarity.RARE
            return CharacterRarity.EXCLUSIVE
        
        return CharacterRarity.STANDARD # Fallback
