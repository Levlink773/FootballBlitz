import React from 'react';
import PropTypes from 'prop-types';
import styles from '../../css_files/training/TrainingOption.module.css'; // Предполагаем, что CSS файл лежит рядом

export default function TrainingOption({ bg, chance, duration, cost, actionImg, actionIcon }) {
    return (
        <div className={styles.container}>
            {/* Фон */}
            <img src={bg} alt="background" className={styles.background} />

            {/* Вертикальные линии */}
            <div className={`${styles.separator} ${styles.separator1}`}></div>
            <div className={`${styles.separator} ${styles.separator2}`}></div>

            {/* Секция с шансом */}
            <div className={styles.chanceWrapper}>
                <span className={styles.label}>Шанс підвищення</span>
                <span className={styles.chanceValue}>{chance}</span>
            </div>

            {/* Длительность */}
            <div className={styles.duration}>
                {duration}
            </div>

            {/* Кнопка действия */}
            <button className={styles.actionButton} style={{ backgroundImage: `url(${actionImg})` }}>
                <span className={styles.actionButtonText}>Розпочати {cost}</span>
                <img src={actionIcon} alt="action icon" className={styles.actionButtonIcon} />
            </button>
        </div>
    );
}

TrainingOption.propTypes = {
    bg: PropTypes.string.isRequired,
    chance: PropTypes.string.isRequired,
    duration: PropTypes.string.isRequired,
    cost: PropTypes.number.isRequired,
    actionImg: PropTypes.string.isRequired,
    actionIcon: PropTypes.string.isRequired,
};