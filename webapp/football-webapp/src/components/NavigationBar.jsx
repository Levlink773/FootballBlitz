// ----- FILE: NavigationBar.jsx -----
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from '../css_files/NavigationBar.module.css';
import Config from '../config.js';
import { useGuide } from './register/context/GuideContext.jsx';

const navItems = [
    { id: 'training', label: 'Тренування', icon: Config.IMAGES.dumbbell_icon, path: '/trainings' },
    { id: 'home', label: 'Головна', icon: Config.IMAGES.home_icon, path: '/' },
    { id: 'tournaments', label: 'Турніри', icon: Config.IMAGES.cup_icon, path: '/blitz' },
    { id: 'transfers', label: 'Трансфери', icon: Config.IMAGES.stadion_icon, path: '/transfer' },
    { id: 'learning', label: 'База', icon: Config.IMAGES.character_icon, path: '/education_centre' },
    { id: 'ratings', label: 'Рейтинги', icon: Config.IMAGES.rating_icon, path: '/rating' },
];

const NavItem = ({ item, isActive, onClick, isHighlighted, isDisabled }) => {
    const itemClasses = [
        styles.navItem,
        isActive ? styles.active : '',
        isHighlighted ? styles.highlighted : '',
        isDisabled ? styles.disabled : '',
    ].join(' ').trim();

    return (
        <button
            type="button"
            className={itemClasses}
            onClick={() => onClick(item.path)}
            aria-label={item.label}
            disabled={isDisabled}
        >
            <img className={styles.navIcon} src={item.icon} alt="" />
            <span className={styles.navLabel}>{item.label}</span>
        </button>
    );
};

export function NavigationBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { guideTarget } = useGuide();

    const handleNavigate = (path) => {
        if (guideTarget) {
            const targetItem = navItems.find(item => item.id === guideTarget);
            if (targetItem && targetItem.path !== path) {
                return; // блокируем навигацию, если открыт гайд и текущий путь не совпадает с целью
            }
        }
        navigate(path);
    };

    return (
        <nav className={styles.navigationBar} role="navigation" aria-label="Главная навигация">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const isHighlighted = item.id === guideTarget && !isActive;
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
}