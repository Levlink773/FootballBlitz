import React from "react";
import styles from "../../css_files/shop/ShopItems.module.css";
import Config from "../../config.js";

/*
  Ожидается, что Config.IMAGES содержит:
  - gold_coin (опционально для фонового/декора)
  - coin_mini / coin_medium / coin_large / coin_premium (ваши изображения монет)
*/

function ShopCard({ title, price, image, label }) {
    const bgStyle = Config.IMAGES?.energy_background
        ? { backgroundImage: `url(${Config.IMAGES.energy_background})` }
        : {};
    return (
        <div className={styles.card} role="article" style={bgStyle} aria-label={`${title} — ${price}`}>
            <div className={styles.cardInner}>
                {/* label (опционально): Best / Popular / New */}
                {label && <div className={styles.badge}>{label}</div>}

                {/* art area */}
                <div className={styles.art}>
                    <div className={styles.coinWrap}>
                        <img src={image} alt={title} className={styles.coin} />
                        <div className={styles.coinGlow} aria-hidden="true" />
                    </div>
                </div>

                {/* info */}
                <div className={styles.info}>
                    <h3 className={styles.cardTitle}>{title}</h3>

                    <div className={styles.bottomRow}>
                        <div className={styles.price} aria-hidden="true">
                            {price}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ShopCoins() {
    return (
        <div className={styles.wrapper}>
            <h2 className={styles.title}>МОНЕТИ</h2>
            <div className={styles.grid}>
                <ShopCard
                    title="100 монет"
                    price="125 грн"
                    image={Config.IMAGES.coin_mini}
                />
                <ShopCard
                    title="500 монет"
                    price="200 грн"
                    image={Config.IMAGES.coin_medium}
                    label="Популярно"
                />
                <ShopCard
                    title="1 000 монет"
                    price="350 грн"
                    image={Config.IMAGES.coin_large}
                />
                <ShopCard
                    title="10 000 монет"
                    price="2 500 грн"
                    image={Config.IMAGES.coin_premium}
                    label="Лучшее"
                />
            </div>
        </div>
    );
}
