import datetime
from enum import Enum as EnumBase

from database.model_base import Base

from sqlalchemy import (
    Column,
    BigInteger,
    DateTime,
    String,
    Enum,
    text, ForeignKey
)
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship, Mapped, mapped_column


class STATUS_USER_REGISTER(EnumBase):
    START_REGISTER = "START_REGISTER"
    CREATE_TEAM = "CREATE_TEAM"
    SEND_NAME_TEAM = "SEND_NAME_TEAM"
    GET_FIRST_CHARACTER = "GET_FIRST_CHARACTER"
    END_REGISTER = "END_REGISTER"
    FORGOT_TRAINING = "FORGOT_TRAINING"


class UserBot(Base):
    __tablename__ = 'users'

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, unique=True, index=True)
    user_name = Column(String(255), index=True)
    user_full_name = Column(String(255))
    user_time_register = Column(DateTime, default=datetime.datetime.now)
    money = Column(BigInteger, default=0)
    energy = Column(BigInteger, default=0)
    team_name = Column(String(255), nullable=True)
    points = Column(BigInteger, nullable=False, default=0)

    characters = relationship(
        "Character",
        back_populates="owner",
        lazy="selectin",
        cascade="all, delete-orphan",
        foreign_keys="Character.characters_user_id"
    )
    main_character_id = Column(
        BigInteger,
        ForeignKey('characters.id', ondelete='SET NULL'),
        nullable=True
    )

    main_character = relationship(
        "Character",
        foreign_keys=[main_character_id],
        post_update=True,
        uselist=False,
    )
    status_register: Mapped[STATUS_USER_REGISTER] = mapped_column(
        Enum(STATUS_USER_REGISTER),
        nullable=False,
        default=STATUS_USER_REGISTER.START_REGISTER,
        server_default=text("'END_REGISTER'")
    )
    vip_pass_expiration_date = Column(DateTime, nullable=True)
    statistics = relationship(
        "Statistics",
        back_populates="user",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    count_play_blitz = Column(BigInteger, default=0)
    count_rich_semi_final_blitz = Column(BigInteger, default=0)
    count_rich_final_looser_blitz = Column(BigInteger, default=0)
    count_rich_final_winner_blitz = Column(BigInteger, default=0)
    count_go_to_gym = Column(BigInteger, default=0)

    final_count_of_matches = Column(BigInteger, default=0)
    final_winner_matches = Column(BigInteger, default=0)
    final_count_of_blitz = Column(BigInteger, default=0)

    @property
    def precent_winner_matches(self) -> float:
        if self.final_count_of_matches == 0:
            return 0
        return round((self.final_winner_matches / self.final_count_of_matches) * 100, 2)

    @property
    def team_name_user(self) -> str:
        text = self.team_name
        if self.vip_pass_is_active:
            text = f"⚜️ <u><b>[VIP]</b></u> ⚜️ {text}"

        return text

    @property
    def vip_pass_is_active(self) -> bool:
        if not self.vip_pass_expiration_date:
            return False
        return self.vip_pass_expiration_date > datetime.datetime.now()

    @property
    def end_register(self) -> bool:
        return self.status_register == STATUS_USER_REGISTER.END_REGISTER

    @property
    def user_name_link(self):
        return f"{'@' + self.user_name if self.user_name else self.user_full_name}"

    @hybrid_property
    def link_to_user(self):
        return f"<a href='tg://user?id={self.user_id}'>{self.user_name_link}</a>"
