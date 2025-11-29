import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from '../css_files/NavigationBar.module.css';
import Config from '../config.js';
import { useGuide } from './register/context/GuideContext.jsx';

const HIDDEN_STATUSES = [
    "START_REGISTER",
    "CREATE_TEAM",
    "SEND_NAME_TEAM",
    "GET_FIRST_CHARACTER"
];

const navItems = [
    { id: 'training', label: 'Тренування', icon: Config.IMAGES.dumbbell_icon, path: '/trainings' },
    { id: 'home', label: 'Головна', icon: Config.IMAGES.home_icon, path: '/' },
    { id: 'tournaments', label: 'Турніри', icon: Config.IMAGES.cup_icon, path: '/blitz' },
    { id: 'transfers', label: 'Трансфери', icon: Config.IMAGES.stadion_icon, path: '/transfer' },
    { id: 'learning', label: 'База', icon: Config.IMAGES.character_icon, path: '/education_centre' },
    { id: 'ratings', label: 'Рейтинги', icon: Config.IMAGES.rating_icon, path: '/rating' },
];

const NavItem = ({ item, isActive, onClick, isHighlighted, isDisabled, isDimmed }) => {
    const itemClasses = [
        styles.navItem,
        isActive ? styles.active : '',
        isHighlighted ? styles.highlighted : '',
        isDisabled ? styles.disabled : '',
        isDimmed ? styles.dimmed : '',
    ].join(' ').trim();

    return (
        <button
            type="button"
            className={itemClasses}
            onClick={() => onClick(item.path)}
            aria-label={item.label}
            disabled={isDisabled && !isHighlighted}
        >
            <img className={styles.navIcon} src={item.icon} alt="" />
            <span className={styles.navLabel}>{item.label}</span>
        </button>
    );
};

export function NavigationBar({ user }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { guideTarget } = useGuide();

    if (user && HIDDEN_STATUSES.includes(user.status_register)) {
        return null;
    }

    // --- ВИПРАВЛЕНА ЛОГІКА ---

    // 1. Шукаємо: чи є поточна ціль (guideTarget) серед кнопок цього меню?
    // Якщо guideTarget === 'shop', то targetItem буде undefined (бо шопа тут немає)
    const targetItem = guideTarget ? navItems.find(item => item.id === guideTarget) : null;

    const isOnTargetPage = targetItem && location.pathname === targetItem.path;

    // 2. ВІЗУАЛ (Темрява + Стрілка):
    // Показуємо оверлей ТІЛЬКИ якщо:
    // А) Є ціль
    // Б) Ця ціль знаходиться САМЕ В ЦЬОМУ МЕНЮ (!!targetItem)
    // В) Ми ще не на сторінці
    const showGuideVisuals = !!guideTarget && !!targetItem && !isOnTargetPage;

    // 3. БЛОКУВАННЯ КНОПОК:
    // Блокуємо, якщо є будь-яке завдання (навіть 'shop')
    const isNavigationLocked = !!guideTarget;

    const handleNavigate = (path) => {
        if (isNavigationLocked) {
            // Якщо ціль в цьому меню — пускаємо тільки туди
            if (targetItem && targetItem.path !== path) {
                return;
            }
            // Якщо ціль НЕ в цьому меню (наприклад shop) — блокуємо все тут
            if (!targetItem) {
                return;
            }
        }
        navigate(path);
    };

    return (
        <>
            {/* Оверлей малюється тільки якщо showGuideVisuals === true.
               Для 'shop' воно буде false, тому Навбар не зробить екран темним.
               Це зробить Header. */}
            {showGuideVisuals && <div className={styles.guideOverlay} />}

            <nav className={styles.navigationBar} role="navigation" aria-label="Головна навігація">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const isTarget = item.id === guideTarget;

                    // Підсвічуємо тільки якщо візуал активний (тобто ціль в цьому меню)
                    const isHighlighted = isTarget && showGuideVisuals;

                    // Затемнюємо інші кнопки, якщо є будь-яке завдання
                    const isDimmed = isNavigationLocked && !isTarget;

                    const isDisabled = isDimmed;

                    return (
                        <NavItem
                            key={item.id}
                            item={item}
                            isActive={isActive}
                            onClick={handleNavigate}
                            isHighlighted={isHighlighted}
                            isDisabled={isDisabled}
                            isDimmed={isDimmed}
                        />
                    );
                })}
            </nav>
        </>
    );
}