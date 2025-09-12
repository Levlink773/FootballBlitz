import React from 'react';
import styles from '../css_files/Header.module.css';

export const Header = ({ user }) => {
    return (
        <header className={styles.headerContainer}>
            <img className={styles.menuIcon} src="../assets/img25.png" alt="menu"/>
            <img className={styles.avatar} src={user.avatarUrl || "../assets/img26.png"} alt="avatar"/>

            {/* --- Coins --- */}
            <div className={styles.coinsContainer} />
            <img className={styles.coinsIcon} src="../assets/img21.png" alt="coins"/>
            <div className={styles.coinsAmount}>1000</div>
            <div className={styles.addCoinsButton} />
            <div className={styles.addCoinsIcon}>+</div>

            {/* --- Gems --- */}
            <div className={styles.gemsContainer} />
            <img className={styles.gemsIcon} src="../assets/img22.png" alt="gems"/>
            <div className={styles.gemsAmount}>1000</div>
            <div className={styles.addGemsButton} />
            <div className={styles.addGemsIcon}>+</div>

            {/* --- Settings --- */}
            <img className={styles.settingsBg} src="../assets/img23.png" alt="settings background"/>
            <img className={styles.settingsIcon} src="../assets/img24.png" alt="settings"/>
        </header>
    );
};