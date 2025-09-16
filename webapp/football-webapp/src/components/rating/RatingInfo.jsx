import React from 'react';
import styles from '../../css_files/rating/RatingInfo.module.css';
import Config from '../../config.js';

const REWARDS_DATA = [
        { place: '1 місце', r1: '+600', r2: '+500' }, { place: '6 місце', r1: '+160', r2: '+80' },
        { place: '2 місце', r1: '+500', r2: '+400' }, { place: '7 місце', r1: '+140', r2: '+70' },
        { place: '3 місце', r1: '+400', r2: '+300' }, { place: '8 місце', r1: '+120', r2: '+60' },
        { place: '4 місце', r1: '+300', r2: '+200' }, { place: '9 місце', r1: '+100', r2: '+50' },
        { place: '5 місце', r1: '+200', r2: '+100' }, { place: '10 місце', r1: '+80', r2: '+40' },
];

const RewardRow = ({ place, reward1, reward2 }) => (
    <div className={styles.rewardRow}>
            <span className={styles.rewardPlace}>{place}</span>
            <div className={styles.rewardValues}>
                    <div className={styles.rewardItem}>
                            <span className={styles.rewardAmountCoin}>{reward1}</span>
                            <img src={Config.IMAGES.coin} alt="coin icon" />
                    </div>
                    <div className={styles.rewardItem}>
                            <span className={styles.rewardAmountEnergy}>{reward2}</span>
                            <img src={Config.IMAGES.energy} alt="energy icon" />
                    </div>
            </div>
    </div>
);

const RatingInfo = () => {
        // НОВОЕ: Сортируем данные перед отображением для логичного порядка
        const sortedRewards = [...REWARDS_DATA].sort((a, b) => {
                const placeA = parseInt(a.place);
                const placeB = parseInt(b.place);
                return placeA - placeB;
        });

        return (
            <div className={styles.container}>
                    {/* Заголовок теперь стилизуется так, чтобы быть "над" блоком */}
                    <h1 className={styles.title}>ЯК ПРАЦЮЄ РЕЙТИНГ</h1>

                    <div className={styles.infoBox}>
                            <p className={styles.introText} style={{'--animation-order': 1}}>
                                    Рейтинг формується за результатами Blitz-турнірів:
                            </p>

                            <div className={styles.pointsSection} style={{'--animation-order': 2}}>
                                    <div className={styles.pointItem}>
                                            <img src={Config.IMAGES.trophy_gold} alt="Gold Trophy"/>
                                            <span>1 місце - 3 оч.</span>
                                    </div>
                                    <div className={styles.pointItem}>
                                            <img src={Config.IMAGES.trophy_silver} alt="Silver Trophy"/>
                                            <span>2 місце - 2 оч.</span>
                                    </div>
                                    <div className={styles.pointItem}>
                                            <img src={Config.IMAGES.trophy_bronze} alt="Bronze Trophy"/>
                                            <span>3 місце - 1 оч.</span>
                                    </div>
                            </div>

                            <p className={styles.resetInfo} style={{'--animation-order': 3}}>
                                    Щонеділі о <strong className={styles.highlightText}>23:30</strong> рейтинг обнуляється, а перші 10 гравців отримують нагороди:
                            </p>

                            <div className={styles.rewardsGrid} style={{'--animation-order': 4}}>
                                    {sortedRewards.map(item => (
                                        <RewardRow key={item.place} place={item.place} reward1={item.r1} reward2={item.r2} />
                                    ))}
                            </div>

                            <p className={styles.footerText} style={{'--animation-order': 5}}>
                                    Грай активно, щоб піднятися вище у таблиці та здобути цінні нагороди!
                            </p>
                    </div>
            </div>
        );
};

export default RatingInfo;