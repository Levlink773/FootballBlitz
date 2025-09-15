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
            {/* Фоновое изображение баннера */}
            <img
                className={styles.bannerBackground}
                src={bannerImage}
                alt="VIP background"
            />

            {/* Персонаж слева */}
            <img
                className={styles.characterImage}
                src={characterImage}
                alt="VIP character"
            />

            {/* Контейнер для текста */}
            <div className={styles.textContainer}>
                <div className={styles.vipTitle}>VIP АКТИВНИЙ</div>
                <div className={styles.expiryText}>
                    ПРЕМІАЛЬНІ ПЕРЕВАГИ ДО {expiryDate}
                </div>
            </div>
        </div>
    );
};