from dataclasses import dataclass
from datetime import time

from blitz.blitz_match.constans import REGISTER_BLITZ_PHOTO
from blitz.services.blitz_reward_service import RewardBlitzTeam, RewardEnergyBlitzTeam, RewardMoneyBlitzTeam, \
    RewardSmallBoxBlitzTeam, RewardMediumBoxBlitzTeam, RewardLargeBoxBlitzTeam
from database.models.blitz import BlitzType


@dataclass
class BlitzRewardPack:
    reward_guaranteed: list[RewardBlitzTeam]
    reward_semi_final: list[RewardBlitzTeam]
    reward_final_looser: list[RewardBlitzTeam]
    reward_winner: list[RewardBlitzTeam]


@dataclass
class BlitzPack:
    stages_of_final: int
    blitz_reward_pack: BlitzRewardPack
    vip_blitz: bool = False


@dataclass
class BlitzData:
    start_time: time
    registration_cost: int
    blitz_pack: BlitzPack
    path_register_image: str = REGISTER_BLITZ_PHOTO


blitz_pack_getter = {
    BlitzType.BLITZ_V16: BlitzPack(
        stages_of_final=4,
        blitz_reward_pack=BlitzRewardPack(
            reward_guaranteed=[RewardEnergyBlitzTeam(40)],
            reward_semi_final=[RewardMoneyBlitzTeam(50)],
            reward_final_looser=[RewardSmallBoxBlitzTeam()],
            reward_winner=[RewardMediumBoxBlitzTeam()],
        )
    ),
    BlitzType.BLITZ_V8: BlitzPack(
        stages_of_final=3,
        blitz_reward_pack=BlitzRewardPack(
            reward_guaranteed=[RewardEnergyBlitzTeam(50)],
            reward_semi_final=[RewardSmallBoxBlitzTeam()],
            reward_final_looser=[RewardSmallBoxBlitzTeam(), RewardMoneyBlitzTeam(50)],
            reward_winner=[RewardMediumBoxBlitzTeam()],
        )
    ),
    BlitzType.VIP_BLITZ_V8: BlitzPack(
        stages_of_final=3,
        blitz_reward_pack=BlitzRewardPack(
            reward_guaranteed=[RewardEnergyBlitzTeam(50)],
            reward_semi_final=[RewardSmallBoxBlitzTeam()],
            reward_final_looser=[RewardSmallBoxBlitzTeam(), RewardMoneyBlitzTeam(50)],
            reward_winner=[RewardMediumBoxBlitzTeam()],
        ),
        vip_blitz=True,
    ),
    BlitzType.BLITZ_V32: BlitzPack(
        stages_of_final=5,
        blitz_reward_pack=BlitzRewardPack(
            reward_guaranteed=[RewardEnergyBlitzTeam(30)],
            reward_semi_final=[RewardSmallBoxBlitzTeam(), RewardMoneyBlitzTeam(30)],
            reward_final_looser=[RewardMediumBoxBlitzTeam(), RewardMoneyBlitzTeam(50)],
            reward_winner=[RewardLargeBoxBlitzTeam()],
        ),
    ),
    BlitzType.BLITZ_V64: BlitzPack(
        stages_of_final=6,
        blitz_reward_pack=BlitzRewardPack(
            reward_guaranteed=[RewardEnergyBlitzTeam(30)],
            reward_semi_final=[RewardSmallBoxBlitzTeam(), RewardMoneyBlitzTeam(60), RewardEnergyBlitzTeam(50)],
            reward_final_looser=[RewardMediumBoxBlitzTeam(), RewardMoneyBlitzTeam(70), RewardEnergyBlitzTeam(100)],
            reward_winner=[RewardLargeBoxBlitzTeam(), RewardMoneyBlitzTeam(100), RewardEnergyBlitzTeam(150)],
        ),
    ),
}
