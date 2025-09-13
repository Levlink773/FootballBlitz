import React from 'react';
import styles from '../../css_files/training/TrainingActivity.module.css';
import Config from "../../assets_data.js";

/**
 * Компонент для відображення поточної активності тренування.
 * @param {object} props - Пропси компонента.
 * @param {string} props.chance - Шанс на успіх (наприклад, "~ 35%").
 * @param {string} props.timeLeft - Час, що залишився (наприклад, "00:23:45").
 */
function TrainingActivity({ chance, timeLeft, className }) {
    return (
        // 2. Додаємо зовнішній клас до існуючих
        <div className={`${styles.container} ${className || ''}`}>
            <img
                className={styles.background}
                src={Config.IMAGES.train_active}
                alt="Поточне тренування"
            />
            <div className={styles.title}>
                ПОТОЧНЕ ТРЕНУВАННЯ:
            </div>
            <div className={styles.chance}>
                ШАНС {chance}
            </div>
            <div className={styles.timer}>
                {timeLeft}
            </div>
        </div>
    );
}

export default TrainingActivity;