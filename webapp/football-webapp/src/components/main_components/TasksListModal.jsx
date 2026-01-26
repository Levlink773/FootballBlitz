import React from 'react';
import ReactDOM from 'react-dom';
import styles from '../../css_files/main_css/DailyGoalSection.module.css'; // Використовуємо ті ж стилі
import { FaTimes, FaDumbbell, FaTrophy, FaMedal, FaCheck } from "react-icons/fa";
import { API_BASE_URL } from "../../api.js";
import { showInfoModal } from "../../alertService.jsx";
import Config from "../../config.js";

// Мапінг іконок для різних типів завдань
const getIconForType = (type) => {
    switch (type) {
        case 'CONDUCT_3_TRAINING': return <FaDumbbell />;
        case 'PLAY_BLITZ': return <FaTrophy />;
        case 'RICH_SEMI_FINAL_BLITZ': return <FaMedal />;
        default: return <FaCheck />;
    }
};

export const TasksListModal = ({ tasks, onClose, user, onUserUpdate, onRefreshTasks }) => {

    const handleClaim = async (task) => {
        try {
            const res = await fetch(`${API_BASE_URL}/education/tasks/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.user_id, stat_type: task.stat_type })
            });

            if (res.ok) {
                const data = await res.json();

                // 1. Показати повідомлення
                showInfoModal({ text: data.message, image: Config.IMAGES.energy_medium });

                // 2. Оновити юзера (гроші/енергія)
                const userRes = await fetch(`${API_BASE_URL}/users/${user.user_id}`);
                if (userRes.ok) onUserUpdate(await userRes.json());

                // 3. Оновити список завдань у батьківському компоненті
                onRefreshTasks();
            }
        } catch (e) {
            console.error(e);
        }
    };

    return ReactDOM.createPortal(
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button className={styles.closeModalBtn} onClick={onClose}><FaTimes /></button>
                <div className={styles.modalTitle}>Daily Tasks</div>

                {tasks.map((task, index) => {
                    const isReady = task.status === 'done_and_ready';
                    const isClaimed = task.status === 'done_and_claimed';
                    const isInProgress = task.status === 'in_progress';

                    // Обробка прогресу для різних типів
                    let progressPercent = 0;
                    let progressText = "";

                    if (task.stat_type === 'CONDUCT_3_TRAINING') {
                        // progress_raw приходить як [bool, count] або просто count, залежить від вашого беку.
                        // Припустимо, що TasksResponse повертає raw значення
                        const current = Array.isArray(task.progress_raw) ? task.progress_raw[1] : (task.progress_raw || 0);
                        const target = 3;
                        progressPercent = Math.min((current / target) * 100, 100);
                        progressText = `${current}/${target}`;
                    } else if (task.stat_type.includes('BLITZ')) {
                        const current = Array.isArray(task.progress_raw) ? task.progress_raw[1] : (task.progress_raw || 0);
                        const target = 1;
                        progressPercent = current >= 1 ? 100 : 0;
                        progressText = current >= 1 ? "1/1" : "0/1";
                    }

                    if (isReady || isClaimed) progressPercent = 100;

                    return (
                        <div key={index} className={`${styles.taskItem} ${isReady ? styles.doneReady : ''}`}>
                            <div className={styles.taskHeader}>
                                <div className={styles.taskIcon}>{getIconForType(task.stat_type)}</div>
                                <div className={styles.taskDesc}>{task.description}</div>
                            </div>

                            {/* Progress Bar */}
                            {!isClaimed && (
                                <div style={{marginTop: '5px'}}>
                                    <div className={styles.progressTrack}>
                                        <div className={styles.progressFill} style={{ width: `${progressPercent}%` }}></div>
                                    </div>
                                    <div className={styles.taskMeta}>
                                        <span className={styles.taskStatus}>{progressText}</span>
                                    </div>
                                </div>
                            )}

                            {/* Buttons/Status */}
                            {isReady && (
                                <button className={styles.claimTaskBtn} onClick={() => handleClaim(task)}>
                                    CLAIM REWARD
                                </button>
                            )}
                            {isClaimed && (
                                <div className={styles.claimedBadge}>Done & Claimed</div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>,
        document.body
    );
};