import React from 'react';
import styles from '../css_files/Header.module.css';
import Config from "../config.js";

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

export const Header = ({ user }) => {
    const { currencies = {} } = user || {};

    const currencyData = [
        {
            icon: Config.IMAGES.coin,
            alt: 'Coins',
            amount: currencies.coins || 0,
            onAdd: () => console.log('Add coins clicked'),
        },
        {
            icon: Config.IMAGES.energy,
            alt: 'Energy',
            amount: currencies.energy || 0,
            onAdd: () => console.log('Add energy clicked'),
        },
    ];

    return (
        <header className={styles.headerContainer}>
            {/* Левый блок */}
            <div className={styles.leftSection}>
                <img className={styles.menuIcon} src={Config.IMAGES.bell_icon} alt="Notifications" />
                <img className={styles.avatar} src={Config.IMAGES.avatar} alt="User avatar" />
            </div>

            {/* Средний блок */}
            <div className={styles.middleSection}>
                {currencyData.map((currency, index) => (
                    <CurrencyGroup key={index} {...currency} />
                ))}
            </div>

            {/* Правый блок */}
            <div className={styles.rightSection}>
                <img
                    className={styles.settingsBg}
                    src={Config.IMAGES.vip_emblem_small}
                    alt="VIP emblem background"
                />
                <img
                    className={styles.settingsIcon}
                    src={Config.IMAGES.shop_icon}
                    alt="Shop"
                />
            </div>
        </header>
    );
};
