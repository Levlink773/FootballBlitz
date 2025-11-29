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

// Константи залишаємо як були, тільки переконайся, що FIRST_TRAINING_OPTION має потрібні поля
const TRAINING_OPTIONS = [
    { id: 1, bg: Config.IMAGES.train_line, chance: '~35%', duration: '30 хв.', cost: -10, actionImg: Config.IMAGES.gold_line, actionIcon: Config.IMAGES.energy },
    { id: 2, bg: Config.IMAGES.train_line, chance: '~45%', duration: '60 хв.', cost: -20, actionImg: Config.IMAGES.gold_line, actionIcon: Config.IMAGES.energy },
    { id: 3, bg: Config.IMAGES.train_line, chance: '~55%', duration: '90 хв.', cost: -40, actionImg: Config.IMAGES.gold_line, actionIcon: Config.IMAGES.energy },
    { id: 4, bg: Config.IMAGES.train_line, chance: '~75%', duration: '120 хв.', cost: -60, actionImg: Config.IMAGES.gold_line, actionIcon: Config.IMAGES.energy },
];

const FIRST_TRAINING_OPTION = {
    id: 'first_training',
    bg: Config.IMAGES.train_line,
    chance: '~100%',
    duration: '5 хв.',
    cost: 0,
    actionImg: Config.IMAGES.gold_line,
    actionIcon: Config.IMAGES.energy,
    isFirstTraining: true,
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

    const displayedOptions = useMemo(() => {
        if (user?.status_register === 'FIRST_TRAINING') {
            // Показуємо модалку тільки один раз при вході, логіку модалки не чіпаєм
                const msg = `
Вітаю на тренуванні! Готовий до першого кроку у великий футбол? 🏟️
Тисни Ок та «Почати безкоштовно»!
                `;
                showInfoModal({
                    image: Config.IMAGES.training_info,
                    text: msg
                });

            // 🔥 ЗМІНА: Повертаємо ЛИШЕ перше тренування, без інших опцій
            return [FIRST_TRAINING_OPTION];
        }
        return TRAINING_OPTIONS;
    }, [user]);

    // ... useEffect для checkTrainingStatus залишається без змін ...
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
        // ... логіка handleStartTraining залишається без змін ...
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
            await fetchUser();
            const response = await axios.get(`${API_BASE_URL}/training/status/${user.user_id}`);
            setIsTrainingActive(response.data.in_training);
            const msg = `
            Перше тренування стартувало!
            Тепер вирушаємо до арени бліц-турніру 🏟️
                `;
            showInfoModal({
                image: Config.IMAGES.training_info,
                text: msg
            });

        } catch (error) {
            const errorMessage = error.response?.data?.detail || 'Сталася помилка. Спробуйте знову.';
            showAlert(errorMessage);
        }
    };

    return (
        <div className={styles.page}>
            <img className={styles.pageBackgroundBlur} src={Config.IMAGES.training_background} alt="" />
            <div className={styles.mainContainer} data-modal-root>
                <Header user={user}/>
                <img
                    src={Config.IMAGES.training_background}
                    alt="background"
                    className={styles.backgroundImage}
                />

                <div className={styles.trainingScrollContent}>
                    <TrainingStatus user={user} />

                    <div className={styles.trainingTitleStatic}>
                        ТРЕНУВАЛЬНА ЗАЛА
                    </div>

                    <div className={styles.optionsList}>
                        {displayedOptions.map(option => {
                            const isFirstTrainingMode = user?.status_register === 'FIRST_TRAINING';

                            return (
                                <TrainingOption
                                    key={option.id}
                                    bg={option.bg}
                                    chance={option.chance}
                                    duration={option.duration}
                                    cost={option.cost}
                                    actionImg={option.actionImg}
                                    actionIcon={option.actionIcon}
                                    onStartTraining={() => handleStartTraining(option.duration, option.cost, !!option.isFirstTraining)}
                                    // 🔥 Передаємо новий проп для стилізації
                                    isFirstTrainingMode={isFirstTrainingMode}
                                />
                            );
                        })}
                    </div>
                </div>

                <NavigationBar/>
            </div>
        </div>
    );
}