import React from 'react';
import styles from '../css_files/NavigationBar.module.css';
import Config from "../config.js";

const navItems = [
        { label: 'Головна', icon: Config.IMAGES.home_icon, labelClass: styles.homeLabel, iconClass: styles.homeIcon },
        { label: 'Турніри', icon: Config.IMAGES.cup_icon, labelClass: styles.tournamentsLabel, iconClass: styles.tournamentsIcon },
        { label: 'Трансфери', icon: Config.IMAGES.stadion_icon, labelClass: styles.transfersLabel, iconClass: styles.transfersIcon },
        { label: 'Учбовий центр', icon: Config.IMAGES.character_icon, labelClass: styles.learningLabel, iconClass: styles.learningIcon },
        { label: 'Рейтинги', icon: Config.IMAGES.rating_icon, labelClass: styles.ratingsLabel, iconClass: styles.ratingsIcon },
];

const NavItem = ({ label, icon, labelClass, iconClass }) => (
    <>
            <div className={`${styles.navLabel} ${labelClass}`}>{label}</div>
            <img
                className={`${styles.navIcon} ${iconClass}`}
                src={icon}
                alt={label}
                aria-label={label}
            />
    </>
);

export const NavigationBar = () => {
        return (
            <nav className={styles.navigationBar}>
                    <div className={styles.trainingButtonBg} />
                    <div className={styles.mainButtonsBg} />

                    {/* Training Button */}
                    <div className={styles.trainingLabel}>Тренування</div>
                    <img
                        className={styles.trainingIcon}
                        src={Config.IMAGES.dumbbell_icon}
                        alt="Тренування"
                        aria-label="Тренування"
                    />

                    {/* Dynamic Nav Items */}
                    {navItems.map((item, index) => (
                        <NavItem key={index} {...item} />
                    ))}
            </nav>
        );
};
