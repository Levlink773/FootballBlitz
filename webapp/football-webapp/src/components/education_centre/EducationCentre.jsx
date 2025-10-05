import React, { useState, useEffect, useCallback } from 'react';
import EducationCentreView from './EducationCentreView';
import Config from "../../config.js";
import { showAlert } from "../../alertService.jsx";
import { API_BASE_URL } from "../../api.js";
import { Steps } from 'intro.js-react'; // Импортируем компонент для шагов
import 'intro.js/introjs.css'; // Импортируем стили

// ... (TASK_METADATA и transformApiTasks остаются без изменений)
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
            title: task.description.split('—')[0].trim(),
            rewards: metadata.rewards || [],
            progress: {
                current: task.progress_raw || 0,
                total: metadata.progressTotal || 1
            },
            status: statusMap[task.status] || 'in-progress',
            statusText: task.status === 'done_and_ready' ? (task.extra?.ready_text || "Готово до отримання!") : task.progress,
            backgroundImage: metadata.backgroundImage
        };
    }).filter(task => task.status !== 'claimed');
};


const EducationCentre = ({ user, onUserUpdate }) => { // Принимаем всего пользователя
    const [isLoading, setIsLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [dailyReward, setDailyReward] = useState({ isClaimable: false, timeLeft: 0 });

    // Состояние для управления подсветкой
    const [isTutorialEnabled, setTutorialEnabled] = useState(false);

    // Шаги для подсветки
    const tutorialSteps = [
        {
            element: '[data-tutorial="daily-reward"]', // Селектор для кнопки ежедневной награды
            intro: 'Вітаємо в Учбовому Центрі! Отримайте свою першу щоденну нагороду, щоб продовжити.',
            position: 'bottom',
        },
    ];

    const fetchUser = async () => {
        if (!user?.user_id) return;
        try {
            const res = await fetch(`${API_BASE_URL}/users/${user.user_id}`);
            if (!res.ok) return;
            const userData = await res.json();
            if (onUserUpdate) onUserUpdate(userData);
        } catch (e) {
            console.error("fetchUser error", e);
        }
    };

    const fetchData = useCallback(async () => {
        if (!user?.user_id) return;
        setIsLoading(true);
        try {
            const [remainingRes, tasksRes] = await Promise.all([
                fetch(`${API_BASE_URL}/education/remaining/${user.user_id}`),
                fetch(`${API_BASE_URL}/education/tasks/${user.user_id}`)
            ]);

            const remainingData = await remainingRes.json();
            const tasksData = await tasksRes.json();
            setDailyReward({
                isClaimable: remainingData.ready,
                timeLeft: remainingData.seconds_remaining
            });

            setTasks(transformApiTasks(tasksData.tasks));
            const i = user?.status_register === "EDUCATION_CENTER";
            console.log("i : ", i);
            // Проверяем статус пользователя и готовность награды для запуска подсветки
            if (i && remainingData.ready) {
                console.log("remainingData: ", remainingData.ready);
                setTutorialEnabled(true);
            }

        } catch (error) {
            console.error("Failed to fetch education centre data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        // Условие выхода из эффекта остается тем же
        if (dailyReward.isClaimable || dailyReward.timeLeft <= 0) return;

        const timer = setInterval(() => {
            // Используем функциональное обновление для всей логики
            setDailyReward(prev => {
                // Сначала проверяем, не пора ли остановить таймер
                if (prev.timeLeft <= 1) {
                    clearInterval(timer); // Останавливаем интервал

                    // Если нужно, включаем подсказку
                    if (user?.status_register === "EDUCATION_CENTER") {
                        setTutorialEnabled(true);
                    }

                    // Возвращаем финальное состояние
                    return { isClaimable: true, timeLeft: 0 };
                }

                // Если время еще есть, просто уменьшаем его на 1
                return { ...prev, timeLeft: prev.timeLeft - 1 };
            });
        }, 1000);

        // Функция очистки для остановки таймера при размонтировании компонента
        return () => clearInterval(timer);

    }, [dailyReward.isClaimable, dailyReward.timeLeft, user?.status_register]);


    // Функция для смены статуса пользователя
    const updateUserStatus = async (newStatus) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/${user.user_id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) {
                throw new Error('Failed to update user status');
            }
            // Обновляем пользователя на фронтенде после успешного ответа
            await fetchUser();
        } catch (error) {
            console.error(error.message);
            showAlert("Не вдалося оновити статус користувача.");
        }
    };

    const handleClaimDaily = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/education/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.user_id })
            });
            const data = await response.json();
            if (data.ok) {
                showAlert(`Нагорода отримана: ${data.message}`);

                // Если это была обучающая награда, меняем статус
                if (user?.status_register === "EDUCATION_CENTER") {
                    await updateUserStatus('FIRST_BLITZ');
                } else {
                    await fetchUser(); // В обычном случае просто обновляем данные
                }

                await fetchData(); // Обновляем данные центра
            } else {
                showAlert(`Помилка: ${data.message}`);
            }
        } catch (error) {
            console.error("Failed to claim daily reward:", error);
            showAlert("Сталася помилка мережі.");
        }
    };

    const handleClaimTask = async (taskId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/education/tasks/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.user_id, stat_type: taskId })
            });
            const data = await response.json();
            if (data.ok) {
                showAlert(`Нагорода отримана: ${data.message}`);
                await fetchData();
                await fetchUser();
            } else {
                showAlert(`Помилка: ${data.message}`);
            }
        } catch (error) {
            console.error("Failed to claim task reward:", error);
            showAlert("Сталася помилка мережі.");
        }
    };

    if (isLoading) {
        return <div>Завантаження учбового центру...</div>;
    }
    console.log("Is rutor: ", isTutorialEnabled)

    return (
        <>
            {/* Компонент Steps для управления подсветкой */}
            <Steps
                enabled={isTutorialEnabled}
                steps={tutorialSteps}
                initialStep={0}
                onExit={() => setTutorialEnabled(false)}
                options={{
                    doneLabel: 'Зрозуміло',
                    nextLabel: 'Далі',
                    prevLabel: 'Назад',
                    hidePrev: true,
                    skipLabel: 'Пропустити',
                    showBullets: false,
                }}
            />

            <EducationCentreView
                dailyReward={dailyReward}
                tasks={tasks}
                onClaimDaily={handleClaimDaily}
                onClaimTask={handleClaimTask}
            />
        </>
    );
};

export default EducationCentre;