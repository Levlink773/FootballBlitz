import React from "react";
import styles from "../../css_files/main_css/VipBannerActive.module.css";
import Config from "../../config.js";

export const VipBannerActive = ({
                                    expiryDate = "07.10.2025",
                                    bannerImage = Config.IMAGES.bannerImage,
                                    characterImage = Config.IMAGES.VIPImage,
                                }) => {
    return (
        <div className={styles.container}>
            {/* Фон баннера */}
            <img
                className={styles.bannerBackground}
                src={bannerImage}
                alt="VIP background"
            />

            {/* Заголовок VIP */}
            <div className={styles.vipTitle}>VIP АКТИВНИЙ</div>

            {/* Дата окончания действия VIP */}
            <div className={styles.expiryText}>
                ПРЕМІАЛЬНІ ПЕРЕВАГИ ДО {expiryDate}
            </div>

            {/* Персонаж слева */}
            <img
                className={styles.characterImage}
                src={characterImage}
                alt="VIP character"
            />
        </div>
    );
};
