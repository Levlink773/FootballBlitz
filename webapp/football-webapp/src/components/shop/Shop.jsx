import React, {useEffect} from 'react';
import styles from '../../css_files/shop/Shop.module.css';
import Config from '../../config.js'; // keep your existing Config and images

const BOX_ITEMS = [
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

const ShopBox = ({title, originalPrice, discountedPrice, discount, image, imageStyle, index}) => {
    // using inline style var --i to stagger animations
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
            <button className={styles.boxBuy} aria-label={`Купити ${title}`}>Купити</button>
        </div>
    );
};

const Shop = ({ onOpenModal }) => {
    useEffect(() => {
        const root = document.querySelector(`.${styles.shopContainer}`);
        if (!root) return;
        root.classList.add(styles.mounted);
        return () => root && root.classList.remove(styles.mounted);
    }, []);

    return (
        <div className={styles.shopContainer}>
            {/* Featured Item Section */}
            {/* Add onClick to open the VIP modal */}
            <div
                className={styles.featuredItem}
                aria-hidden="false"
                onClick={() => onOpenModal('vip')}
                style={{ cursor: 'pointer' }}
            >
                <img src={Config.IMAGES.bannerImage} alt="Featured background" className={styles.featuredBg}/>
                <span className={styles.popularTag} aria-hidden="true">НАЙПОПУЛЯРНІШЕ</span>
                <div className={styles.featuredContent}>
                    <img src={Config.IMAGES.VIPImage} alt="VIP" className={styles.featuredIcon}/>
                    <div className={styles.featuredText}>
                        <h3 className={styles.featuredTitle}>VIP-пасс</h3>
                        <p className={styles.featuredDesc}>+100 енергії щодня · х2 нагороди · VIP-турніри</p>

                        <div className={styles.featuredFooter}>
                            <span className={styles.featuredPrice}>999,99 грн</span>
                            {/* The button's onClick also triggers the modal and stops propagation */}
                            <button
                                className={styles.buyButton}
                                aria-label="Купити VIP-пасс"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent parent onClick from firing too
                                    onOpenModal('vip');
                                }}
                            >
                                Купити
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Boxes Section (unchanged) */}
            <div className={styles.boxesContainer}>
                {BOX_ITEMS.map((item, idx) => (
                    <ShopBox
                        key={item.id}
                        title={item.title}
                        originalPrice={item.originalPrice}
                        discountedPrice={item.discountedPrice}
                        discount={item.discount}
                        image={item.image}
                        imageStyle={item.imageStyle}
                        index={idx}
                    />
                ))}
            </div>

            {/* Currency Purchase Section */}
            <div className={styles.currencyContainer}>
                <div
                    className={`${styles.currencyItem} ${styles.coinItem}`}
                    // Add onClick to open the coin purchase modal
                    onClick={() => onOpenModal('coin')}
                    style={{
                        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.28) 100%), url(${Config.IMAGES.gold_small_line})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        cursor: 'pointer' // Add pointer cursor
                    }}
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
                    // Add onClick to open the energy purchase modal
                    onClick={() => onOpenModal('energy')}
                    style={{
                        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.28) 100%), url(${Config.IMAGES.train_line})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        cursor: 'pointer' // Add pointer cursor
                    }}
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