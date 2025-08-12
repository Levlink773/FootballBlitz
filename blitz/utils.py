from dataclasses import dataclass
from datetime import time

from blitz.blitz_match.constans import REGISTER_BLITZ_PHOTO
from blitz.services.blitz_reward_service import RewardBlitzTeam, RewardEnergyBlitzTeam, RewardMoneyBlitzTeam, \
    RewardSmallBoxBlitzTeam, RewardMediumBoxBlitzTeam, RewardLargeBoxBlitzTeam, RewardRatingBlitzTeam, \
    RewardStatisticsBlitzTeam, RewardStatisticsSemiFinalBlitzTeam, RewardStatisticFinalLooserFinalBlitzTeam, \
    RewardStatisticFinalWinnerFinalBlitzTeam
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
    blitz_type: BlitzType
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
        blitz_type=BlitzType.BLITZ_V16,
        blitz_reward_pack=BlitzRewardPack(
            reward_guaranteed=[RewardEnergyBlitzTeam(40), RewardStatisticsBlitzTeam()],
            reward_semi_final=[RewardMoneyBlitzTeam(50), RewardRatingBlitzTeam(1), RewardStatisticsSemiFinalBlitzTeam()],
            reward_final_looser=[RewardSmallBoxBlitzTeam(), RewardRatingBlitzTeam(2), RewardStatisticFinalLooserFinalBlitzTeam()],
            reward_winner=[RewardMediumBoxBlitzTeam(), RewardRatingBlitzTeam(3), RewardStatisticFinalWinnerFinalBlitzTeam()],
        )
    ),
    BlitzType.BLITZ_V8: BlitzPack(
        stages_of_final=3,
        blitz_type=BlitzType.BLITZ_V8,
        blitz_reward_pack=BlitzRewardPack(
            reward_guaranteed=[RewardEnergyBlitzTeam(50), RewardStatisticsBlitzTeam()],
            reward_semi_final=[RewardSmallBoxBlitzTeam(), RewardRatingBlitzTeam(1), RewardStatisticsSemiFinalBlitzTeam()],
            reward_final_looser=[RewardSmallBoxBlitzTeam(), RewardMoneyBlitzTeam(50), RewardRatingBlitzTeam(2), RewardStatisticFinalLooserFinalBlitzTeam()],
            reward_winner=[RewardMediumBoxBlitzTeam(), RewardRatingBlitzTeam(3), RewardStatisticFinalWinnerFinalBlitzTeam()],
        )
    ),
    BlitzType.VIP_BLITZ_V8: BlitzPack(
        stages_of_final=3,
        blitz_type=BlitzType.VIP_BLITZ_V8,
        blitz_reward_pack=BlitzRewardPack(
            reward_guaranteed=[RewardEnergyBlitzTeam(50), RewardStatisticsBlitzTeam()],
            reward_semi_final=[RewardSmallBoxBlitzTeam(), RewardRatingBlitzTeam(1), RewardStatisticsSemiFinalBlitzTeam()],
            reward_final_looser=[RewardSmallBoxBlitzTeam(), RewardMoneyBlitzTeam(50), RewardRatingBlitzTeam(2), RewardStatisticFinalLooserFinalBlitzTeam()],
            reward_winner=[RewardMediumBoxBlitzTeam(), RewardRatingBlitzTeam(3), RewardStatisticFinalWinnerFinalBlitzTeam()],
        ),
        vip_blitz=True,
    ),
    BlitzType.BLITZ_V32: BlitzPack(
        stages_of_final=5,
        blitz_type=BlitzType.BLITZ_V32,
        blitz_reward_pack=BlitzRewardPack(
            reward_guaranteed=[RewardEnergyBlitzTeam(30), RewardStatisticsBlitzTeam()],
            reward_semi_final=[RewardSmallBoxBlitzTeam(), RewardMoneyBlitzTeam(30), RewardRatingBlitzTeam(1), RewardStatisticsSemiFinalBlitzTeam()],
            reward_final_looser=[RewardMediumBoxBlitzTeam(), RewardMoneyBlitzTeam(50), RewardRatingBlitzTeam(2), RewardStatisticFinalLooserFinalBlitzTeam()],
            reward_winner=[RewardLargeBoxBlitzTeam(), RewardMoneyBlitzTeam(50), RewardRatingBlitzTeam(3), RewardStatisticFinalWinnerFinalBlitzTeam()],
        ),
    ),
    BlitzType.BLITZ_V64: BlitzPack(
        stages_of_final=6,
        blitz_type=BlitzType.BLITZ_V64,
        blitz_reward_pack=BlitzRewardPack(
            reward_guaranteed=[RewardEnergyBlitzTeam(30), RewardStatisticsBlitzTeam()],
            reward_semi_final=[RewardSmallBoxBlitzTeam(), RewardMoneyBlitzTeam(60), RewardEnergyBlitzTeam(50),
                               RewardRatingBlitzTeam(1), RewardStatisticsSemiFinalBlitzTeam()],
            reward_final_looser=[RewardMediumBoxBlitzTeam(), RewardMoneyBlitzTeam(70), RewardEnergyBlitzTeam(100),
                                 RewardRatingBlitzTeam(2), RewardStatisticFinalLooserFinalBlitzTeam()],
            reward_winner=[RewardLargeBoxBlitzTeam(), RewardMoneyBlitzTeam(70), RewardEnergyBlitzTeam(100),
                           RewardRatingBlitzTeam(2), RewardStatisticFinalWinnerFinalBlitzTeam()],
        ),
    ),
}

blitz_scheduler = [
    BlitzData(
        start_time=time(0, 0),
        registration_cost=80,
        blitz_pack=blitz_pack_getter.get(BlitzType.BLITZ_V8),
    ),
    BlitzData(
        start_time=time(9, 0),
        registration_cost=50,
        blitz_pack=blitz_pack_getter.get(BlitzType.BLITZ_V16),
    ),
    BlitzData(
        start_time=time(12, 0),
        registration_cost=50,
        blitz_pack=blitz_pack_getter.get(BlitzType.BLITZ_V16),
    ),
    BlitzData(
        start_time=time(15, 0),
        registration_cost=80,
        blitz_pack=blitz_pack_getter.get(BlitzType.VIP_BLITZ_V8),
    ),
    BlitzData(
        start_time=time(18, 0),
        registration_cost=40,
        blitz_pack=blitz_pack_getter.get(BlitzType.BLITZ_V32),
    ),
    BlitzData(
        start_time=time(21, 0),
        registration_cost=30,
        blitz_pack=blitz_pack_getter.get(BlitzType.BLITZ_V64),
    ),
]
