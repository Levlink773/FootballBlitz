import React from 'react';
import styles from '../../css_files/main_css/UserProfile.module.css';
import Config from "../../config.js";

const StatItem = ({ icon, alt, value }) => (
    <div className={styles.stat}>
        <img src={icon} alt={alt} aria-label={alt} />
        <span>{value}</span>
    </div>
);

export const UserProfile = ({ user }) => {
    const { name = 'Unknown', age = 'N/A', country = 'Unknown', stats = {} } = user || {};

    const statsData = [
        { icon: Config.IMAGES.coin, alt: 'Coins', value: stats.coins || 0 },
        { icon: Config.IMAGES.target, alt: 'Goals', value: stats.goals || 0 },
        { icon: Config.IMAGES.arm, alt: 'Strength', value: stats.strength || 0 },
    ];

    return (
        <div className={styles.userProfile}>
            {/* Аватар игрока */}
            <img
                className={styles.playerImage}
                src={Config.IMAGES.face_character}
                alt={`${name}'s avatar`}
            />

            <div className={styles.infoBox}>
                {/* Левая часть: имя, возраст, страна */}
                <div className={styles.leftSection}>
                    <div className={styles.nameAge}>
                        <span className={styles.name}>{name}</span>
                        <span className={styles.age}>, {age}</span>
                    </div>

                    <div className={styles.locationGroup}>
                        <img
                            className={styles.locationIcon}
                            src={Config.IMAGES.country}
                            alt={`${country} flag`}
                        />
                        <span className={styles.location}>{country}</span>
                    </div>
                </div>

                {/* Правая часть: статистика */}
                <div className={styles.stats}>
                    {statsData.map((stat, index) => (
                        <StatItem key={index} {...stat} />
                    ))}
                </div>
            </div>
        </div>
    );
};
