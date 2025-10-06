import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from '../css_files/NavigationBar.module.css';
import Config from "../config.js";
import {useGuide} from "./register/context/GuideContext.jsx";

const navItems = [
    { id: 'training', label: 'Тренування', icon: Config.IMAGES.dumbbell_icon, path: '/trainings' },
    { id: 'home', label: 'Головна', icon: Config.IMAGES.home_icon, path: '/' },
    { id: 'tournaments', label: 'Турніри', icon: Config.IMAGES.cup_icon, path: '/blitz' },
    { id: 'transfers', label: 'Трансфери', icon: Config.IMAGES.stadion_icon, path: '/transfer' },
    { id: 'learning', label: 'Учбовий центр', icon: Config.IMAGES.character_icon, path: '/education_centre' },
    { id: 'ratings', label: 'Рейтинги', icon: Config.IMAGES.rating_icon, path: '/rating' },
];

const NavItem = ({ item, isActive, onClick, isHighlighted, isDisabled }) => {
    const itemClasses = `${styles.navItem} ${isActive ? styles.active : ''} ${isHighlighted ? styles.highlighted : ''} ${isDisabled ? styles.disabled : ''}`;

    return (
        <button
            className={itemClasses}
            onClick={() => onClick(item.path)}
            aria-label={item.label}
            disabled={isDisabled}
        >
            <img className={styles.navIcon} src={item.icon} alt=""/>
            <span className={styles.navLabel}>{item.label}</span>
        </button>
    );
};

export const NavigationBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { guideTarget } = useGuide(); // Get the current guide target

    const handleNavigate = (path) => {
        if (guideTarget) {
            const targetItem = navItems.find(item => item.id === guideTarget);
            if (targetItem && targetItem.path !== path) {
                return; // Exit without navigating
            }
        }
        navigate(path);
    };

    return (
        <nav className={styles.navigationBar}>
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                // Highlight only if this item is the guide target AND user is not already on that page
                const isHighlighted = item.id === guideTarget && !isActive;

                // Disabled when a guide target exists AND:
                // - This item is not the current active page
                // - AND this item is not the guide target (so the guide target remains enabled)
                // This ensures: when user is already on the guide target page, it won't be highlighted,
                // and all other tabs remain inactive/disabled.
                const isDisabled = !!guideTarget && !isActive && item.id !== guideTarget;

                return (
                    <NavItem
                        key={item.id}
                        item={item}
                        isActive={isActive}
                        onClick={handleNavigate}
                        isHighlighted={isHighlighted}
                        isDisabled={isDisabled}
                    />
                );
            })}
        </nav>
    );
};
