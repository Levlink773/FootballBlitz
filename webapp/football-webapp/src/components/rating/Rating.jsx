// Rating.jsx

import React, { useState, useEffect } from 'react';
import styles from '../../css_files/rating/Rating.module.css';
import Config from "../../config.js";
import { API_BASE_URL } from "../../api.js";

// 1. RatingItem is updated to be more flexible with the "score"
const RatingItem = ({ rank, icon, name, score, scoreUnit, index }) => (
    <div className={styles.ratingItem} style={{ '--delay-index': index }}>
        <div className={styles.rankInfo}>
            <span className={styles.rankNumber}>{rank}</span>
            {icon && <img src={icon} alt={`Rank ${rank}`} className={styles.rankIcon} />}
            <span className={styles.rankName}>{name}</span>
        </div>
        <div className={styles.rankScoreContainer}>
            <span className={styles.rankScore}>{score}</span>
            <span className={styles.scoreUnit}>{scoreUnit}</span>
        </div>
    </div>
);

// 2. The component now accepts `type`, `onShowInfo`, and `onBack` props
const Rating = ({ type, onShowInfo, onBack }) => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // 3. The API endpoint is determined by the `type` prop
        const endpoint = type === 'seasonal'
            ? `${API_BASE_URL}/users/ranking/seasonal`
            : `${API_BASE_URL}/users/ranking/win-rate`;

        const fetchRanking = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(endpoint);
                if (!response.ok) {
                    throw new Error(`Не вдалося завантажити дані: ${response.statusText}`);
                }
                const data = await response.json();
                setUsers(data);
            } catch (err) {
                setError(err.message);
                console.error(`Помилка завантаження рейтингу (${type}):`, err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRanking();
    }, [type]); // Re-run the effect if the rating type changes

    const getMedalIcon = (rank) => {
        if (rank === 1) return Config.IMAGES.gold_medal;
        if (rank === 2) return Config.IMAGES.iron_medal;
        if (rank === 3) return Config.IMAGES.copper_medal;
        return null;
    };

    const renderContent = () => {
        if (isLoading) return <div className={styles.statusText}>Завантаження рейтингу...</div>;
        if (error) return <div className={styles.statusText}>Помилка завантаження: {error}</div>;
        if (users.length === 0) return <div className={styles.statusText}>Рейтинг порожній.</div>;

        // 4. The rendering logic adapts based on the rating type
        return users.map((user, index) => {
            const rank = index + 1;

            if (type === 'seasonal') {
                return (
                    <RatingItem
                        key={user.user_id || index}
                        rank={rank}
                        icon={getMedalIcon(rank)}
                        name={`${user.user_name || 'Anonymous'} (${user.team_name || 'Unknown'})`}
                        score={user.points || 0}
                        scoreUnit="очок"
                        index={index}
                    />
                );
            }

            if (type === 'win_rate') {
                const winnerMatches = user.final_winner_matches || 0;
                const totalMatches = user.final_count_of_matches || 0;
                return (
                    <RatingItem
                        key={user.user_id || index}
                        rank={rank}
                        icon={getMedalIcon(rank)}
                        name={`${user.user_name || 'Anonymous'} (${winnerMatches}/${totalMatches} ігор)`}
                        score={Math.trunc(Number(user.precent_winner_matches) || 0)}
                        scoreUnit="% перемог"
                        index={index}
                    />
                );
            }

            return null;
        });
    };

    // 5. Title and Info button text also adapt to the type
    const title = type === 'seasonal' ? 'РЕЙТИНГ СЕЗОНУ' : 'РЕЙТИНГ ЗА ПЕРЕМОГАМИ';
    const infoText = type === 'seasonal' ? 'Як формується рейтинг?' : 'Інформація про рейтинг';

    return (
        <div className={styles.ratingContainer}>
            <div className={styles.title}>{title}</div>
            <div className={styles.listBox}>
                <div className={styles.scrollableList}>
                    {renderContent()}
                </div>

                <div className={styles.howToContainer} onClick={onShowInfo}>
                    <img src={Config.IMAGES.left_arrow} alt="Arrow" className={styles.arrowIcon} />
                    <span className={styles.howToText}>{infoText}</span>
                    <img src={Config.IMAGES.right_arrow} alt="Arrow" className={styles.arrowIcon} />
                </div>

                {/* 6. A "Back" button is added to return to the hub */}
                <div className={styles.howToContainer} onClick={onBack} style={{marginTop: '10px'}}>
                    <img src={Config.IMAGES.left_arrow} alt="Back Arrow" className={styles.arrowIcon} />
                    <span className={styles.howToText}>Назад до вибору</span>
                    <img src={Config.IMAGES.right_arrow} alt="Right Arrow" className={styles.arrowIcon} />
                </div>
            </div>
        </div>
    );
};

export default Rating;