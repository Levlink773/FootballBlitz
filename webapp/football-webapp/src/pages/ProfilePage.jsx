import React from 'react';
import { Header } from "../components/Header.jsx";
import { NavigationBar } from "../components/NavigationBar.jsx";
import Config from "../config.js";
import styles from '../css_files/Main.module.css'; // Общие стили страницы
import profileStyles from '../css_files/profile/Profile.module.css'; // Стили конкретно для профиля

const ProfilePage = ({ user, setUser }) => {

    return (
        <div className={styles.page}>
            {/* Размытый фон на весь экран */}
            <img
                className={styles.pageBackgroundBlur}
                src={Config.IMAGES.rating_background}
                alt="blur-bg"
            />

            <div className={styles.mainContainer}>
                {/* 1. HEADER */}
                <Header user={user} />

                {/* Фоновая картинка внутри контейнера */}
                <img
                    src={Config.IMAGES.rating_background}
                    alt="background"
                    className={styles.backgroundImage}
                />

                {/* 2. ОСНОВА (PROFILE CONTENT) */}
                {/* Сюда мы будем добавлять блоки: Аватар, Статистику, Лутбоксы */}
                <div className={profileStyles.profileContainer}>

                    <h2 className={profileStyles.tempTitle}>Профіль Гравця</h2>

                    {/* Тут пока пусто, это место для будущих компонентов */}

                </div>

                {/* 3. NAVIGATION BAR */}
                <NavigationBar />
            </div>
        </div>
    );
};

export default ProfilePage;