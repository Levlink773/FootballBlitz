// EducationCentre.jsx

import React, { useState, useEffect, useCallback } from 'react';
import EducationCentreView from './EducationCentreView'; // Імпортуємо компонент для відображення
import Config from "../../config.js";

// Допоміжна мапа для збагачення даних з бекенду (іконки, фон),
// оскільки бекенд не повертає цю візуальну інформацію.
const TASK_METADATA = {
    CONDUCT_3_TRAINING: {
        id: 'CONDUCT_3_TRAINING',
        rewards: [{ type: 'energy', amount: 50, icon: Config.IMAGES.energy }],
        progressTotal: 3,
        backgroundImage: Config.IMAGES.task_banner
    },
    PLAY_BLITZ: {
        id: 'PLAY_BLITZ',
        rewards: [{ type: 'energy', amount: 20, icon: Config.IMAGES.energy }],
        progressTotal: 1,
        backgroundImage: Config.IMAGES.task_banner
    },
    RICH_SEMI_FINAL_BLITZ: {
        id: 'RICH_SEMI_FINAL_BLITZ',
        rewards: [{ type: 'energy', amount: 50, icon: Config.IMAGES.energy }],
        progressTotal: 1,
        backgroundImage: Config.IMAGES.task_banner
    }
};

// Трансформує дані з API у формат, зрозумілий для TaskCard
const transformApiTasks = (apiTasks) => {
    return apiTasks.map(task => {
        const metadata = TASK_METADATA[task.stat_type] || {};
        const statusMap = {
            'in_progress': 'in-progress',
            'done_and_ready': 'claimable',
            'done_and_claimed': 'claimed'
        };

        return {
            id: metadata.id || task.stat_type,
            title: task.description.split('—')[0].trim(), // "Проведи 3 тренування"
            rewards: metadata.rewards || [],
            progress: {
                current: task.progress_raw || 0,
                total: metadata.progressTotal || 1
            },
            status: statusMap[task.status] || 'in-progress',
            statusText: task.status === 'done_and_ready' ? (task.extra?.ready_text || "Готово до отримання!") : task.progress,
            backgroundImage: metadata.backgroundImage
        };
    }).filter(task => task.status !== 'claimed'); // Не показуємо вже отримані завдання
};


const EducationCentre = ({ userId }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [dailyReward, setDailyReward] = useState({ isClaimable: false, timeLeft: 0 });

    // Функція для завантаження всіх даних
    const fetchData = useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
            const [remainingRes, tasksRes] = await Promise.all([
                fetch(`http://localhost:8123/education/remaining/${userId}`), // Перевірте шлях до API
                fetch(`http://localhost:8123/education/tasks/${userId}`)      // Перевірте шлях до API
            ]);

            const remainingData = await remainingRes.json();
            const tasksData = await tasksRes.json();

            setDailyReward({
                isClaimable: remainingData.ready,
                timeLeft: remainingData.seconds_remaining
            });

            setTasks(transformApiTasks(tasksData.tasks));

        } catch (error) {
            console.error("Failed to fetch education centre data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // Первинне завантаження даних
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Таймер для щоденної нагороди
    useEffect(() => {
        if (dailyReward.isClaimable || dailyReward.timeLeft <= 0) return;

        const timer = setInterval(() => {
            setDailyReward(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
            if (dailyReward.timeLeft <= 1) {
                setDailyReward({ isClaimable: true, timeLeft: 0 });
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [dailyReward.isClaimable, dailyReward.timeLeft]);


    // Обробник для отримання щоденної нагороди
    const handleClaimDaily = async () => {
        try {
            const response = await fetch('http://localhost:8123/education/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId })
            });
            const data = await response.json();
            if (data.ok) {
                alert(`Нагорода отримана: ${data.message}`);
                fetchData(); // Оновлюємо дані після отримання
            } else {
                alert(`Помилка: ${data.message}`);
            }
        } catch (error) {
            console.error("Failed to claim daily reward:", error);
            alert("Сталася помилка мережі.");
        }
    };

    // Обробник для отримання нагороди за завдання
    const handleClaimTask = async (taskId) => {
        try {
            const response = await fetch('http://localhost:8123/education/tasks/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, stat_type: taskId })
            });
            const data = await response.json();
            if (data.ok) {
                alert(`Нагорода отримана: ${data.message}`);
                fetchData(); // Оновлюємо дані, щоб завдання зникло зі списку
            } else {
                alert(`Помилка: ${data.message}`);
            }
        } catch (error) {
            console.error("Failed to claim task reward:", error);
            alert("Сталася помилка мережі.");
        }
    };

    if (isLoading) {
        return <div>Завантаження учбового центру...</div>;
    }

    return (
        <EducationCentreView
            dailyReward={dailyReward}
            tasks={tasks}
            onClaimDaily={handleClaimDaily}
            onClaimTask={handleClaimTask}
        />
    );
};

export default EducationCentre;