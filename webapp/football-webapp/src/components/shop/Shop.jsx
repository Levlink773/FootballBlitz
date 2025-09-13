// components/shop/Shop.jsx

import React from 'react';
import styles from '../../css_files/shop/Shop.module.css';
import Config from '../../config.js'; // Adjust path if needed

// Data for the three boxes, making it easy to change prices or titles
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
        imageStyle: {width: '101px', height: '125px', marginTop: '-40px'} // Style to make it taller
    }
];

// A reusable component for each shop box
const ShopBox = ({title, originalPrice, discountedPrice, discount, image, imageStyle}) => (
    <div className={styles.shopBox}>
        <img src={image} alt={title} className={styles.boxImage} style={imageStyle}/>
        <span className={styles.boxTitle}>{title}</span>
        <div className={styles.boxPrices}>
            <span className={styles.originalPrice}>{originalPrice}</span>
            <span className={styles.discountedPrice}>{discountedPrice}</span>
        </div>
        <span className={styles.discountTag}>{discount}</span>
    </div>
);


const Shop = () => {
    return (
        <div className={styles.shopContainer}>
            {/* Featured Item Section */}
            <div className={styles.featuredItem}>
                <img src={Config.IMAGES.bannerImage} alt="Featured background"/>
                <span className={styles.popularTag}>НАЙПОПУЛЯРНІШЕ</span>
                <div className={styles.featuredContent}>
                    <img src={Config.IMAGES.VIPImage} alt="Featured icon"/>
                    <div className={styles.featuredText}>
                        <h3 className={styles.featuredTitle}>VIP-пасс</h3>
                        <p className={styles.featuredDesc}>+100 енергії щодня х2 нагороди <br/> Навчального центру VIP турніри</p>

                        <div className={styles.featuredFooter}>
                            <span className={styles.featuredPrice}>999,99 грн</span>
                            <button className={styles.buyButton}>Купити</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Boxes Section */}
            <div className={styles.boxesContainer}>
                {BOX_ITEMS.map(item => (
                    <ShopBox
                        key={item.id}
                        title={item.title}
                        originalPrice={item.originalPrice}
                        discountedPrice={item.discountedPrice}
                        discount={item.discount}
                        image={item.image}
                        imageStyle={item.imageStyle}
                    />
                ))}
            </div>

            {/* Currency Purchase Section */}
            <div className={styles.currencyContainer}>
                <div className={`${styles.currencyItem} ${styles.coinItem}`}>
                    <img src={Config.IMAGES.big_coin} alt="Монети" className={styles.currencyBigImg} />
                    <div className={styles.currencyOverlay}>
                        <span className={styles.currencyLabel}>Монети</span>
                        <button className={styles.buyButton}>Купити</button>
                    </div>
                </div>

                <div className={`${styles.currencyItem} ${styles.energyItem}`}>
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