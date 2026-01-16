from datetime import datetime

from dateutil.relativedelta import relativedelta
from sqlalchemy import Column, BigInteger, String, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship

from database.model_base import Base


class SeasonPass(Base):
    __tablename__ = 'season_pass'

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, index=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey('users.id'), unique=True, nullable=False)
    season_name = Column(String(255))
    points = Column(BigInteger, default=0)
    
    # Structure: {"standard": [20, 40], "vip": [50]} - list of collected milestone points
    rewards_collected = Column(JSON, default=lambda: {"standard": [], "vip": []})

    user = relationship("UserBot", back_populates="season_pass")

    # Reward configuration from project.md
    
    STANDARD_REWARDS = {
        20: 'energy_50',
        40: 'money_1000',
        60: 'skill_3',
        80: 'energy_80',
        100: 'box_small',
        120: 'money_2000',
        140: 'skill_5',
        160: 'energy_120',
        180: 'box_small',
        200: 'boost_training_50_12h',
        220: 'energy_150',
        240: 'skill_7',
        260: 'box_medium',
        280: 'money_4000',
        300: 'boost_team_10_12h',
        320: 'energy_200',
        340: 'skill_10',
        360: 'box_medium',
        380: 'money_5000',
        400: 'boost_training_time_50_12h',
        420: 'energy_250',
        440: 'skill_15',
        460: 'box_big',
        480: 'money_7000',
        500: 'boost_training_100_12h',
        520: 'energy_300',
        540: 'skill_20',
        560: 'box_big',
        580: 'money_10000',
        600: 'boost_strength_25_24h_trophy',
    }

    VIP_REWARDS = {
        50: 'energy_900',
        150: 'box_small_3',
        300: 'money_7000',
        450: 'skill_60',
        590: 'box_big_3',
    }
    @property
    def session_end(self):
        # Берем текущее время + 1 месяц, и принудительно ставим 1-й день
        return datetime.now() + relativedelta(months=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        

    def get_available_rewards(self) -> dict:
        """
        Returns a dictionary of rewards that are unlocked but not yet collected.
        Structure:
        {
            'standard': [20, 40], # milestones available
            'vip': [50]           # milestones available
        }
        """
        available = {'standard': [], 'vip': []}
        collected = self.rewards_collected or {"standard": [], "vip": []}
        
        # Ensure collected structure integrity
        if 'standard' not in collected: collected['standard'] = []
        if 'vip' not in collected: collected['vip'] = []

        # Check Standard Rewards
        for points_needed in self.STANDARD_REWARDS:
            if self.points >= points_needed:
                if points_needed not in collected['standard']:
                    available['standard'].append(points_needed)

        # Check VIP Rewards
        if self.user and self.user.vip_pass_is_active:
            for points_needed in self.VIP_REWARDS:
                if self.points >= points_needed:
                    if points_needed not in collected['vip']:
                        available['vip'].append(points_needed)
        
        return available
