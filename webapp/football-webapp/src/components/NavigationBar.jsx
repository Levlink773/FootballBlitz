import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from '../css_files/NavigationBar.module.css';
import { useGuide } from './register/context/GuideContext.jsx';

// 🔥 ИМПОРТ НОВЫХ КАРТИНОК (Проверь пути!)
import Config from "../config.js";     // Команда

const HIDDEN_STATUSES = [
    "START_REGISTER", "CREATE_TEAM", "SEND_NAME_TEAM", "GET_FIRST_CHARACTER"
];

// 🔥 НОВЫЙ ПОРЯДОК И КАРТИНКИ
const navItems = [
    {
        id: 'home',
        label: 'Головна',
        icon: Config.IMAGES.imgHome,     // 6.png
        path: '/'
    },
    {
        id: 'team',
        label: 'Команда',
        icon: Config.IMAGES.imgTeam,     // 12.png
        path: '/team'
    },
    {
        id: 'league',
        label: 'Ліга',
        icon: Config.IMAGES.imgLeague,   // 7.png
        path: '/league',
        isCentral: true    // Центральный элемент
    },
    {
        id: 'transfer',
        label: 'Трансфери',
        icon: Config.IMAGES.imgTransfer, // 5.png
        path: '/transfer'
    },
    {
        id: 'profile',
        label: 'Профіль',
        icon: Config.IMAGES.imgProfile,  // 10.png
        path: '/profile'
    },
];

const NavItem = ({ item, isActive, onClick, isHighlighted, isDisabled, isDimmed }) => {
    return (
        <button
            type="button"
            className={`
                ${styles.navItem} 
                ${isActive ? styles.active : ''} 
                ${item.isCentral ? styles.central : ''}
                ${isHighlighted ? styles.highlighted : ''}
                ${isDisabled ? styles.disabled : ''}
            `}
            onClick={() => onClick(item.path)}
            disabled={isDisabled && !isHighlighted}
        >
            {/* 3D контейнер для иконки */}
            <div className={styles.iconContainer3D}>
                <img className={styles.navIcon} src={item.icon} alt={item.label} />
                {/* Внутреннее свечение */}
                <div className={styles.innerGlow} />
            </div>
            <span className={styles.navLabel}>{item.label}</span>
        </button>
    );
};

export function NavigationBar({ user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { guideTarget } = useGuide();
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const index = navItems.findIndex(item => item.path === location.pathname);
        if (index !== -1) setActiveIndex(index);
    }, [location.pathname]);

    if (user && HIDDEN_STATUSES.includes(user.status_register)) return null;

    const targetItem = guideTarget ? navItems.find(item => item.id === guideTarget) : null;
    const showGuideVisuals = !!guideTarget && !!targetItem && location.pathname !== targetItem.path;
    const isNavigationLocked = !!guideTarget;

    const handleNavigate = (path) => {
        if (isNavigationLocked && targetItem && targetItem.path !== path) return;
        navigate(path);
    };

    return (
        <>
            {showGuideVisuals && <div className={styles.guideOverlay} />}

            <nav className={`${styles.navigationBar} ${showGuideVisuals ? styles.guided : ''}`}>

                {/* Источник света под активной кнопкой */}
                <div
                    className={styles.lightSource}
                    style={{ transform: `translateX(${activeIndex * 100}%)` }}
                >
                    <div className={styles.lightPlasma} />
                </div>

                <div className={styles.buttonsContainer}>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        const isTarget = item.id === guideTarget;
                        return (
                            <NavItem
                                key={item.id}
                                item={item}
                                isActive={isActive}
                                onClick={handleNavigate}
                                isHighlighted={isTarget && showGuideVisuals}
                                isDisabled={isNavigationLocked && !isTarget}
                                isDimmed={isNavigationLocked && !isTarget}
                            />
                        );
                    })}
                </div>
            </nav>
        </>
    );
}