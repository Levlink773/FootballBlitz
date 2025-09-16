import React from 'react';
import styles from '../../css_files/main_css/VipBanner.module.css';
import Config from "../../config.js";

export const VipBanner = () => {
    return (
        // Обгортка для правильного позиціонування
        <div className={styles.wrapper}>
            {/* Велика емблема персонажа */}
            <img
                className={styles.characterEmblem}
                src={Config.IMAGES.VIPImage} // Шлях до великої емблеми
                alt="VIP Emblem"
            />
            {/* Сам банер з текстом */}
            <div className={styles.banner}>
                <div className={styles.textBlock}>
                    <div className={styles.title}>VIP НЕ АКТИВНИЙ</div>
                    <div className={styles.description}>
                        +100 ЕНЕРГІЇ ЩОДНЯ<br/>
                        Х2 НАГОРОДИ НАВЧАЛЬНОГО ЦЕНТРУ<br/>
                        VIP ТУРНІРИ
                    </div>
                </div>
            </div>
        </div>
    );
};