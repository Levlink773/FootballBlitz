import React from 'react';
import PropTypes from 'prop-types';
import styles from '../../css_files/training/TrainingOption.module.css';

// 1. Add 'onStartTraining' to the props
export default function TrainingOption({ bg, chance, duration, cost, actionImg, actionIcon, onStartTraining, isHighlighted }) {
    const containerClasses = `${styles.container} ${isHighlighted ? styles.highlighted : ''}`;
    return (
        // ✨ 3. Применяем классы к контейнеру
        <div className={containerClasses}>
            <img src={bg} alt="background" className={styles.background} />

            <div className={`${styles.separator} ${styles.separator1}`}></div>
            <div className={`${styles.separator} ${styles.separator2}`}></div>

            <div className={styles.chanceWrapper}>
                <span className={styles.label}>Шанс підвищення</span>
                <span className={styles.chanceValue}>{chance}</span>
            </div>

            <div className={styles.duration}>
                {duration}
            </div>

            <button
                className={styles.actionButton}
                style={{ backgroundImage: `url(${actionImg})` }}
                onClick={onStartTraining}
            >
                {/* Для бесплатной тренировки можно показать другой текст */}
                <span className={styles.actionButtonText}>
                    {cost === 0 ? "Почати" : `Розпочати ${cost}`}
                </span>
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
    // 3. Define the new prop type
    onStartTraining: PropTypes.func.isRequired,
};

TrainingOption.defaultProps = {
    isHighlighted: false,
};