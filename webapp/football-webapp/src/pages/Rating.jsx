// RatingCard.jsx

import React, {useEffect, useState} from 'react'; // <-- Імпортуємо useState
import {Header} from "../components/Header.jsx";
import Config from "../config.js";
import {NavigationBar} from "../components/NavigationBar.jsx";
import styles from '../css_files/Main.module.css';
import Rating from '../components/rating/Rating.jsx';
import RatingInfo from "../components/rating/RatingInfo.jsx";
import {showAlert} from "../alertService.jsx";
import {API_BASE_URL} from "../api.js";

export default function RatingCard({user, setUser}) {
    // Стан для перемикання між екранами 'rating' та 'info'
    const [currentView, setCurrentView] = useState('rating');

    // Функції для зміни стану
    const showInfo = () => setCurrentView('info');
    const showRating = () => setCurrentView('rating');
    useEffect(() => {
        // Создаем асинхронную функцию внутри useEffect
        const updateUserStatus = async () => {
            // Проверяем, что у пользователя именно статус 'RATING'
            if (user?.status_register === 'RATING') {
                try {
                    console.log('Updating user status from RATING to END_REGISTER...');

                    // Отправляем PATCH-запрос на бэкенд для смены статуса
                    const response = await fetch(`${API_BASE_URL}/users/${user.user_id}/status`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        // В теле запроса передаем новый статус
                        body: JSON.stringify({ status: 'END_REGISTER' }),
                    });

                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }

                    // Получаем обновленные данные пользователя от сервера
                    const updatedUser = await response.json();

                    // Обновляем состояние пользователя в компоненте
                    setUser(updatedUser);

                    console.log('User status successfully updated!');

                } catch (error) {
                    console.error("Failed to update user status:", error);
                    showAlert("Не вдалося оновити ваш статус. Спробуйте перезавантажити сторінку.");
                }
            }
        };

        // Вызываем функцию
        updateUserStatus();

        // Хук будет срабатывать при изменении объекта user,
        // но внутреннее условие if не даст ему зациклиться.
    }, [user]);

    return (
        <div className={styles.page}>
            <div className={styles.mainContainer} data-modal-root>
                <Header user={user}/>

                {/* Background Image */}
                <img
                    src={Config.IMAGES.rating_background}
                    alt="background"
                    className={styles.backgroundImage}
                />

                {/* Головний контент:
                Рендеримо компонент в залежності від стану currentView.
                Передаємо відповідні функції як пропси.
            */}
                {currentView === 'rating' ? (
                    <Rating onShowInfo={showInfo}/>
                ) : (
                    <RatingInfo onBack={showRating}/>
                )}

                {/* Navigation Bar at the bottom */}
                <NavigationBar/>
            </div>
        </div>
    );
}