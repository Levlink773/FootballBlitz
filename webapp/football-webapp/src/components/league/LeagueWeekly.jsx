import React, { useState, useEffect } from 'react';
import styles from '../../css_files/league/LeagueWeekly.module.css';
import Config from "../../config.js";
import { API_BASE_URL } from "../../api.js";
import RatingInfo from "./RatingInfo.jsx"; // 🔥 Імпорт компонента

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

const LeagueWeekly = () => {
    const [type, setType] = useState('seasonal');
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 🔥 Стан для перемикання на інфо-сторінку
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
        const endpoint = type === 'seasonal'
            ? `${API_BASE_URL}/users/ranking/seasonal`
            : `${API_BASE_URL}/users/ranking/win-rate`;

        const fetchRanking = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(endpoint);
                if (!response.ok) throw new Error('Failed');
                const data = await response.json();
                setUsers(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRanking();
    }, [type]);

    const getMedalIcon = (rank) => {
        if (rank === 1) return Config.IMAGES.gold_medal;
        if (rank === 2) return Config.IMAGES.iron_medal;
        if (rank === 3) return Config.IMAGES.copper_medal;
        return null;
    };

    // 🔥 ЯКЩО НАТИСНУЛИ "ІНФО" -> ПОКАЗУЄМО RATING INFO
    if (showInfo) {
        return <RatingInfo type={type} onBack={() => setShowInfo(false)} />;
    }

    // ІНАКШЕ -> ПОКАЗУЄМО СПИСОК
    const renderContent = () => {
        if (isLoading) return <div className={styles.statusText}>Завантаження...</div>;
        if (!users || users.length === 0) return <div className={styles.statusText}>Рейтинг порожній</div>;

        return users.map((user, index) => {
            const rank = index + 1;
            if (type === 'seasonal') {
                return <RatingItem key={index} rank={rank} icon={getMedalIcon(rank)} name={`${user.user_name} (${user.team_name})`} score={user.points} scoreUnit="PTS" index={index} />;
            }
            const total = user.final_count_of_matches || 0;
            const wins = user.final_winner_matches || 0;
            return <RatingItem key={index} rank={rank} icon={getMedalIcon(rank)} name={`${user.user_name} (${wins}/${total})`} score={Math.trunc(Number(user.precent_winner_matches) || 0)} scoreUnit="%" index={index} />;
        });
    };

    // Текст кнопки знизу
    const infoBtnText = type === 'seasonal' ? 'Як формується рейтинг?' : 'Інформація про вінрейт';

    return (
        <div className={styles.weeklyContainer}>
            {/* Фільтри */}
            <div className={styles.subFilterRow}>
                <div className={`${styles.subFilter} ${type === 'seasonal' ? styles.activeSub : ''}`} onClick={() => setType('seasonal')}>Топ Гравці</div>
                <div className={`${styles.subFilter} ${type === 'win_rate' ? styles.activeSub : ''}`} onClick={() => setType('win_rate')}>Вінрейт</div>
            </div>

            {/* Список */}
            <div className={styles.listWrapper}>
                {renderContent()}
            </div>

            {/* 🔥 КНОПКА "ЯК ЦЕ ПРАЦЮЄ" ВНИЗУ СПИСКУ */}
            <div className={styles.howToContainer} onClick={() => setShowInfo(true)}>
                <img src={Config.IMAGES.left_arrow} alt="<" className={styles.arrowIconSmall} />
                <span className={styles.howToText}>{infoBtnText}</span>
                <img src={Config.IMAGES.right_arrow} alt=">" className={styles.arrowIconSmall} />
            </div>
        </div>
    );
};

export default LeagueWeekly;