import React, {useEffect, useMemo, useState} from 'react';
import {Header} from "../components/Header.jsx";
import Config from "../config.js";
import axios from 'axios';
import {NavigationBar} from "../components/NavigationBar.jsx";
import styles from '../css_files/Main.module.css';
import TrainingOption from "../components/training/TrainingOption.jsx";
import TrainingStatus from "../components/training/TrainingStatus.jsx";
import {showAlert, showInfoModal} from "../alertService.jsx";
import useWebSocket from "../../useWebsocket.js";
import {API_BASE_URL} from "../api.js";

const TRAINING_OPTIONS_F = [
    // Обратите внимание: убрал id: 1, чтобы избежать дублирования с первой тренировкой
    // Если id важны для чего-то еще, убедитесь в их уникальности
    {
        id: 2,
        bg: Config.IMAGES.train_line,
        chance: '~45%',
        duration: '60 хв.',
        cost: -20,
        actionImg: Config.IMAGES.gold_line,
        actionIcon: Config.IMAGES.energy
    },
    {
        id: 3,
        bg: Config.IMAGES.train_line,
        chance: '~55%',
        duration: '90 хв.',
        cost: -40,
        actionImg: Config.IMAGES.gold_line,
        actionIcon: Config.IMAGES.energy
    },
    {
        id: 4,
        bg: Config.IMAGES.train_line,
        chance: '~75%',
        duration: '120 хв.',
        cost: -60,
        actionImg: Config.IMAGES.gold_line,
        actionIcon: Config.IMAGES.energy
    },
];
const TRAINING_OPTIONS = [
    {
        id: 1,
        bg: Config.IMAGES.train_line,
        chance: '~35%',
        duration: '30 хв.',
        cost: -10,
        actionImg: Config.IMAGES.gold_line,
        actionIcon: Config.IMAGES.energy
    },
    {
        id: 2,
        bg: Config.IMAGES.train_line,
        chance: '~45%',
        duration: '60 хв.',
        cost: -20,
        actionImg: Config.IMAGES.gold_line,
        actionIcon: Config.IMAGES.energy
    },
    {
        id: 3,
        bg: Config.IMAGES.train_line,
        chance: '~55%',
        duration: '90 хв.',
        cost: -40,
        actionImg: Config.IMAGES.gold_line,
        actionIcon: Config.IMAGES.energy
    },
    {
        id: 4,
        bg: Config.IMAGES.train_line,
        chance: '~75%',
        duration: '120 хв.',
        cost: -60,
        actionImg: Config.IMAGES.gold_line,
        actionIcon: Config.IMAGES.energy
    },
];
const FIRST_TRAINING_OPTION = {
    id: 'first_training', // Уникальный ID
    bg: Config.IMAGES.train_line,
    chance: '~100%',
    duration: '5 хв.', // 5 минут
    cost: 0, // Бесплатно для первого раза
    actionImg: Config.IMAGES.gold_line,
    actionIcon: Config.IMAGES.energy,
    isFirstTraining: true, // Флаг для идентификации
};

export default function TrainingRoomCard({user, setUser}) {
    const [isTrainingActive, setIsTrainingActive] = useState(false);
    useWebSocket(user?.user_id);

    const fetchUser = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/users/${user.user_id}`);
            if (!res.ok) return;
            const userData = await res.json();
            if (setUser) setUser(userData);
        } catch (e) {
            console.error("fetchUser error", e);
        }
    };

    // ✨ ИЗМЕНЕНИЕ 1: Обновленная логика для отображения опций
    const displayedOptions = useMemo(() => {
        if (user?.status_register === 'FIRST_TRAINING') {
            // Показываем специальную первую опцию и остальные стандартные
            const msg = `
🔹 Тренер:
— Вітаю! Я чекав саме на тебе. 🏟️
Перший крок до великого футболу — перше тренування.
Тисни Ок та «Почати» — і я підкажу, що робити далі.
            `;
            showInfoModal({
                image: Config.IMAGES.training_info, // або просто "/assets/images/success_icon.png"
                text: msg
            })
            return [FIRST_TRAINING_OPTION, ...TRAINING_OPTIONS_F];
        }
        // В противном случае, показываем стандартный список
        return TRAINING_OPTIONS;
    }, [user]);

    useEffect(() => {
        if (!user?.user_id) return;
        const checkTrainingStatus = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/training/status/${user.user_id}`);
                setIsTrainingActive(response.data.in_training);
            } catch (error) {
                console.error("Error fetching training status:", error);
            }
        };
        checkTrainingStatus();
    }, [user?.user_id]);

    const handleStartTraining = async (duration, cost, isFirst = false) => {
        if (isTrainingActive) {
            showAlert('Тренування вже відбувається. Дочекайтесь його закінчення.');
            return;
        }

        const durationInSeconds = parseInt(duration, 10) * 60;

        try {
            await axios.post(`${API_BASE_URL}/training/start`, {
                user_id: user.user_id,
                gym_time_seconds: durationInSeconds,
                cost_energy: Math.abs(cost),
                is_first_training: isFirst,
            });

            showAlert('Перше тренування успішно розпочато!');
            await fetchUser();
            console.log("User status: ", user.status);
            const response = await axios.get(`${API_BASE_URL}/training/status/${user.user_id}`);
            setIsTrainingActive(response.data.in_training);

        } catch (error) {
            const errorMessage = error.response?.data?.detail || 'Сталася помилка. Спробуйте знову.';
            showAlert(errorMessage);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.mainContainer} data-modal-root>
                <Header user={user}/>
                <img
                    src={Config.IMAGES.training_background}
                    alt="background"
                    className={styles.backgroundImage}
                />

                <TrainingStatus user={user} />
                <div className={styles.trainingRoomTitle}>
                    ТРЕНУВАЛЬНА ЗАЛА
                </div>

                <div
                    style={{
                        position: 'absolute',
                        top: 270,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                    }}
                >
                    {displayedOptions.map(option => {
                        // ✨ ИЗМЕНЕНИЕ 2: Определяем, нужно ли блокировать кнопку
                        const isFirstTrainingPending = user?.status_register === 'FIRST_TRAINING';
                        const isThisTheFirstOption = option.id === 'first_training';

                        // ✨ ИЗМЕНЕНИЕ 3: Создаем обработчик клика в зависимости от статуса
                        const clickHandler = () => {
                            if (isFirstTrainingPending && !isThisTheFirstOption) {
                                showAlert('Спочатку пройдіть перше тренування.');
                            } else {
                                handleStartTraining(option.duration, option.cost, !!option.isFirstTraining);
                            }
                        };

                        return (
                            <TrainingOption
                                key={option.id}
                                bg={option.bg}
                                chance={option.chance}
                                duration={option.duration}
                                cost={option.cost}
                                actionImg={option.actionImg}
                                actionIcon={option.actionIcon}
                                onStartTraining={clickHandler}
                                isHighlighted={isFirstTrainingPending && isThisTheFirstOption}
                            />
                        );
                    })}
                </div>
                <NavigationBar/>
            </div>
        </div>
    );
}