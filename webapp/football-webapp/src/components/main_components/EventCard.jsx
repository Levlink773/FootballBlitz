import React from 'react';
import styles from '../../css_files/main_css/EventCard.module.css';
import Config from "../../assets_data.js";

export const EventCard = () => {
    return (
        <>
            <img className={styles.cardBg} src={Config.IMAGES.football_goal} alt="event background"/>
            <img className={styles.cupIcon} src={Config.IMAGES.cup} alt="tournament cup"/>
            <div className={styles.title}>БЛІЦ (8) 15:00 2/8</div>
            <div className={styles.countdown}>ДО СТАРТУ 00:30 ХВ</div>

            <img className={styles.registerButtonBg} src={Config.IMAGES.vip_emblem_medium} alt="button background"/>
            <div className={styles.registerButtonLabel}>ЗАРЕЄСТРУВАТИСЬ -20</div>
            <img className={styles.registerButtonIcon} src={Config.IMAGES.energy} alt="coin"/>
        </>
    );
};