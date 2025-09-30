import React, {useEffect} from 'react';
import styles from '../../css_files/shop/Shop.module.css';
import Config from '../../config.js';

const BOX_ITEMS = [
    // ... ваш масив BOX_ITEMS залишається без змін
    {
        id: 'mini',
        title: 'Міні-бокс',
        originalPrice: '150 грн',
        discountedPrice: '75 грн',
        discount: 'Знижка -50%',
        image: Config.IMAGES.box_mini,
        imageStyle: {width: '75px', height: '93px'}
    },
    {
        id: 'medium',
        title: 'Середній бокс',
        originalPrice: '290 грн',
        discountedPrice: '145 грн',
        discount: 'Знижка -50%',
        image: Config.IMAGES.box_medium,
        imageStyle: {width: '75px', height: '93px'}
    },
    {
        id: 'premium',
        title: 'Преміум бокс',
        originalPrice: '490 грн',
        discountedPrice: '245 грн',
        discount: 'Знижка -50%',
        image: Config.IMAGES.box_premium,
        imageStyle: {width: '101px', height: '125px', marginTop: '-40px'}
    }
];

const ShopBox = ({ title, originalPrice, discountedPrice, discount, image, imageStyle, index, onBuy }) => {
    // ... компонент ShopBox залишається без змін
    const style = {['--i']: index};
    return (
        <div className={styles.shopBox} style={style} role="group" aria-label={`${title} — ${discountedPrice}`}>
            <div className={styles.boxImageWrap}>
                <img src={image} alt={title} className={styles.boxImage} style={imageStyle}/>
            </div>
            <span className={styles.boxTitle}>{title}</span>
            <div className={styles.boxPrices}>
                <span className={styles.originalPrice}>{originalPrice}</span>
                <span className={styles.discountedPrice}>{discountedPrice}</span>
            </div>
            <span className={styles.discountTag}>{discount}</span>
            <button className={styles.boxBuy} aria-label={`Купити ${title}`} onClick={onBuy}>
                Купити
            </button>
        </div>
    );
};

const Shop = ({ onOpenModal, onPurchase }) => {
    useEffect(() => {
        const root = document.querySelector(`.${styles.shopContainer}`);
        if (!root) return;
        root.classList.add(styles.mounted);
        return () => root && root.classList.remove(styles.mounted);
    }, []);

    return (
        <div className={styles.shopContainer}>
            {/* Featured Item Section */}
            <div
                className={styles.featuredItem}
                aria-hidden="false"
                onClick={() => onOpenModal('vip')} // Логіка не змінюється
                style={{ cursor: 'pointer' }}
            >
                <img src={Config.IMAGES.bannerImage} alt="Featured background" className={styles.featuredBg}/>
                <span className={styles.popularTag} aria-hidden="true">НАЙПОПУЛЯРНІШЕ</span>
                <div className={styles.featuredContent}>
                    <img src={Config.IMAGES.VIPImage} alt="VIP" className={styles.featuredIcon}/>
                    <div className={styles.featuredText}>
                        <h3 className={styles.featuredTitle}>VIP-пасс</h3>
                        {/* ЗМІНА 1: Оновлюємо опис, щоб він був більш загальним */}
                        <p className={styles.featuredDesc}>Оберіть свій ідеальний план: 7 або 30 днів!</p>

                        <div className={styles.featuredFooter}>
                            {/* ЗМІНА 2: Замінюємо конкретну ціну на "від..." */}
                            <span className={styles.featuredPrice}>від 139 грн</span>
                            <button
                                className={styles.buyButton}
                                style={{top: -5, right: -5}}
                                aria-label="Купити VIP-пасс"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenModal('vip');
                                }}
                            >
                                Купити
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Boxes Section (без змін) */}
            <div className={styles.boxesContainer}>
                {BOX_ITEMS.map((item, idx) => (
                    <ShopBox
                        key={item.id}
                        {...item}
                        index={idx}
                        onBuy={() => onPurchase('box', item)}
                    />
                ))}
            </div>


            {/* Currency Purchase Section (без змін) */}
            <div className={styles.currencyContainer}>
                <div
                    className={`${styles.currencyItem} ${styles.coinItem}`}
                    onClick={() => onOpenModal('coin')}
                >
                    <img src={Config.IMAGES.big_coin} alt="Монети" className={styles.currencyBigImg} />
                    <div className={styles.currencyOverlay}>
                        <span className={styles.currencyLabel}>Монети</span>
                        <button
                            className={styles.buyButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenModal('coin');
                            }}
                        >
                            Купити
                        </button>
                    </div>
                </div>
                <div
                    className={`${styles.currencyItem} ${styles.energyItem}`}
                    onClick={() => onOpenModal('energy')}
                >
                    <img src={Config.IMAGES.big_energy} alt="Енергія" className={styles.currencyBigImg} />
                    <div className={styles.currencyOverlay}>
                        <span className={styles.currencyLabel}>Енергія</span>
                        <button
                            className={styles.buyButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenModal('energy');
                            }}
                        >
                            Купити
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Shop;