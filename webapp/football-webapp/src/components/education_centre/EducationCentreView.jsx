// EducationCentreView.jsx

import React from 'react';
import styles from '../../css_files/education_centre/EducationCentre.module.css';
import Config from "../../config.js";

// --- REUSABLE COMPONENTS (можна винести в окремі файли) ---

const ButtonReward = ({ rewards, onClick, daily = false }) => {
    const totalAmount = rewards.length === 1 ? rewards[0].amount : '🎁';
    const icon = rewards.length === 1 ? rewards[0].icon : null;
    return !daily ? (
        <button className={`${styles.getRewardButton} ${styles.glowingButton}`} onClick={onClick}>
            <div className={styles.rewardAmount}>
                <span>{totalAmount}</span>
                {icon && <img src={icon} alt="reward" />}
            </div>
            <span className={styles.getRewardButtonText}>ОТРИМАТИ</span>
        </button>
    ) : (
        <button className={`${styles.getRewardButton} ${styles.glowingButton}`} onClick={onClick}>
            <div className={styles.rewardAmount}>
                {/* Замість суми тепер іконка енергії */}
                <img src={Config.IMAGES.energy} alt="energy reward" />
                {/* Іконка монети залишається */}
                <img src={Config.IMAGES.coin} alt="coin reward" />
            </div>
            <span className={styles.getRewardButtonText}>ОТРИМАТИ</span>
        </button>
    );
};

const ButtonUnactiveReward = ({ time }) => (
    <div className={styles.inactiveRewardWrapper}>
        <div className={styles.inactiveRewardOverlay}></div>
        <div className={styles.inactiveRewardText}>{time}</div>
    </div>
);

const DailyReward = ({ dailyReward, onClaim }) => {
    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const dailyRewards = [{ type: 'coin', amount: 100, icon: Config.IMAGES.coin }]; // Можна теж передавати через пропси

    return (
        <div className={styles.dailyReward}>
            <img src={Config.IMAGES.calendar_icon} alt="Calendar" className={styles.dailyRewardIcon} />
            <span className={styles.dailyRewardTitle}>ЩОДЕННА НАГОРОДА</span>
            {dailyReward.isClaimable ? (
                <ButtonReward rewards={dailyRewards} onClick={onClaim} daily={true} />
            ) : (
                <ButtonUnactiveReward time={formatTime(dailyReward.timeLeft)} />
            )}
        </div>
    );
};

const TaskCard = ({ task, onClaim }) => {
    const { title, rewards, progress, status, statusText, backgroundImage } = task;
    const progressPercent = progress ? (progress.current / progress.total) * 100 : 0;
    const isClaimable = status === 'claimable';

    return (
        <div
            className={`${styles.taskCard} ${isClaimable ? styles.isClaimable : ''}`}
            style={{ backgroundImage: `url(${backgroundImage})` }}
        >
            <h3 className={styles.taskCardTitle}>{title}</h3>
            <div className={styles.taskCardDivider} />
            <div className={styles.taskCardBody}>
                {progress && status === 'in-progress' && (
                    <div
                        className={styles.taskProgress}
                        style={{ '--progress-percent': `${progressPercent}%` }}
                    >
                        <span>{progress.current}/{progress.total}</span>
                    </div>
                )}
                <div className={styles.taskRewards}>
                    {rewards.map((reward, index) => (
                        <div key={index} className={styles.taskReward}>
                            <span>+{reward.amount}</span>
                            <img src={reward.icon} alt={reward.type} />
                        </div>
                    ))}
                </div>
            </div>
            {isClaimable && (
                <div className={styles.claimButtonWrapper}>
                    <ButtonReward rewards={rewards} onClick={() => onClaim(task.id)} />
                </div>
            )}
            {statusText && status !== 'claimable' && <p className={styles.taskStatus}>{statusText}</p>}
        </div>
    );
};

// --- MAIN VIEW COMPONENT ---

const EducationCentreView = ({ dailyReward, tasks, onClaimDaily, onClaimTask }) => {
    console.log("d: ", dailyReward);
    return (
        <div className={`${styles.contentWrapper} ${styles.animate}`}>
            <h2 className={styles.pageTitle}>УЧБОВИЙ ЦЕНТР</h2>
            <DailyReward dailyReward={dailyReward} onClaim={onClaimDaily} />
            <h3 className={styles.sectionTitle}>ЗАВДАННЯ</h3>
            <div className={styles.tasksGrid}>
                {tasks.map((task, index) => (
                    <div key={task.id} style={{ animationDelay: `${index * 100}ms` }}>
                        <TaskCard task={task} onClaim={onClaimTask} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EducationCentreView;