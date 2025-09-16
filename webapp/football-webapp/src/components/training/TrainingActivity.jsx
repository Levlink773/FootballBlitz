import React from 'react';

import styles from '../../css_files/training/TrainingActivity.module.css';

import Config from "../../config.js";



/**

 * Компонент для відображення поточної активності тренування.

 * @param {object} props - Пропси компонента.

 * @param {string} props.chance - Шанс на успіх (наприклад, "~ 35%").

 * @param {string} props.timeLeft - Час, що залишився (наприклад, "00:23:45").

 */

function TrainingActivity({ chance, timeLeft, className }) {

    return (

// Контейнеру добавлен класс для анимации появления

        <div className={`${styles.container} ${styles.fadeIn} ${className || ''}`}>

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