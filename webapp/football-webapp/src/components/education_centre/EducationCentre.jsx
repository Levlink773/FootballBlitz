import React, { useState, useEffect } from 'react';
import styles from '../../css_files/education_centre/EducationCentre.module.css';
import Config from "../../config.js";

// --- DUMMY DATA WITH NEW PROPERTIES ---
// Added 'status' ('in-progress', 'claimable')
// Changed 'progress' to an object for easier calculations
const initialTasksData = [
    {
        id: 1,
        title: "Проведи 3 тренування",
        rewards: [{ type: 'coin', amount: 50, icon: Config.IMAGES.coin }],
        progress: { current: 2, total: 3 },
        status: 'in-progress', // Can be 'in-progress', 'claimable'
        backgroundImage: Config.IMAGES.task_banner
    },
    {
        id: 2,
        title: "Зіграй турнір",
        rewards: [{ type: 'coin', amount: 20, icon: Config.IMAGES.coin }],
        progress: { current: 1, total: 1 },
        status: 'claimable', // This task is ready to be claimed
        statusText: "Турнір зіграно!",
        backgroundImage: Config.IMAGES.task_banner
    },
    {
        id: 3,
        title: "Дійди до півфіналу",
        rewards: [
            { type: 'star', amount: 50, icon: Config.IMAGES.energy },
            { type: 'coin', amount: 50, icon: Config.IMAGES.coin }
        ],
        progress: { current: 0, total: 1 },
        status: 'in-progress',
        statusText: "Вже досягли 0 разів",
        backgroundImage: Config.IMAGES.task_banner
    }
];

// --- REUSABLE BUTTON COMPONENTS ---

const ButtonReward = ({ rewards, onClick }) => {
    // Calculate total reward for display if there's only one type
    const totalAmount = rewards.length === 1 ? rewards[0].amount : '🎁';
    const icon = rewards.length === 1 ? rewards[0].icon : null;

    return (
        <button className={`${styles.getRewardButton} ${styles.glowingButton}`} onClick={onClick}>
            <div className={styles.rewardAmount}>
                <span>{totalAmount}</span>
                {icon && <img src={icon} alt="reward" />}
            </div>
            <span className={styles.getRewardButtonText}>ОТРИМАТI</span>
        </button>
    );
};

const ButtonUnactiveReward = ({ time }) => (
    <div className={styles.inactiveRewardWrapper}>
        <div className={styles.inactiveRewardOverlay}></div>
        <div className={styles.inactiveRewardText}>
            {time}
        </div>
    </div>
);


// --- REUSABLE UI COMPONENTS ---

const DailyReward = () => {
    const [timeLeft, setTimeLeft] = useState(12 * 3600 + 9 * 60 + 9); // 12:09:09 in seconds
    const [isClaimable, setIsClaimable] = useState(false);

    useEffect(() => {
        if (isClaimable) return;

        const timer = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timer);
                    setIsClaimable(true);
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isClaimable]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    // Dummy rewards for the daily bonus
    const dailyRewards = [{ type: 'coin', amount: 100, icon: Config.IMAGES.coin }];

    return (
        <div className={styles.dailyReward}>
            <img src={Config.IMAGES.calendar_icon} alt="Calendar" className={styles.dailyRewardIcon} />
            <span className={styles.dailyRewardTitle}>ЩОДЕННА НАГОРОДА</span>
            {isClaimable ? (
                <ButtonReward rewards={dailyRewards} onClick={() => setIsClaimable(false)} />
            ) : (
                <ButtonUnactiveReward time={formatTime(timeLeft)} />
            )}
        </div>
    );
};

const TaskCard = ({ task, onClaim }) => {
    const { title, rewards, progress, status, statusText, backgroundImage } = task;
    const progressPercent = progress ? (progress.current / progress.total) * 100 : 0;
    const isClaimable = status === 'claimable'; // Создаем переменную для удобства

    return (
        // 👇 ВОТ ИЗМЕНЕНИЕ: Добавляем класс isClaimable, если задание можно забрать
        <div
            className={`${styles.taskCard} ${isClaimable ? styles.isClaimable : ''}`}
            style={{ backgroundImage: `url(${backgroundImage})` }}
        >
            <h3 className={styles.taskCardTitle}>{title}</h3>
            <div className={styles.taskCardDivider} />
            <div className={styles.taskCardBody}>
                {progress && !isClaimable && (
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

            {statusText && !isClaimable && <p className={styles.taskStatus}>{statusText}</p>}
        </div>
    );
};


// --- MAIN COMPONENT ---

const EducationCentre = () => {
    const [tasks, setTasks] = useState(initialTasksData);

    const handleClaimReward = (taskId) => {
        console.log(`Claiming reward for task ${taskId}`);
        // Here you would typically make an API call.
        // For this demo, we'll just remove the task from the list.
        setTasks(currentTasks => currentTasks.filter(task => task.id !== taskId));
    };

    return (
        // Added 'animate' class to trigger entry animations
        <div className={`${styles.contentWrapper} ${styles.animate}`}>
            <h2 className={styles.pageTitle}>УЧБОВИЙ ЦЕНТР</h2>

            <DailyReward />

            <h3 className={styles.sectionTitle}>ЗАВДАННЯ</h3>

            <div className={styles.tasksGrid}>
                {tasks.map((task, index) => (
                    <div key={task.id} style={{ animationDelay: `${index * 100}ms` }}>
                        <TaskCard
                            task={task}
                            onClaim={handleClaimReward}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EducationCentre;