import React from "react";
import styles from "../../css_files/shop/ShopItems.module.css";
import Config from "../../config.js";

/*
  Ожидается, что в Config.IMAGES есть:
    - energy_background (опционально) – фон карточки
    - energy_mini / energy_medium / energy_large / energy_premium – картинки пакетов
*/

function ShopCard({ title, price, image, badge }) {
    // надежно подставляем фон (если есть) инлайново, чтобы избежать проблем с относительными путями
    const bgStyle = Config.IMAGES?.energy_background
        ? { backgroundImage: `url(${Config.IMAGES.energy_background})` }
        : {};

    return (
        <article className={styles.card} aria-label={`${title} — ${price}`}>
            <div className={styles.cardInner} style={bgStyle}>
                {badge && <div className={styles.badge}>{badge}</div>}

                <div className={styles.art}>
                    <div className={styles.energyWrap}>
                        <img src={image} alt={title} className={styles.energyImg} />
                        <div className={styles.energyGlow} aria-hidden="true" />
                    </div>
                </div>

                <div className={styles.info}>
                    <h3 className={styles.cardTitle}>{title}</h3>

                    <div className={styles.bottomRow}>
                        <button
                            className={styles.buyBtn}
                            onClick={() => {
                                // TODO: заменить на реальную логику покупки
                                console.log("Buy", title);
                            }}
                            aria-label={`Купить ${title} за ${price}`}
                        >
                            Купить
                            <span className={styles.buySpark} aria-hidden="true" />
                        </button>

                        <div className={styles.price} aria-hidden="true">
                            {price}
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}

export default function ShopEnergy() {
    return (
        <section className={styles.wrapper} aria-labelledby="shop-energy-title">
            <h2 id="shop-energy-title" className={styles.title}>
                ЕНЕРГІЯ
            </h2>

            <div className={styles.grid}>
                <ShopCard title="100 енергії" price="125 грн" image={Config.IMAGES.energy_mini} />
                <ShopCard title="200 енергії" price="200 грн" image={Config.IMAGES.energy_medium} badge="Популярно" />
                <ShopCard title="500 енергії" price="350 грн" image={Config.IMAGES.energy_large} />
                <ShopCard title="1 000 енергії" price="600 грн" image={Config.IMAGES.energy_premium} badge="Лучшее" />
            </div>
        </section>
    );
}
