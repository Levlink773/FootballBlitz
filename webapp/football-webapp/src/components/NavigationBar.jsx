// src/components/NavigationBar.jsx

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Import hooks
import styles from '../css_files/NavigationBar.module.css';
import Config from "../config.js";

// Додаємо властивість 'path' до кожного елемента
const navItems = [
    { id: 'training', label: 'Тренування', icon: Config.IMAGES.dumbbell_icon, path: '/trainings' },
    { id: 'home', label: 'Головна', icon: Config.IMAGES.home_icon, path: '/' },
    { id: 'tournaments', label: 'Турніри', icon: Config.IMAGES.cup_icon, path: '/blitz' },
    { id: 'transfers', label: 'Трансфери', icon: Config.IMAGES.stadion_icon, path: '/transfer' },
    { id: 'learning', label: 'Учбовий центр', icon: Config.IMAGES.character_icon, path: '/education_centre' },
    { id: 'ratings', label: 'Рейтинги', icon: Config.IMAGES.rating_icon, path: '/rating' },
];

const NavItem = ({ item, isActive, onClick }) => {
    const itemClasses = `${styles.navItem} ${isActive ? styles.active : ''}`;

    // Передаємо item.path в обробник
    return (
        <button className={itemClasses} onClick={() => onClick(item.path)} aria-label={item.label}>
            <img
                className={styles.navIcon}
                src={item.icon}
                alt=""
            />
            <span className={styles.navLabel}>{item.label}</span>
        </button>
    );
};

export const NavigationBar = () => {
    // Ініціалізуємо хуки
    const navigate = useNavigate();
    const location = useLocation();

    // Функція для переходу за вказаним шляхом
    const handleNavigate = (path) => {
        navigate(path);
    };

    return (
        <nav className={styles.navigationBar}>
            {navItems.map((item) => (
                <NavItem
                    key={item.id}
                    item={item}
                    // Активність визначається порівнянням шляху елемента з поточним URL
                    isActive={location.pathname === item.path}
                    onClick={handleNavigate}
                />
            ))}
        </nav>
    );
};