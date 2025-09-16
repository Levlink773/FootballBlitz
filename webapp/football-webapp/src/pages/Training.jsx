import React from 'react';
import {Header} from "../components/Header.jsx";
import Config from "../config.js";
import {NavigationBar} from "../components/NavigationBar.jsx";
import styles from '../css_files/Main.module.css';
import TrainingOption from "../components/training/TrainingOption.jsx";
import TrainingStatus from "../components/training/TrainingStatus.jsx";
const TRAINING_OPTIONS = [
    { id: 1, bg: Config.IMAGES.train_line, chance: '~35%', duration: '30 хв.', cost: -10, actionImg: Config.IMAGES.gold_line, actionIcon: Config.IMAGES.energy },
    { id: 2, bg: Config.IMAGES.train_line, chance: '~45%', duration: '60 хв.', cost: -20, actionImg: Config.IMAGES.gold_line, actionIcon: Config.IMAGES.energy },
    { id: 3, bg: Config.IMAGES.train_line, chance: '~55%', duration: '90 хв.', cost: -40, actionImg: Config.IMAGES.gold_line, actionIcon: Config.IMAGES.energy },
    { id: 4, bg: Config.IMAGES.train_line, chance: '~75%', duration: '120 хв.', cost: -60, actionImg: Config.IMAGES.gold_line, actionIcon: Config.IMAGES.energy },
];

export default function TrainingRoomCard({user}) {
    return (
        <div className={styles.mainContainer}>
            <Header user={user} />
            <img
                src={Config.IMAGES.training_background}
                alt="background"
                className={styles.backgroundImage}
            />

            {/* Передаємо клас для позиціонування */}
            <TrainingStatus
                userId={user.user_id}
            />
            {/* ОСЬ ВАШ НОВИЙ ЕЛЕМЕНТ */}
            <div className={styles.trainingRoomTitle}>
                ТРЕНУВАЛЬНА ЗАЛА
            </div>
            {/* Опции */}
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
                    />
                ))}
            </div>
            {/* Здесь будет 4 опции */}
            <NavigationBar />
        </div>
    );
}