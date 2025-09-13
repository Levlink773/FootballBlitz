// components/RatingInfo.jsx

import React from 'react';
import styles from '../../css_files/rating/RatingInfo.module.css';
import Config from '../../config.js'; // Adjust path if necessary

// Data for the rewards table, making it easy to update
const REWARDS_DATA = [
        { place: '1 місце', r1: '+600', r2: '+500' },
        { place: '6 місце', r1: '+160', r2: '+80' },
        { place: '2 місце', r1: '+500', r2: '+400' },
        { place: '7 місце', r1: '+140', r2: '+70' },
        { place: '3 місце', r1: '+400', r2: '+300' },
        { place: '8 місце', r1: '+120', r2: '+60' },
        { place: '4 місце', r1: '+300', r2: '+200' },
        { place: '9 місце', r1: '+100', r2: '+50' },
        { place: '5 місце', r1: '+200', r2: '+100' },
        { place: '10 місце', r1: '+80', r2: '+40' },
];

// A sub-component for a single row in the rewards grid
const RewardRow = ({ place, reward1, reward2 }) => (
    <div className={styles.rewardRow}>
            <span className={styles.rewardPlace}>{place}</span>
            <div className={styles.rewardValues}>
                    <div className={styles.rewardItem}>
                            <span>{reward1}</span>
                            <img src={Config.IMAGES.coin} alt="reward icon" style={{ width: '10px' }}/>
                    </div>
                    <div className={styles.rewardItem}>
                            <span>{reward2}</span>
                            <img src={Config.IMAGES.energy} alt="reward icon" style={{ width: '7px' }}/>
                    </div>
            </div>
    </div>
);

const RatingInfo = () => {
        return (
            <div className={styles.container}>
                    <h1 className={styles.title}>РЕЙТИНГИ</h1>

                    <div className={styles.infoBox}>
                            <p className={styles.introText}>Рейтинг формується за результатами Blitz-турнірів:</p>

                            <div className={styles.pointsSection}>
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

                            <p className={styles.resetInfo}>
                                    Щонеділі о 23:30 рейтинг обнуляється, а перші 10 гравців отримують нагороди
                            </p>

                            <div className={styles.rewardsGrid}>
                                    {REWARDS_DATA.map(item => (
                                        <RewardRow key={item.place} place={item.place} reward1={item.r1} reward2={item.r2} />
                                    ))}
                            </div>

                            <p className={styles.footerText}>
                                    Грай активно, щоб піднятися вище у таблиці та здобути цінні нагороди!
                            </p>
                    </div>
            </div>
        );
};

export default RatingInfo;