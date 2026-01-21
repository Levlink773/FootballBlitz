import React, { useState, useEffect } from 'react';
import styles from '../../css_files/main_css/TrainingBlock.module.css';
import Config from "../../config.js";
import { API_BASE_URL } from "../../api.js";
import { showAlert, showInfoModal } from "../../alertService.jsx";
import { FaDumbbell, FaBolt, FaStopwatch } from "react-icons/fa"; // Додав FaStopwatch

const TRAINING_OPTIONS = [
    { id: 1, duration: '30m', seconds: 1800, cost: 10, label: 'Light' },
    { id: 2, duration: '1h', seconds: 3600, cost: 20, label: 'Medium' },
    { id: 3, duration: '1.5h', seconds: 5400, cost: 40, label: 'Hard' },
    { id: 4, duration: '2h', seconds: 7200, cost: 60, label: 'Pro' },
];

const TrainingBlock = ({ user, onUserUpdate }) => {
    const [trainingState, setTrainingState] = useState({
        isActive: false,
        timeLeft: 0,
        totalTime: 0
    });

    useEffect(() => {
        if (!user?.user_id) return;
        const fetchStatus = async () => {
            try {
                const statusRes = await fetch(`${API_BASE_URL}/training/status/${user.user_id}`);
                const statusData = await statusRes.json();

                if (statusData.in_training) {
                    const detailsRes = await fetch(`${API_BASE_URL}/training/remaining/${user.user_id}`);
                    const detailsData = await detailsRes.json();

                    setTrainingState({
                        isActive: true,
                        timeLeft: detailsData.seconds_remaining,
                        totalTime: detailsData.total_training_seconds || detailsData.seconds_remaining
                    });
                } else {
                    setTrainingState({ isActive: false, timeLeft: 0, totalTime: 0 });
                }
            } catch (e) {
                console.error("Training status error", e);
            }
        };
        fetchStatus();
    }, [user]);

    useEffect(() => {
        let interval;
        if (trainingState.isActive && trainingState.timeLeft > 0) {
            interval = setInterval(() => {
                setTrainingState(prev => {
                    if (prev.timeLeft <= 1) {
                        return { isActive: false, timeLeft: 0, totalTime: 0 };
                    }
                    return { ...prev, timeLeft: prev.timeLeft - 1 };
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [trainingState.isActive]);

    const formatTime = (sec) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const progressPercent = trainingState.isActive
        ? Math.max(0, Math.min(100, ((trainingState.totalTime - trainingState.timeLeft) / trainingState.totalTime) * 100))
        : 0;

    const handleOptionClick = async (opt) => {
        if (trainingState.isActive) {
            const minutesLeft = Math.ceil(trainingState.timeLeft / 60);
            showAlert(`Training in progress! Wait ${minutesLeft} min.`);
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/training/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.user_id,
                    gym_time_seconds: opt.seconds,
                    cost_energy: opt.cost,
                    is_first_training: false
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || 'Error');
            }

            setTrainingState({
                isActive: true,
                timeLeft: opt.seconds,
                totalTime: opt.seconds
            });

            const uRes = await fetch(`${API_BASE_URL}/users/${user.user_id}`);
            if (uRes.ok) onUserUpdate(await uRes.json());

            showInfoModal({ text: `Started: ${opt.label}`, image: Config.IMAGES.training_info });

        } catch (e) {
            showAlert(e.message);
        }
    };

    return (
        <div className={`${styles.wrapper} ${trainingState.isActive ? styles.wrapperActive : ''}`}>
            {/* Background Texture */}
            <div className={styles.bgLines}></div>

            {/* HEADER PANEL */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={`${styles.iconBox} ${trainingState.isActive ? styles.pulse : ''}`}>
                        <FaDumbbell />
                    </div>
                    <div className={styles.titleBlock}>
                        <span className={styles.titleLabel}>SYSTEM STATUS</span>
                        <span className={styles.mainTitle}>
                            {trainingState.isActive ? 'TRAINING ACTIVE' : 'TRAINING CENTER'}
                        </span>
                    </div>
                </div>

                <div className={styles.headerRight}>
                    {trainingState.isActive && (
                        <div className={styles.timerContainer}>
                            <FaStopwatch className={styles.timerIcon} />
                            <span className={styles.timerText}>{formatTime(trainingState.timeLeft)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* PROGRESS BAR (Only if active) */}
            <div className={styles.progressRail}>
                <div
                    className={styles.progressBeam}
                    style={{ width: trainingState.isActive ? `${progressPercent}%` : '0%', opacity: trainingState.isActive ? 1 : 0.3 }}
                ></div>
            </div>

            {/* OPTIONS GRID */}
            <div className={styles.optionsGrid}>
                {TRAINING_OPTIONS.map((opt) => (
                    <div
                        key={opt.id}
                        className={`${styles.optionBtn} ${trainingState.isActive ? styles.disabledOption : ''}`}
                        onClick={() => handleOptionClick(opt)}
                    >
                        <span className={styles.optLabel}>{opt.label}</span>
                        <div className={styles.optValues}>
                            <span className={styles.optTime}>{opt.duration}</span>
                            <span className={styles.optCost}>
                                {opt.cost} <FaBolt style={{fontSize: 8}}/>
                            </span>
                        </div>
                        {/* Decorative glow for button */}
                        <div className={styles.btnGlow}></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TrainingBlock;