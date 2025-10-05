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

// ✨ NavItem now accepts an `isDisabled` prop
const NavItem = ({ item, isActive, onClick, isHighlighted, isDisabled }) => {
    // ✨ A `disabled` class is added for styling, and the button is functionally disabled
    const itemClasses = `${styles.navItem} ${isActive ? styles.active : ''} ${isHighlighted ? styles.highlighted : ''} ${isDisabled ? styles.disabled : ''}`;

    return (
        <button
            className={itemClasses}
            onClick={() => onClick(item.path)}
            aria-label={item.label}
            disabled={isDisabled} // ✨ The button is disabled if `isDisabled` is true
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

    // ✨ Updated navigation handler
    const handleNavigate = (path) => {
        // If there's an active guide...
        if (guideTarget) {
            // ...find the item that the guide is pointing to.
            const targetItem = navItems.find(item => item.id === guideTarget);
            // If the user tries to click on a different item, block the navigation.
            if (targetItem && targetItem.path !== path) {
                return; // Exit without navigating
            }
        }
        // Otherwise, allow navigation.
        navigate(path);
    };

    return (
        <nav className={styles.navigationBar}>
            {navItems.map((item) => {
                const isHighlighted = item.id === guideTarget;
                // ✨ An item is disabled if a guide is active, AND it's not the currently highlighted item.
                const isDisabled = !!guideTarget && !isHighlighted;

                return (
                    <NavItem
                        key={item.id}
                        item={item}
                        isActive={location.pathname === item.path}
                        onClick={handleNavigate}
                        isHighlighted={isHighlighted}
                        isDisabled={isDisabled} // ✨ Pass the disabled state to the NavItem
                    />
                );
            })}
        </nav>
    );
};
