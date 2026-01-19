import React, { useState, useEffect } from 'react';
import { FaTrophy, FaClock, FaStar } from 'react-icons/fa';
import styles from '../../css_files/league/SeasonHeader.module.css'; // Стилі зробимо окремо

const SeasonHeader = ({ user }) => {
    const [timeLeft, setTimeLeft] = useState("");
    const [seasonNumber, setSeasonNumber] = useState(1);

    // Очки з сезонного пропуску (або 0, якщо немає)
    const userPoints = user?.season_pass?.points || 0;

    // Логіка визначення рангу (поки проста заглушка на основі очок, пізніше підключимо лідерборд)
    // Наприклад: 0-100 Bronze, 100-500 Silver, 500+ Gold
    const getRankTitle = (points) => {
        if (points >= 1000) return "LEGEND";
        if (points >= 500) return "MASTER";
        if (points >= 200) return "PRO";
        return "ROOKIE";
    };

    useEffect(() => {
        const calculateTime = () => {
            const now = new Date();
            // Поточний місяць (0-11) + 1 = Номер сезону
            setSeasonNumber(now.getMonth() + 1);

            // Ціль: 1-ше число наступного місяця, 00:00:00
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            const nextMonth = new Date(currentYear, currentMonth + 1, 1, 0, 0, 0);

            const diff = nextMonth - now;

            if (diff <= 0) return "00d 00h";

            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / 1000 / 60) % 60);

            return `${d}d ${h}h ${m}m`;
        };

        setTimeLeft(calculateTime());
        const timer = setInterval(() => {
            setTimeLeft(calculateTime());
        }, 60000); // Оновлюємо раз на хвилину, секунди тут не критичні

        return () => clearInterval(timer);
    }, []);

    return (
        <div className={styles.seasonHeaderWrapper}>
            {/* Лівий блок: Сезон */}
            <div className={styles.seasonInfo}>
                <div className={styles.seasonLabel}>SEASON</div>
                <div className={styles.seasonValue}>
                    <span className={styles.hash}>#</span>{seasonNumber}
                </div>
            </div>

            {/* Центральний блок: Таймер */}
            <div className={styles.timerContainer}>
                <div className={styles.timerLabel}>
                    <FaClock className={styles.timerIcon} /> ENDS IN
                </div>
                <div className={styles.timerValue}>{timeLeft}</div>
            </div>

            {/* Правий блок: Ранг та Очки */}
            <div className={styles.rankInfo}>
                <div className={styles.rankLabel}>{getRankTitle(userPoints)}</div>
                <div className={styles.pointsValue}>
                    <FaTrophy className={styles.rankIcon} />
                    {userPoints}
                </div>
            </div>

            {/* Декоративний блік */}
            <div className={styles.sheen}></div>
        </div>
    );
};

export default SeasonHeader;