import React from 'react';
import styles from '../../css_files/main_css/StatsPanel.module.css';

const statsData = [
    { value: '903', label: 'гри' },
    { value: '89.3%', label: 'перемог' },
    { value: '120', label: 'турнірів' },
];

const StatBox = ({ value, label }) => (
    <div className={styles.statBox}>
        <span className={styles.statValue}>{value}</span>
        <span className={styles.statLabel}>{label}</span>
    </div>
);

export const StatsPanel = () => {
    return (
        <div className={styles.statsPanel}>
            {/* --- Верхний блок с переключателем --- */}
            <div className={styles.header}>
                <div className={styles.title}>Статистика</div>
                <div className={styles.toggleContainer}>
                    <div className={styles.toggleCircle}></div>
                </div>
                <div className={styles.title}>Рейтинги</div>
            </div>

            {/* --- Блок с тремя колонками статистики --- */}
            <div className={styles.statsContainer}>
                {statsData.map((stat, index) => (
                    <React.Fragment key={index}>
                        <StatBox value={stat.value} label={stat.label} />
                        {/* Добавляем divider только между элементами */}
                        {index < statsData.length - 1 && <div className={styles.divider}></div>}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};