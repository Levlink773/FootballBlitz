import React, { useState, useEffect } from 'react';
import styles from '../../css_files/main_css/DailyGoalSection.module.css'; // Нові стилі
import Config from "../../config.js";
import { API_BASE_URL } from "../../api.js";
import { showInfoModal, showAlert } from "../../alertService.jsx";
import { FaDumbbell, FaCheckCircle, FaGift } from "react-icons/fa"; // Додав FaGift

const DailyGoalSection = ({ user, onUserUpdate }) => {
    const [timeLeft, setTimeLeft] = useState("");
    const [taskClaiming, setTaskClaiming] = useState(false);

    // 1. Timer Logic
    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const target = new Date();
            target.setHours(22, 0, 0, 0);
            if (now > target) target.setDate(target.getDate() + 1);

            const diff = target - now;
            if (diff <= 0) return "00:00:00";

            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / 1000 / 60) % 60);
            const s = Math.floor((diff / 1000) % 60);
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        const timer = setInterval(() => { setTimeLeft(calculateTimeLeft()); }, 1000);
        setTimeLeft(calculateTimeLeft());
        return () => clearInterval(timer);
    }, []);

    // 2. Task Logic
    const trainingsDone = user.count_go_to_gym || 0;
    const trainingTarget = 3;
    const progressPercent = Math.min((trainingsDone / trainingTarget) * 100, 100);
    const isTaskClaimed = user.statistics?.some(s => s.stat_type === "CONDUCT_3_TRAINING");
    const isTaskReady = trainingsDone >= trainingTarget && !isTaskClaimed;

    // Handlers
    const handleBoxClick = async () => {
        if (!user.has_free_box) {
            showInfoModal({ text: `Next box in: ${timeLeft}`, image: Config.IMAGES.box_small });
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/users/${user.user_id}/daily-box/claim`, { method: 'POST' });
            if (res.ok) {
                const updatedUser = await res.json();
                onUserUpdate(updatedUser);
                showInfoModal({ text: "Daily Reward Claimed!", image: Config.IMAGES.box_small });
            }
        } catch (e) { console.error(e); }
    };

    const handleTaskClick = async () => {
        if (isTaskClaimed) return;
        if (!isTaskReady) {
            showAlert("Complete trainings in Training Center!");
            return;
        }
        setTaskClaiming(true);
        try {
            const res = await fetch(`${API_BASE_URL}/education/tasks/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.user_id, stat_type: "CONDUCT_3_TRAINING" })
            });
            if (res.ok) {
                const data = await res.json();
                showInfoModal({ text: data.message, image: Config.IMAGES.energy_medium });
                const userRes = await fetch(`${API_BASE_URL}/users/${user.user_id}`);
                if (userRes.ok) onUserUpdate(await userRes.json());
            }
        } catch (e) { console.error(e); } finally { setTaskClaiming(false); }
    };

    return (
        <div className={styles.wrapper}>

            {/* LEFT: DAILY BOX (PREMIUM GOLD STYLE) */}
            <div
                className={`${styles.card} ${styles.goldCard} ${user.has_free_box ? styles.cardReady : ''}`}
                onClick={handleBoxClick}
            >
                <div className={styles.cardHeader}>
                    <div className={styles.iconBoxGold}>
                        <FaGift className={styles.goldIcon} />
                    </div>
                    <span className={styles.cardTitleGold}>DAILY LOOT</span>
                </div>

                <div className={styles.cardBody}>
                    {user.has_free_box ? (
                        <div className={styles.claimBtn}>OPEN</div>
                    ) : (
                        <div className={styles.timerDisplay}>{timeLeft}</div>
                    )}
                </div>

                {/* Декор - болти */}
                <div className={`${styles.rivet} ${styles.tl}`}></div>
                <div className={`${styles.rivet} ${styles.tr}`}></div>
                <div className={`${styles.rivet} ${styles.bl}`}></div>
                <div className={`${styles.rivet} ${styles.br}`}></div>
            </div>

            {/* RIGHT: TASK (PREMIUM BLUE STYLE) */}
            <div
                className={`${styles.card} ${styles.blueCard}`}
                onClick={handleTaskClick}
                style={{ opacity: isTaskClaimed ? 0.8 : 1 }}
            >
                <div className={styles.cardHeader}>
                    <div className={styles.iconBoxBlue}>
                        <FaDumbbell className={styles.blueIcon} />
                    </div>
                    <span className={styles.cardTitleBlue}>GYM TASK</span>
                </div>

                {!isTaskClaimed ? (
                    <div className={styles.taskBody}>
                        <div className={styles.progressTrack}>
                            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <div className={styles.taskMeta}>
                            <span className={styles.taskStatus}>{trainingsDone}/{trainingTarget}</span>
                            <span className={styles.rewardTag}>+50⚡</span>
                        </div>
                    </div>
                ) : (
                    <div className={styles.doneState}>
                        <FaCheckCircle className={styles.checkIcon} />
                        <span>DONE</span>
                    </div>
                )}

                {/* Декор - болти */}
                <div className={`${styles.rivetBlue} ${styles.tl}`}></div>
                <div className={`${styles.rivetBlue} ${styles.tr}`}></div>
                <div className={`${styles.rivetBlue} ${styles.bl}`}></div>
                <div className={`${styles.rivetBlue} ${styles.br}`}></div>
            </div>

        </div>
    );
};

export default DailyGoalSection;