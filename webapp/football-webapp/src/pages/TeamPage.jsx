// src/pages/TeamCard.jsx

import React, { useState } from 'react';
import { Header } from "../components/Header.jsx";
import { NavigationBar } from "../components/NavigationBar.jsx";
import Config from "../config.js";
import styles from '../css_files/Main.module.css';
import TeamHub from "../components/team/TeamHub.jsx"; // 👈 Импортируем наш компонент

export default function TeamCard({ user, setUser }) {
    // Управление отображением (Хаб команды, Тренировка, Смена тактики)
    const [currentView, setCurrentView] = useState('hub');

    // Функция для рендера контента в зависимости от стейта
    const renderContent = () => {
        switch (currentView) {
            case 'training':
                return (
                    <div style={{color: 'white', textAlign: 'center', marginTop: 50}}>
                        🚧 Тренировка (Скоро)
                        <button onClick={() => setCurrentView('hub')}>Назад</button>
                    </div>
                );
            case 'hub':
            default:
                // 👇 Передаем user, так как TeamHub делает запросы к API
                return <TeamHub user={user} onUserUpdate={setUser} />;
        }
    };

    return (
        <div className={styles.page}>
            {/* Размытый фон для краев (если экран широкий) */}
            <img
                className={styles.pageBackgroundBlur}
                src={Config.IMAGES.team_background || Config.IMAGES.background}
                alt=""
            />

            <div className={styles.mainContainer} data-modal-root>
                {/* Хедер с инфо о юзере */}
                <Header user={user} />

                {/* Основной фон страницы */}
                <img
                    src={Config.IMAGES.team_background || Config.IMAGES.background}
                    alt="background"
                    className={styles.backgroundImage}
                />

                {/* 🔥 ОСНОВНОЙ КОНТЕНТ (Поле + Статистика) */}
                <div style={{
                    position: 'relative',
                    zIndex: 2,
                    flex: 1,
                    width: '100%',
                    overflowY: 'auto', // Прокрутка контента
                    overflowX: 'hidden'
                }}>
                    {renderContent()}
                </div>

                {/* Нижняя навигация */}
                <NavigationBar />
            </div>
        </div>
    );
}