import React, { useState } from 'react';
import styles from '../css_files/NavigationBar.module.css';
import Config from "../config.js";

// Мы объединили все элементы навигации в один массив для гибкости.
// Теперь легко менять их порядок, добавлять или удалять.
const navItems = [
    { id: 'training', label: 'Тренування', icon: Config.IMAGES.dumbbell_icon },
    { id: 'home', label: 'Головна', icon: Config.IMAGES.home_icon },
    { id: 'tournaments', label: 'Турніри', icon: Config.IMAGES.cup_icon },
    { id: 'transfers', label: 'Трансфери', icon: Config.IMAGES.stadion_icon },
    { id: 'learning', label: 'Учбовий центр', icon: Config.IMAGES.character_icon },
    { id: 'ratings', label: 'Рейтинги', icon: Config.IMAGES.rating_icon },
];

// Улучшенный дочерний компонент для каждого элемента навигации
const NavItem = ({ item, isActive, onClick }) => {
    // Динамически создаем классы. Если кнопка активна, добавляется класс 'active'.
    const itemClasses = `${styles.navItem} ${isActive ? styles.active : ''}`;

    return (
        <button className={itemClasses} onClick={onClick} aria-label={item.label}>
            <img
                className={styles.navIcon}
                src={item.icon}
                alt="" // alt оставляем пустым, т.к. aria-label на кнопке уже описывает действие
            />
            <span className={styles.navLabel}>{item.label}</span>
        </button>
    );
};

export const NavigationBar = () => {
    // Состояние для отслеживания активной вкладки. 'home' будет активна по умолчанию.
    const [activeItem, setActiveItem] = useState('home');

    return (
        <nav className={styles.navigationBar}>
            {navItems.map((item) => (
                <NavItem
                    key={item.id}
                    item={item}
                    isActive={activeItem === item.id}
                    onClick={() => setActiveItem(item.id)}
                />
            ))}
        </nav>
    );
};