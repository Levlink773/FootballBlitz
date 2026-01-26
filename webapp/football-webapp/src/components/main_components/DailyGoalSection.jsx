import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../css_files/main_css/DailyGoalSection.module.css';
import Config from "../../config.js";
import { API_BASE_URL } from "../../api.js";
import { showInfoModal } from "../../alertService.jsx";
import { FaDumbbell, FaGift, FaTrophy, FaMedal, FaList } from "react-icons/fa";
import { LootBoxOpeningModal } from "../modal_components/LootBoxOpeningModalDaily.jsx";
import { TasksListModal } from "./TasksListModal.jsx";

const DailyGoalSection = ({ user, onUserUpdate }) => {
    // Timer State
    const [timeLeft, setTimeLeft] = useState("");

    // Tasks State
    const [tasks, setTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [activeTask, setActiveTask] = useState(null);

    // Modals State
    const [isDailyBoxOpening, setIsDailyBoxOpening] = useState(false);
    const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);

    // --- 1. Fetch Tasks Logic (БЕЗ ЗМІН) ---
    const fetchTasks = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/education/tasks/${user.user_id}`);
            if (res.ok) {
                const data = await res.json();
                setTasks(data.tasks);

                let primeTask = data.tasks.find(t => t.status === 'done_and_ready');
                if (!primeTask) {
                    primeTask = data.tasks.find(t => t.status === 'in_progress');
                }
                if (!primeTask && data.tasks.length > 0) {
                    primeTask = data.tasks[0];
                }

                setActiveTask(primeTask);
            }
        } catch (e) {
            console.error("Failed to fetch tasks", e);
        } finally {
            setLoadingTasks(false);
        }
    }, [user.user_id]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // --- 2. Timer Logic (БЕЗ ЗМІН) ---
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

    // --- 3. Handlers (БЕЗ ЗМІН) ---
    const handleBoxClick = useCallback(() => {
        if (!user.has_free_box) {
            showInfoModal({ text: `Next box in: ${timeLeft}`, image: Config.IMAGES.box_mini });
            return;
        }
        setIsDailyBoxOpening(true);
    }, [user.has_free_box, timeLeft]);

    const handleBoxClosed = useCallback((updatedUser) => {
        setIsDailyBoxOpening(false);
        if (updatedUser) onUserUpdate(updatedUser);
    }, [onUserUpdate]);

    const handleTaskCardClick = (e) => {
        setIsTasksModalOpen(true);
    };

    // --- 4. Render Helpers ---
    // Ми залишаємо іконки в заголовках золотими, як індикатори категорії
    const getTaskIcon = (type) => {
        if (!type) return <FaDumbbell className={styles.goldIcon} />;
        if (type.includes('TRAINING')) return <FaDumbbell className={styles.goldIcon} />;
        if (type.includes('BLITZ')) return <FaTrophy className={styles.goldIcon} />;
        if (type.includes('RICH_SEMI_FINAL_BLITZ')) return <FaMedal className={styles.goldIcon} />;
        return <FaDumbbell className={styles.goldIcon} />;
    };

    const getTaskTitle = (type) => {
        if (!type) return "TASK";
        if (type === 'CONDUCT_3_TRAINING') return "GYM TASK";
        if (type === 'PLAY_BLITZ') return "BLITZ";
        if (type === 'RICH_SEMI_FINAL_BLITZ') return "TOURNAMENT";
        return "TASK";
    };

    // Helper для вибору 3D картинки правої картки
    // Helper для вибору 3D картинки правої картки
    const get3DTaskImage = (task) => {
        // Дефолтная 3D Гантеля (Stable URL)
        const defaultImage = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Trophy.png";

        if (!task) return defaultImage;

        const type = task.stat_type;

        return defaultImage;
    };


    const renderActiveTaskContent = () => {
        if (!activeTask) return <div className={styles.taskStatusGold}>Loading...</div>;

        const isClaimed = activeTask.status === 'done_and_claimed';
        const isReady = activeTask.status === 'done_and_ready';

        if (isClaimed) {
            return (
                <div className={styles.doneStateDark}>
                    <FaCheckCircle className={styles.checkIconDark} />
                    <span>DONE</span>
                </div>
            );
        }

        if (isReady) {
            return (
                <div className={styles.doneStateReadyBtn}>
                    <FaGift className={styles.giftIconReady} />
                    <span className={styles.readyTextGlitch}>CLAIM!</span>
                </div>
            );
        }

        // In Progress logic
        let current = 0;
        let target = 1;

        if (activeTask.stat_type === 'CONDUCT_3_TRAINING') {
            target = 3;
            current = Array.isArray(activeTask.progress_raw) ? activeTask.progress_raw[1] : (activeTask.progress_raw || 0);
        } else {
            current = Array.isArray(activeTask.progress_raw) ? activeTask.progress_raw[1] : (activeTask.progress_raw || 0);
            if(current > 0) current = 1;
        }

        const percent = Math.min((current / target) * 100, 100);

        return (
            <div className={styles.taskBody}>
                <div className={styles.progressTrackGold}>
                    <div className={styles.progressFillGold} style={{ width: `${percent}%` }}></div>
                </div>
                <div className={styles.taskMeta}>
                    <span className={styles.taskStatusDark}>{current}/{target}</span>
                    <span className={styles.rewardTagDark}>REWARD</span>
                </div>
            </div>
        );
    };

    const isTaskReadyToClaim = activeTask?.status === 'done_and_ready';

    return (
        <div className={styles.wrapper}>

            {/* LEFT: DAILY BOX */}
            <div
                className={`${styles.card} ${styles.goldCard} ${user.has_free_box ? styles.cardReady : ''}`}
                onClick={handleBoxClick}
            >
                {/* Мы УБРАЛИ img отсюда, чтобы он не летал отдельно */}

                <div className={styles.cardHeader}>
                    <div className={styles.iconBoxGold}>
                        <FaGift className={styles.goldIcon} />
                    </div>
                    <span className={styles.cardTitleGold}>DAILY LOOT</span>
                </div>
                <div className={styles.cardBody}>
                    {user.has_free_box ? (
                        // 🔥 ТЕПЕРЬ ПОДАРОК ВНУТРИ КНОПКИ 🔥
                        <div className={styles.claimBtn}>
                            OPEN
                            <img
                                // Используем стабильную ссылку (Jaywcjlove)
                                src="https://em-content.zobj.net/source/microsoft-teams/337/wrapped-gift_1f381.png"
                                alt="3D Gift"
                                // Применяем НОВЫЙ специальный класс для кнопки
                                className={styles.giftInBtn}
                            />
                        </div>
                    ) : (
                        <div className={styles.timerDisplay}>{timeLeft}</div>
                    )}
                </div>
                {/* Rivets */}
                <div className={`${styles.rivet} ${styles.tl}`}></div>
                <div className={`${styles.rivet} ${styles.tr}`}></div>
                <div className={`${styles.rivet} ${styles.bl}`}></div>
                <div className={`${styles.rivet} ${styles.br}`}></div>
            </div>

            {/* RIGHT: DYNAMIC TASK CARD */}
            <div
                className={`${styles.card} ${styles.superGoldCard} ${isTaskReadyToClaim ? styles.superTaskReady : ''}`}
                onClick={handleTaskCardClick}
            >
                {/* 🔥 НОВЕ: Сокова 3D Гантеля/Кубок */}

                <div
                    className={styles.expandBtnGold}
                    onClick={(e) => { e.stopPropagation(); setIsTasksModalOpen(true); }}
                >
                    <FaList />
                </div>

                <div className={styles.cardHeader}>
                    <div className={styles.iconBoxGold}>
                        {activeTask ? getTaskIcon(activeTask.stat_type) : <FaDumbbell className={styles.goldIcon} />}
                    </div>
                    <span className={styles.cardTitleGold}>
                        {activeTask ? getTaskTitle(activeTask.stat_type) : "TASKS"}
                    </span>
                </div>

                {renderActiveTaskContent()}

                <div className={`${styles.rivet} ${styles.tl}`}></div>
                <div className={`${styles.rivet} ${styles.tr}`}></div>
                <div className={`${styles.rivet} ${styles.bl}`}></div>
                <div className={`${styles.rivet} ${styles.br}`}></div>
            </div>

            {/* --- MODALS --- */}
            {isDailyBoxOpening && (
                <LootBoxOpeningModal
                    userId={user.user_id}
                    boxType="SMALL_BOX"
                    isDaily={true}
                    onClose={handleBoxClosed}
                />
            )}

            {isTasksModalOpen && (
                <TasksListModal
                    tasks={tasks}
                    user={user}
                    onClose={() => setIsTasksModalOpen(false)}
                    onUserUpdate={onUserUpdate}
                    onRefreshTasks={fetchTasks}
                />
            )}

        </div>
    );
};

export default DailyGoalSection;