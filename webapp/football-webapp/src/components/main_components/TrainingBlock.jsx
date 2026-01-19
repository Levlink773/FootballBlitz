import React, { useState, useEffect } from 'react';
import styles from '../../css_files/main_css/TrainingBlock.module.css';
import Config from "../../config.js";
import { API_BASE_URL } from "../../api.js";
import { showAlert, showInfoModal } from "../../alertService.jsx";
import { FaDumbbell, FaBolt } from "react-icons/fa";

// Training Options Configuration
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

    // 1. Check Status on Load
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

    // 2. Timer Logic
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

    // Helper: Format Seconds to HH:MM:SS
    const formatTime = (sec) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Calculate Progress Percentage
    const progressPercent = trainingState.isActive
        ? Math.max(0, Math.min(100, ((trainingState.totalTime - trainingState.timeLeft) / trainingState.totalTime) * 100))
        : 0;

    // Handle Click (Start or Check Status)
    const handleOptionClick = async (opt) => {
        // --- LOGIC CHANGE: If active, show alert and stop ---
        if (trainingState.isActive) {
            const minutesLeft = Math.ceil(trainingState.timeLeft / 60);
            showAlert(`Training is currently in progress! Please wait ${minutesLeft} minutes.`);
            return;
        }

        // --- Standard Start Logic ---
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

            showInfoModal({ text: `Training Started: ${opt.label}`, image: Config.IMAGES.training_info });

        } catch (e) {
            showAlert(e.message);
        }
    };

    return (
        <div className={styles.wrapper}>

            {/* HEADER */}
            <div className={`${styles.header} ${trainingState.isActive ? styles.activeHeader : ''}`}>
                <div className={styles.headerLeft}>
                    <div className={`${styles.iconCircle} ${trainingState.isActive ? styles.pulse : ''}`}>
                        <FaDumbbell />
                    </div>
                    <span className={styles.statusText}>
                        {trainingState.isActive ? 'TRAINING IN PROGRESS' : 'TRAINING CENTER'}
                    </span>
                </div>

                <div className={styles.headerRight}>
                    {trainingState.isActive && (
                        <div className={styles.timerBadge}>
                            {formatTime(trainingState.timeLeft)}
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                {trainingState.isActive && (
                    <div className={styles.progressBar}>
                        <div
                            className={styles.progressFill}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                )}
            </div>

            {/* OPTIONS GRID - Always visible now */}
            <div className={styles.optionsGrid}>
                {TRAINING_OPTIONS.map((opt) => (
                    <div
                        key={opt.id}
                        // Add 'disabledOption' class if training is active
                        className={`${styles.optionBtn} ${trainingState.isActive ? styles.disabledOption : ''}`}
                        onClick={() => handleOptionClick(opt)}
                    >
                        <span className={styles.optLabel}>{opt.label}</span>
                        <span className={styles.optTime}>{opt.duration}</span>
                        <span className={styles.optCost}>
                            {Math.abs(opt.cost)} <FaBolt style={{fontSize: 9}}/>
                        </span>
                    </div>
                ))}
            </div>

        </div>
    );
};

export default TrainingBlock;