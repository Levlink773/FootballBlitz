import React, { useState } from 'react';
import { useSpring, animated } from 'react-spring';
import styles from '../../css_files/main_css/StatsPanel.module.css';

// Компоненты AnimatedNumber и StatBox остаются без изменений

const statsData = [
    { value: 903, label: 'гри' },
    { value: 89.3, label: 'перемог', isPercent: true },
    { value: 120, label: 'турнірів' },
];

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


const StatBox = ({ value, label, isPercent }) => (
    <div className={styles.statBox}>
        <div className={styles.statValue}>
            <AnimatedNumber n={value} isPercent={isPercent} />
        </div>
        <span className={styles.statLabel}>{label}</span>
    </div>
);

export const StatsPanel = () => {
    const [isRatings, setIsRatings] = useState(false);

    const handleToggle = () => {
        setIsRatings(!isRatings);
    };

    return (
        <div className={styles.statsPanel}>
            {/* === ДОБАВЛЕНА НАДПИСЬ "ТЕСТ" === */}
            <div className={styles.testLabel}>ТЕСТ</div>

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

            {/* --- Блок с тремя колонками статистики --- */}
            <div className={styles.statsContainer}>
                {statsData.map((stat, index) => (
                    <React.Fragment key={index}>
                        <StatBox value={stat.value} label={stat.label} isPercent={stat.isPercent} />
                        {index < statsData.length - 1 && <div className={styles.divider}></div>}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};