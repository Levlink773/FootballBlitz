import React, {useEffect, useState} from 'react';
import {Header} from "../components/Header.jsx";
import Config from "../config.js";
import axios from 'axios';
import {NavigationBar} from "../components/NavigationBar.jsx";
import styles from '../css_files/Main.module.css';
import TrainingOption from "../components/training/TrainingOption.jsx";
import TrainingStatus from "../components/training/TrainingStatus.jsx";
import {showAlert} from "../alertService.jsx";
import useWebSocket from "../../useWebsocket.js";
import {API_BASE_URL} from "../api.js";
const TRAINING_OPTIONS = [
    { id: 1, bg: Config.IMAGES.train_line, chance: '~35%', duration: '30 хв.', cost: -10, actionImg: Config.IMAGES.gold_line, actionIcon: Config.IMAGES.energy },
    { id: 2, bg: Config.IMAGES.train_line, chance: '~45%', duration: '60 хв.', cost: -20, actionImg: Config.IMAGES.gold_line, actionIcon: Config.IMAGES.energy },
    { id: 3, bg: Config.IMAGES.train_line, chance: '~55%', duration: '90 хв.', cost: -40, actionImg: Config.IMAGES.gold_line, actionIcon: Config.IMAGES.energy },
    { id: 4, bg: Config.IMAGES.train_line, chance: '~75%', duration: '120 хв.', cost: -60, actionImg: Config.IMAGES.gold_line, actionIcon: Config.IMAGES.energy },
];

export default function TrainingRoomCard({ initialUserFromServer }) {
    // 1. State to track if training is active
    const [isTrainingActive, setIsTrainingActive] = useState(false);
    const [user, setUser] = useState(initialUserFromServer);
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

    // 2. Fetch training status when the component mounts
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

    // 3. Handler to start training
    const handleStartTraining = async (duration, cost) => {
        // First, check the state. If active, show an alert.
        if (isTrainingActive) {
            showAlert('Тренування вже відбувається. Дочекайтесь його закінчення.');
            return;
        }

        // Convert duration string ('30 хв.') to seconds
        const durationInSeconds = parseInt(duration, 10) * 60;

        try {
            // Call the backend API
            await axios.post(`${API_BASE_URL}/training/start`, {
                user_id: user.user_id,
                gym_time_seconds: durationInSeconds,
                cost_energy: Math.abs(cost) // Cost is already a positive number
            });

            showAlert('Тренування успішно розпочато!');
            // A simple way to refresh the component's state is to reload the page.
            // This will update the TrainingStatus component as well.
            await fetchUser()

        } catch (error) {
            // Display backend error message (e.g., "Not enough energy")
            const errorMessage = error.response?.data?.detail || 'Сталася помилка. Спробуйте знову.';
            showAlert(errorMessage);
        }
    };


    return (
        <div className={styles.mainContainer} data-modal-root>
            <Header user={user} />
            <img
                src={Config.IMAGES.training_background}
                alt="background"
                className={styles.backgroundImage}
            />

            <TrainingStatus
                user={user}
            />
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
                {TRAINING_OPTIONS.map(option => (
                    <TrainingOption
                        key={option.id}
                        bg={option.bg}
                        chance={option.chance}
                        duration={option.duration}
                        cost={option.cost}
                        actionImg={option.actionImg}
                        actionIcon={option.actionIcon}
                        // 4. Pass the handler function to the child component
                        onStartTraining={() => handleStartTraining(option.duration, option.cost)}
                    />
                ))}
            </div>
            <NavigationBar />
        </div>
    );
}