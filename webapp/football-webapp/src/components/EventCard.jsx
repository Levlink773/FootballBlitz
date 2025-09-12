import React from 'react';
import styles from '../css_files/EventCard.module.css';

export const EventCard = () => {
    return (
        <>
            <img className={styles.cardBg} src="../assets/img16.png" alt="event background"/>
            <img className={styles.cupIcon} src="../assets/img18.png" alt="tournament cup"/>
            <div className={styles.title}>БЛІЦ (8) 15:00 2/8</div>
            <div className={styles.countdown}>ДО СТАРТУ 00:30 ХВ</div>

            <img className={styles.registerButtonBg} src="../assets/img17.png" alt="button background"/>
            <div className={styles.registerButtonLabel}>ЗАРЕЄСТРУВАТИСЬ -20</div>
            <img className={styles.registerButtonIcon} src="../assets/img19.png" alt="coin"/>
        </>
    );
};