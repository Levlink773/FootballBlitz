from sqlalchemy import Column, Integer, ForeignKey, Float, BigInteger
from sqlalchemy.orm import relationship

from database.model_base import Base


class BlitzUser(Base):
    __tablename__ = 'blitz_users'
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey('users.user_id'))

    blitz_id = Column(Integer, ForeignKey("blitzs.id", ondelete="CASCADE"))
    team_id = Column(Integer, ForeignKey("blitz_team.id", ondelete="CASCADE"))
    goals_count = Column(Integer, nullable=False, default=0, server_default='0')
    count_score = Column(Float, nullable=False, default=0, server_default='0')

    blitz = relationship("Blitz", back_populates="users")
    team = relationship("BlitzTeam", back_populates="users")
