// StatsPanel.js
import React from 'react';
import { useSpring, animated } from 'react-spring';
import styles from '../../css_files/main_css/StatsPanel.module.css';
import {API_BASE_URL} from "../../api.js";

// Компонент AnimatedNumber остается без изменений
const AnimatedNumber = ({ n, isPercent }) => {
    const { number } = useSpring({
        from: { number: 0 },
        to: { number: n },
        delay: 200,
        config: { mass: 1, tension: 20, friction: 10 },
    });
    return (
        <animated.span>
            {number.to((val) => {
                if (isPercent) {
                    return `${val.toFixed(1)}%`;
                }
                return val.toFixed(0);
            })}
        </animated.span>
    );
};

// Компонент StatBox теперь умеет отображать и текст, и числа
const StatBox = ({ value, label, isPercent, isLeague }) => (
    <div className={styles.statBox}>
        <div className={styles.statValue} style={isLeague ? {fontSize: 16, position: "relative", top: -5} : {}}>
            {typeof value === 'number' ? (
                <AnimatedNumber n={value} isPercent={isPercent} />
            ) : (
                <span>{value}</span> // Просто отображаем текст, если это не число
            )}
        </div>
        <span className={styles.statLabel} style={isLeague ? {position: "relative", top: 3} : {}}>{label}</span>
    </div>
);


export const StatsPanel = ({ user }) => {
    const [isRatings, setIsRatings] = React.useState(false);
    const [rankData, setRankData] = React.useState(null);
    const [loadingRank, setLoadingRank] = React.useState(true);

    const handleToggle = () => {
        setIsRatings(!isRatings);
    };

    // --- Получаем данные о рейтинге пользователя при загрузке компонента ---
    React.useEffect(() => {
        if (user && user.user_id) {
            const fetchRank = async () => {
                setLoadingRank(true);
                try {
                    // Укажите правильный URL вашего API
                    const response = await fetch(`${API_BASE_URL}/users/ranking/position?user_id=${user.user_id}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch rank');
                    }
                    const data = await response.json();
                    setRankData(data);
                } catch (error) {
                    console.error("Error fetching user rank:", error);
                    setRankData(null); // Сбрасываем в случае ошибки
                } finally {
                    setLoadingRank(false);
                }
            };

            fetchRank();
        }
    }, [user]); // Эффект перезапустится, если объект user изменится

    // --- Готовим данные для отображения ---

    // Данные для вкладки "Статистика"
    const statsData = [
        { value: user?.final_count_of_matches ?? 0, label: 'матчів' },
        { value: user?.precent_winner_matches ?? 0, label: 'перемог', isPercent: true },
        { value: user?.final_count_of_blitz ?? 0, label: 'турнірів' },
    ];

    // Данные для вкладки "Рейтинги"
    const ratingsData = [
        { value: loadingRank ? '...' : (rankData?.league ?? 'N/A'), label: 'Ліга', isLeague: true },
        { value: loadingRank ? '...' : (rankData?.position ?? 'N/A'), label: 'Позиція' },
    ];

    // Выбираем, какой массив данных показывать
    const currentData = isRatings ? ratingsData : statsData;

    return (
        <div className={styles.statsPanel}>
            {/* --- Верхний блок с переключателем --- */}
            <div className={styles.header}>
                <div className={`${styles.title} ${!isRatings ? styles.activeTitle : ''}`}>
                    Статистика
                </div>
                <div
                    className={`${styles.toggleContainer} ${isRatings ? styles.active : ''}`}
                    onClick={handleToggle}
                >
                    <div className={styles.toggleCircle}></div>
                </div>
                <div className={`${styles.title} ${isRatings ? styles.activeTitle : ''}`}>
                    Рейтинги
                </div>
            </div>

            {/* --- Блок с колонками, теперь рендерится динамически --- */}
            <div className={styles.statsContainer}>
                {currentData.map((stat, index) => (
                    <React.Fragment key={index}>
                        <StatBox value={stat.value} label={stat.label} isPercent={stat.isPercent} isLeague={stat.isLeague} />
                        {index < currentData.length - 1 && <div className={styles.divider}></div>}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};