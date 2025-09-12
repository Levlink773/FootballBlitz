import React from 'react';
import styles from '../css_files/StatsPanel.module.css';

export const StatsPanel = () => {
    return (
        <>
            <div className={styles.statsTitle}>Статистика</div>
            <div className={styles.ratingsTitle}>Рейтинги</div>

            <div className={styles.toggleContainer}></div>
            <div className={styles.toggleCircle}></div>

            <div className={styles.divider1}></div>
            <div className={styles.divider2}></div>

            <div className={styles.statBox1}>
                903<br/>гри
            </div>
            <div className={styles.statBox2}>
                89.3%<br/>перемог
            </div>
            <div className={styles.statBox3}>
                903<br/>гри
            </div>
        </>
    );
};