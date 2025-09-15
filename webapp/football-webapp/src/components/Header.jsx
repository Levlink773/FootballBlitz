import React, { useState } from 'react';
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

// --- ИСПРАВЛЕННАЯ ЗОЛОТАЯ КНОПКА МАГАЗИНА ---
const ShopButton = () => (
    <button className={styles.shopButton} aria-label="Shop">
        {/* Фоновый SVG */}
        <svg className={styles.shopButtonSvg} viewBox="0 0 100 38" preserveAspectRatio="none">
            <defs>
                {/* Золотой градиент */}
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFECB3" />
                    <stop offset="25%" stopColor="#FFD700" />
                    <stop offset="50%" stopColor="#DAA520" />
                    <stop offset="75%" stopColor="#FFD700" />
                    <stop offset="100%" stopColor="#FFECB3" />
                </linearGradient>
                {/* Блик для золотого эффекта */}
                <radialGradient id="goldShine" cx="50%" cy="0%" r="100%" fx="50%" fy="0%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </radialGradient>
            </defs>
            {/* Фон кнопки */}
            <rect x="0" y="0" width="100" height="38" rx="12" ry="12" fill="url(#goldGradient)" />
            {/* Блик на кнопке */}
            <rect x="0" y="0" width="100" height="38" rx="12" ry="12" fill="url(#goldShine)" className={styles.shineEffect} />
        </svg>

        {/* Иконка магазина (корзина/тележка) - ОНА ОСТАЕТСЯ */}
        <img
            src={Config.IMAGES.shop_icon}
            alt="Shop Icon"
            className={styles.shopIconActual}
        />
    </button>
);

// Компонент валюты остался без изменений
const CurrencyGroup = ({ icon, alt, amount, onAdd }) => (
    <div className={styles.currencyGroup}>
        <img className={styles.currencyIcon} src={icon} alt={alt} aria-label={alt} />
        <span className={styles.currencyAmount}>{amount}</span>
        <button
            className={styles.addButton}
            onClick={onAdd}
            aria-label={`Add ${alt}`}
        >
            +
        </button>
    </div>
);

// Основной компонент хедера
export const Header = ({ user }) => {
    const [currencies, setCurrencies] = useState(user?.currencies || { coins: 1250, energy: 85 });

    const handleAddCoins = () => setCurrencies(prev => ({ ...prev, coins: prev.coins + 100 }));
    const handleAddEnergy = () => setCurrencies(prev => ({ ...prev, energy: prev.energy + 10 }));

    const currencyData = [
        { icon: Config.IMAGES.coin, alt: 'Coins', amount: currencies.coins, onAdd: handleAddCoins },
        { icon: Config.IMAGES.energy, alt: 'Energy', amount: currencies.energy, onAdd: handleAddEnergy },
    ];

    return (
        <header className={styles.headerContainer}>
            {/* Левый блок */}
            <div className={styles.leftSection}>
                <button className={styles.iconButton} aria-label="Notifications">
                    <NotificationIcon hasNotification={false} />
                </button>
                <div className={styles.avatarContainer}>
                    <img className={styles.avatar} src={Config.IMAGES.avatar} alt="User avatar" />
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