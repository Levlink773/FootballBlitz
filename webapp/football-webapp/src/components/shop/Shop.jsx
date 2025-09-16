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

const Shop = () => {
    // add a small mount class to trigger entrance animations (useful when this component is mounted)
    useEffect(() => {
        const root = document.querySelector(`.${styles.shopContainer}`);
        if (!root) return;
        root.classList.add(styles.mounted);
        return () => root && root.classList.remove(styles.mounted);
    }, []);

    return (
        <div className={styles.shopContainer}>
            {/* Featured Item Section */}
            <div className={styles.featuredItem} aria-hidden="false">
                <img src={Config.IMAGES.bannerImage} alt="Featured background" className={styles.featuredBg}/>
                <span className={styles.popularTag} aria-hidden="true">НАЙПОПУЛЯРНІШЕ</span>
                <div className={styles.featuredContent}>
                    <img src={Config.IMAGES.VIPImage} alt="VIP" className={styles.featuredIcon}/>
                    <div className={styles.featuredText}>
                        <h3 className={styles.featuredTitle}>VIP-пасс</h3>
                        <p className={styles.featuredDesc}>+100 енергії щодня · х2 нагороди · VIP-турніри</p>

                        <div className={styles.featuredFooter}>
                            <span className={styles.featuredPrice}>999,99 грн</span>
                            <button className={styles.buyButton} aria-label="Купити VIP-пасс">Купити</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Boxes Section */}
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
                    style={{
                        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.28) 100%), url(${Config.IMAGES.gold_small_line})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    }}
                >
                    <img src={Config.IMAGES.big_coin} alt="Монети" className={styles.currencyBigImg} />
                    <div className={styles.currencyOverlay}>
                        <span className={styles.currencyLabel}>Монети</span>
                        <button className={styles.buyButton}>Купити</button>
                    </div>
                </div>
                <div
                    className={`${styles.currencyItem} ${styles.energyItem}`}
                    style={{
                        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.28) 100%), url(${Config.IMAGES.train_line})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    }}
                >
                    <img src={Config.IMAGES.big_energy} alt="Енергія" className={styles.currencyBigImg} />
                    <div className={styles.currencyOverlay}>
                        <span className={styles.currencyLabel}>Енергія</span>
                        <button className={styles.buyButton}>Купити</button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Shop;