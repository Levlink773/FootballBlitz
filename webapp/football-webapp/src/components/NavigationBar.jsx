import React from 'react';
import styles from '../css_files/NavigationBar.module.css';

export const NavigationBar = () => {
    return (
        <nav>
            <div className={styles.trainingButtonBg} />
            <div className={styles.mainButtonsBg} />

            {/* Training Button */}
            <div className={styles.trainingLabel}>Тренування</div>
            <img className={styles.trainingIcon} src="../assets/img3.png" alt="Тренування"/>

            {/* Other Buttons */}
            <div className={`${styles.navLabel} ${styles.homeLabel}`}>Головна</div>
            <img className={`${styles.navIcon} ${styles.homeIcon}`} src="../assets/img7.png" alt="Головна"/>

            <div className={`${styles.navLabel} ${styles.tournamentsLabel}`}>Турніри</div>
            <img className={`${styles.navIcon} ${styles.tournamentsIcon}`} src="../assets/img2.png" alt="Турніри"/>

            <div className={`${styles.navLabel} ${styles.transfersLabel}`}>Трансфери</div>
            <img className={`${styles.navIcon} ${styles.transfersIcon}`} src="../assets/img4.png" alt="Трансфери"/>

            <div className={`${styles.navLabel} ${styles.learningLabel}`}>Учбовий центр</div>
            <img className={`${styles.navIcon} ${styles.learningIcon}`} src="../assets/img5.png" alt="Учбовий центр"/>

            <div className={`${styles.navLabel} ${styles.ratingsLabel}`}>Рейтинги</div>
            <img className={`${styles.navIcon} ${styles.ratingsIcon}`} src="../assets/img6.png" alt="Рейтинги"/>
        </nav>
    );
};