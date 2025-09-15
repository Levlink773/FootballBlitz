import React from 'react';
import styles from '../../css_files/education_centre/EducationCentre.module.css';
import Config from "../../config.js";

const tasksData = [
        {
                id: 1,
                title: "Проведи 3 тренування",
                rewards: [{ type: 'coin', amount: 50, icon: Config.IMAGES.coin }], // Пример пути к иконке
                progress: "2/3",
                status: null,
                backgroundImage: Config.IMAGES.task_banner // Пример пути к фону
        },
        {
                id: 2,
                title: "Зіграй турнір",
                rewards: [{ type: 'coin', amount: 20, icon: Config.IMAGES.coin }],
                progress: null,
                status: "Вже зіграно 0 турнірів",
                backgroundImage: Config.IMAGES.task_banner
        },
        {
                id: 3,
                title: "Дійди до півфіналу",
                rewards: [
                        { type: 'star', amount: 50, icon: Config.IMAGES.energy },
                        { type: 'coin', amount: 50, icon: Config.IMAGES.coin }
                ],
                progress: null,
                status: "Вже досягли 0 разів",
                backgroundImage: Config.IMAGES.task_banner
        }
];
const ButtonReward = () => {
        return (
            <button className={styles.getRewardButton}>
                    <div className={styles.rewardAmount}>
                            <span>100</span>
                            <img src={Config.IMAGES.coin} alt="coin" />
                    </div>
                    <span className={styles.getRewardButtonText}>ОТРИМАТИ</span>
            </button>
        )
}
const ButtonUnactiveReward = ({ time }) => {
        return (
            <div className={styles.inactiveRewardWrapper}>
                    <div className={styles.inactiveRewardOverlay}></div>
                    <div className={styles.inactiveRewardText}>
                            {time}
                    </div>
            </div>
        );
};

// --- ПЕРЕИСПОЛЬЗУЕМЫЕ КОМПОНЕНТЫ ---

// Компонент для блока "Ежедневная награда"
const DailyReward = () => (
    <div className={styles.dailyReward}>
            <img src={Config.IMAGES.calendar_icon} alt="Calendar" className={styles.dailyRewardIcon} />
            <span className={styles.dailyRewardTitle}>ЩОДЕННА НАГОРОДА</span>
            <ButtonUnactiveReward time="12:09:09" />
    </div>
);

// Универсальный компонент для карточки задания
const TaskCard = ({ title, rewards, progress, status, backgroundImage }) => (
    <div className={styles.taskCard} style={{ backgroundImage: `url(${backgroundImage})` }}>
            <h3 className={styles.taskCardTitle}>{title}</h3>
            <div className={styles.taskCardDivider} />
            <div className={styles.taskCardBody}>
                    {progress && (
                        <div className={styles.taskProgress}>
                                {progress}
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
            {status && <p className={styles.taskStatus}>{status}</p>}
    </div>
);
const EducationCentre = () => (
    <div className={styles.contentWrapper}>
            <h2 className={styles.pageTitle}>УЧБОВИЙ ЦЕНТР</h2>

            <DailyReward />

            <h3 className={styles.sectionTitle}>ЗАВДАННЯ</h3>

            <div className={styles.tasksGrid}>
                    {tasksData.map(task => (
                        <TaskCard
                            key={task.id}
                            title={task.title}
                            rewards={task.rewards}
                            progress={task.progress}
                            status={task.status}
                            backgroundImage={task.backgroundImage}
                        />
                    ))}
            </div>
    </div>
);
export default EducationCentre;