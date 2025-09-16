import React from 'react';
import styles from '../css_files/Header.module.css';
import Config from "../config.js";

// --- Кастомная иконка Уведомлений (SVG) ---
const NotificationIcon = ({ hasNotification }) => (
    <svg
        className={styles.notificationIcon}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            className={styles.notificationBell}
            d="M12 22C13.1046 22 14 21.1046 14 20H10C10 21.1046 10.8954 22 12 22ZM18 16V11C18 7.68629 15.3137 5 12 5C8.68629 5 6 7.68629 6 11V16L4 18H20L18 16Z"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        {hasNotification && <circle className={styles.notificationDot} cx="18" cy="6" r="4" />}
    </svg>
);

// --- Золотая кнопка магазина ---
const ShopButton = () => (
    <button className={styles.shopButton} aria-label="Shop">
        {/* Фоновый SVG */}
        <svg className={styles.shopButtonSvg} viewBox="0 0 100 38" preserveAspectRatio="none">
            <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFECB3" />
                    <stop offset="25%" stopColor="#FFD700" />
                    <stop offset="50%" stopColor="#DAA520" />
                    <stop offset="75%" stopColor="#FFD700" />
                    <stop offset="100%" stopColor="#FFECB3" />
                </linearGradient>
                <radialGradient id="goldShine" cx="50%" cy="0%" r="100%" fx="50%" fy="0%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </radialGradient>
            </defs>
            <rect x="0" y="0" width="100" height="38" rx="12" ry="12" fill="url(#goldGradient)" />
            <rect x="0" y="0" width="100" height="38" rx="12" ry="12" fill="url(#goldShine)" className={styles.shineEffect} />
        </svg>

        {/* Иконка магазина */}
        <img
            src={Config.IMAGES.shop_icon}
            alt="Shop Icon"
            className={styles.shopIconActual}
        />
    </button>
);

// --- Компонент валюты (без кнопки "+") ---
const CurrencyGroup = ({ icon, alt, amount }) => (
    <div className={styles.currencyGroup}>
        <img className={styles.currencyIcon} src={icon} alt={alt} aria-label={alt} />
        {/* Отображаем количество или "0", если данные еще не пришли */}
        <span className={styles.currencyAmount}>{amount ?? 0}</span>
    </div>
);

// --- Основной компонент хедера ---
export const Header = ({ user }) => {

    // Данные для валют теперь формируются напрямую из пропса 'user'
    const currencyData = [
        { icon: Config.IMAGES.coin, alt: 'Coins', amount: user?.money },
        { icon: Config.IMAGES.energy, alt: 'Energy', amount: user?.energy },
    ];

    // Определяем URL аватара: используем user.avatar если есть, иначе — дефолтный
    const avatarUrl = user?.avatar_url || Config.IMAGES.avatar;

    return (
        <header className={styles.headerContainer}>
            {/* Левый блок */}
            <div className={styles.leftSection}>
                <button className={styles.iconButton} aria-label="Notifications">
                    {/* В будущем можно будет подставлять значение из user.has_new_notifications */}
                    <NotificationIcon hasNotification={false} />
                </button>
                <div className={styles.avatarContainer}>
                    <img className={styles.avatar} src={avatarUrl} alt="User avatar" />
                    <span className={styles.avatarGlow}></span>
                </div>
            </div>

            {/* Средний блок */}
            <div className={styles.middleSection}>
                {currencyData.map((currency) => <CurrencyGroup key={currency.alt} {...currency} />)}
            </div>

            {/* Правый блок */}
            <div className={styles.rightSection}>
                <ShopButton />
            </div>
        </header>
    );
};