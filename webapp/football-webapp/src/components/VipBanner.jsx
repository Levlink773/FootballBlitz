import React from 'react';
import styles from '../css_files/VipBanner.module.css';

export const VipBanner = () => {
    return (
        <>
            <img className={styles.bannerBg} src="../assets/img14.png" alt="vip background"/>
            <img className={styles.icon} src="../assets/img15.png" alt="vip icon"/>
            <div className={styles.title}>VIP НЕ АКТИВНИЙ</div>
            <div className={styles.description}>
                +100 ЕНЕРГІЇ ЩОДНЯ<br/>
                Х2 НАГОРОДИ НАВЧАЛЬНОГО ЦЕНТРУ<br/>
                VIP ТУРНІРИ
            </div>
        </>
    );
};