// components/Rating.jsx

import React from 'react';
import styles from '../../css_files/rating/Rating.module.css';
import Config from "../../config.js";

const RATING_DATA = [
        { rank: 1, icon: Config.IMAGES.gold_medal, name: '@Andy_jjj_11', score: '10 очок' },
        { rank: 2, icon: Config.IMAGES.iron_medal, name: '@Barny-M', score: '9 очок' },
        { rank: 3, icon: Config.IMAGES.copper_medal, name: '@Danilews', score: '8 очок' },
        { rank: 4, name: '@1111112222233333', score: '7 очок' },
        { rank: 5, name: '@HospitalCity', score: '7 очок' },
        { rank: 6, name: '@Дмитрий_Юриевич', score: '5 очок' },
        { rank: 7, name: '@СОЛОМОН', score: '5 очок' },
        { rank: 8, name: '@Sponge_Boobs', score: '5 очок' },
        { rank: 9, name: '@Vitaliy_Sicret', score: '3 очок' },
        { rank: 10, name: '@SaraPolson', score: '3 очок' },
];

const RatingItem = ({ rank, icon, name, score }) => (
    <div className={styles.ratingItem}>
            <div className={styles.rankInfo}>
                    <span className={styles.rankNumber}>{rank}</span>
                    {icon && <img src={icon} alt={`Rank ${rank}`} className={styles.rankIcon} />}
                    <span className={styles.rankName}>{name}</span>
            </div>
            <span className={styles.rankScore}>{score}</span>
    </div>
);


const Rating = () => {
        return (
            <div className={styles.ratingContainer}>
                    <div className={styles.title}>РЕЙТИНГИ</div>
                    <div className={styles.listBox}>
                            {/* A new wrapper div for the list to allow scrolling */}
                            <div className={styles.scrollableList}>
                                    {RATING_DATA.map(item => (
                                        <RatingItem
                                            key={item.rank}
                                            rank={item.rank}
                                            icon={item.icon}
                                            name={item.name}
                                            score={item.score}
                                        />
                                    ))}
                            </div>
                            {/* MOVED THIS DIV INSIDE THE listBox */}
                            <div className={styles.howToContainer}>
                                    <img src={Config.IMAGES.left_arrow} alt="Left Arrow" className={styles.arrowIcon} />
                                    <span className={styles.howToText}>Як формується рейтинг?</span>
                                    <img src={Config.IMAGES.right_arrow} alt="Right Arrow" className={styles.arrowIcon} />
                            </div>
                    </div>
            </div>
        );
};

export default Rating;