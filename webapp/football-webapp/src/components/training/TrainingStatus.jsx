// src/components/training/TrainingStatus.js

import React, { useState, useEffect } from 'react';
import TrainingActivity from './TrainingActivity'; // Імпортуємо ваш компонент
import styles from '../../css_files/training/TrainingActivity.module.css';
import Config from "../../config.js";
import {API_BASE_URL} from "../../api.js";

// Створюємо JavaScript-аналог словника chance_add_point з бекенду
// Ключі - тривалість тренування в секундах
const chanceAddPoint = {
    300: 100,  // 5 minutes (ПЕРША ТРЕНІРОВКА)
    120: 60,   // 2 minutes
    1800: 35,  // 30 minutes
    3600: 45,  // 60 minutes (1 hour)
    5400: 55,  // 90 minutes
    7200: 75,  // 120 minutes (2 hours)
    5: 90,     // 5 seconds (для тестування)
};

/**
 * Функція для форматування секунд у строку "HH:MM:SS".
 * @param {number} totalSeconds - Загальна кількість секунд.
 * @returns {string} Відформатований час.
 */
const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num) => num.toString().padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};


/**
 * Компонент, що завантажує та відображає статус поточного тренування.
 * @param {object} props - Пропси компонента.
 * @param {number} props.user - ID поточного користувача.
 */
function TrainingStatus({ user }) {
    const [isLoading, setIsLoading] = useState(true);
    const [trainingInfo, setTrainingInfo] = useState({
        isActive: false,
        chance: '',
        timeLeft: '00:00:00',
    });

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const fetchTrainingData = async () => {
            setIsLoading(true);
            try {
                // Запитуємо статус тренування
                const statusRes = await fetch(`${API_BASE_URL}/training/status/${user.user_id}`); // Переконайтеся, що шлях правильний
                const statusData = await statusRes.json();

                if (statusData.in_training) {
                    // Якщо тренування активне, запитуємо залишок часу та загальну тривалість
                    const remainingRes = await fetch(`${API_BASE_URL}/training/remaining/${user.user_id}`);
                    const remainingData = await remainingRes.json();

                    const { seconds_remaining, total_training_seconds } = remainingData;

                    if (seconds_remaining > 0) {
                        const chanceValue = chanceAddPoint[total_training_seconds] || 0;

                        setTrainingInfo({
                            isActive: true,
                            chance: `~ ${chanceValue}%`,
                            timeLeft: formatTime(seconds_remaining),
                            // Зберігаємо секунди для внутрішнього таймера
                            _secondsRemaining: seconds_remaining
                        });
                    } else {
                        setTrainingInfo({ isActive: false });
                    }
                } else {
                    setTrainingInfo({ isActive: false });
                }
            } catch (error) {
                console.error("Помилка завантаження даних про тренування:", error);
                setTrainingInfo({ isActive: false }); // У випадку помилки показуємо, що тренування немає
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrainingData();
    }, [user]);

    // Цей useEffect відповідає за зворотний відлік
    useEffect(() => {
        if (!trainingInfo.isActive || trainingInfo._secondsRemaining <= 0) {
            return;
        }

        // Запускаємо інтервал, що віднімає одну секунду кожну секунду
        const timerInterval = setInterval(() => {
            setTrainingInfo(prevInfo => {
                const newSeconds = prevInfo._secondsRemaining - 1;
                if (newSeconds <= 0) {
                    clearInterval(timerInterval); // Зупиняємо таймер
                    // Коли час вийшов, можна оновити дані або просто приховати компонент
                    return { ...prevInfo, isActive: false };
                }
                return {
                    ...prevInfo,
                    _secondsRemaining: newSeconds,
                    timeLeft: formatTime(newSeconds),
                };
            });
        }, 1000);

        // Функція очищення: зупиняє інтервал, якщо компонент буде демонтовано
        return () => clearInterval(timerInterval);
    }, [trainingInfo.isActive, trainingInfo._secondsRemaining]);


    if (isLoading) {
        return <div>Завантаження статусу тренування...</div>; // Або будь-який інший лоадер
    }

    if (trainingInfo.isActive) {
        return <TrainingActivity chance={trainingInfo.chance} timeLeft={trainingInfo.timeLeft} />;
    }

    // Якщо тренування неактивне, рендеримо альтернативний вигляд
    return (
        <div className={`${styles.container} ${styles.fadeIn}`}>
            <img
                className={styles.background}
                src={Config.IMAGES.train_active} // Можна використовувати інше, "неактивне" зображення
                alt="Немає тренування"
            />
            <div className={styles.noTrainingText}>
                НЕМАЄ ПОТОЧНОГО ТРЕНУВАННЯ
            </div>
        </div>
    );
}

export default TrainingStatus;