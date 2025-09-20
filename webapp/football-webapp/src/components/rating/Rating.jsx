// Rating.jsx

import React, { useState, useEffect } from 'react';
import styles from '../../css_files/rating/Rating.module.css';
import Config from "../../config.js";
import {API_BASE_URL} from "../../api.js";

// Компонент RatingItem залишається без змін...
const RatingItem = ({ rank, icon, name, score, index }) => (
    <div className={styles.ratingItem} style={{ '--delay-index': index }}>
        <div className={styles.rankInfo}>
            <span className={styles.rankNumber}>{rank}</span>
            {icon && <img src={icon} alt={`Rank ${rank}`} className={styles.rankIcon} />}
            <span className={styles.rankName}>{name}</span>
        </div>
        <div className={styles.rankScoreContainer}>
            <span className={styles.rankScore}>{score}</span>
            <span className={styles.scoreUnit}>очок</span>
        </div>
    </div>
);

// Приймаємо новий пропс onShowInfo
const Rating = ({ onShowInfo }) => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRanking = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/users/ranking`);
                if (!response.ok) {
                    throw new Error(`Не вдалося завантажити дані: ${response.statusText}`);
                }
                const data = await response.json();
                setUsers(data);
            } catch (err) {
                setError(err.message);
                console.error("Помилка завантаження рейтингу:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRanking();
    }, []);

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

        return users.map((user, index) => {
            const rank = index + 1;
            return (
                <RatingItem
                    key={user.user_id || index}
                    rank={rank}
                    icon={getMedalIcon(rank)}
                    name={user.user_name || 'Anonymous'}
                    score={user.points || 0}
                    index={index}
                />
            );
        });
    };

    return (
        <div className={styles.ratingContainer}>
            <div className={styles.title}>РЕЙТИНГИ</div>
            <div className={styles.listBox}>
                <div className={styles.scrollableList}>
                    {renderContent()}
                </div>
                {/* ОГОЛОШУЄМО ОБРОБНИК onClick ДЛЯ ВСЬОГО БЛОКУ.
                    Тепер весь цей блок є клікабельним.
                */}
                <div className={styles.howToContainer} onClick={onShowInfo}>
                    <img src={Config.IMAGES.left_arrow} alt="Left Arrow" className={styles.arrowIcon} />
                    <span className={styles.howToText}>Як формується рейтинг?</span>
                    <img src={Config.IMAGES.right_arrow} alt="Right Arrow" className={styles.arrowIcon} />
                </div>
            </div>
        </div>
    );
};

export default Rating;