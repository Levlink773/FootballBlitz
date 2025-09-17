import React from 'react';
import PropTypes from 'prop-types';
import styles from '../../css_files/training/TrainingOption.module.css';

// 1. Add 'onStartTraining' to the props
export default function TrainingOption({ bg, chance, duration, cost, actionImg, actionIcon, onStartTraining }) {
    return (
        <div className={styles.container}>
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

            {/* 2. Add the onClick event to the button */}
            <button
                className={styles.actionButton}
                style={{ backgroundImage: `url(${actionImg})` }}
                onClick={onStartTraining}
            >
                {/* Displaying cost with a minus sign for UI consistency */}
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
    // 3. Define the new prop type
    onStartTraining: PropTypes.func.isRequired,
};