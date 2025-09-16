import React, { useState, useEffect } from 'react';
import styles from '../../css_files/rating/Rating.module.css';
import Config from "../../config.js";

// Компонент для одного рядка рейтингу, без змін
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


const Rating = () => {
    // Стан для зберігання списку користувачів, отриманого з API
    const [users, setUsers] = useState([]);
    // Стан для відстеження процесу завантаження
    const [isLoading, setIsLoading] = useState(true);
    // Стан для зберігання можливої помилки
    const [error, setError] = useState(null);

    // Використовуємо useEffect для завантаження даних при монтуванні компонента
    useEffect(() => {
        const fetchRanking = async () => {
            try {
                // Робимо запит до вашого API, щоб отримати топ-10 гравців
                const response = await fetch('http://localhost:8123/users/ranking');

                if (!response.ok) {
                    throw new Error(`Не вдалося завантажити дані: ${response.statusText}`);
                }

                const data = await response.json();
                setUsers(data); // Зберігаємо отримані дані в стан
            } catch (err) {
                setError(err.message); // Зберігаємо помилку
                console.error("Помилка завантаження рейтингу:", err);
            } finally {
                setIsLoading(false); // Зупиняємо індикатор завантаження
            }
        };

        fetchRanking();
    }, []); // Пустий масив залежностей означає, що ефект виконається один раз

    // Функція для визначення іконки медалі за місцем у рейтингу
    const getMedalIcon = (rank) => {
        if (rank === 1) return Config.IMAGES.gold_medal;
        if (rank === 2) return Config.IMAGES.iron_medal; // За вашим мок-кодом
        if (rank === 3) return Config.IMAGES.copper_medal;
        return null; // Для інших місць іконки немає
    };

    // Умовний рендеринг в залежності від стану завантаження
    const renderContent = () => {
        if (isLoading) {
            return <div className={styles.statusText}>Завантаження рейтингу...</div>;
        }

        if (error) {
            return <div className={styles.statusText}>Помилка завантаження: {error}</div>;
        }

        if (users.length === 0) {
            return <div className={styles.statusText}>Рейтинг порожній.</div>;
        }

        return users.map((user, index) => {
            const rank = index + 1;
            return (
                <RatingItem
                    key={user.user_id || index} // Використовуємо унікальний user_id як ключ
                    rank={rank}
                    icon={getMedalIcon(rank)}
                    name={user.user_name || 'Anonymous'} // Запасне ім'я, якщо user_name відсутній
                    score={user.points || 0} // Запасне значення, якщо points відсутні
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