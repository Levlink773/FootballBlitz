import Config from "../../config.js";
import styles from "../../css_files/shop/ShopItems.module.css";

// ShopCard с обновлённой кнопкой Купить (больше и выше)
function ShopCard({ title, price, image }) {
    const baseStyle = {
        width: 150,
        height: 190,
        borderRadius: 16,
        backgroundImage: `url(${Config.IMAGES.energy_background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        boxShadow: '0 6px 12px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer',
        overflow: 'hidden',
    };

    const titleStyle = {
        fontWeight: 'bold',
        fontSize: 15,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 4,
        textShadow: '0 1px 3px rgba(0,0,0,0.6)',
    };

    const imgWrapperStyle = {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '8px 0',
    };

    const priceStyle = {
        backgroundImage: `url(${Config.IMAGES.bannerImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: '#fff',
        padding: '10px 20px',
        borderRadius: 12,
        fontWeight: 'bold',
        fontSize: 18,
        textAlign: 'center',
        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        minWidth: '100px',
        marginBottom: '4px',
    };

    const buttonStyle = {
        backgroundImage: `url(${Config.IMAGES.bannerImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        color: '#fff',
        padding: '12px 24px',
        borderRadius: 14,
        fontWeight: 'bold',
        fontSize: 18,
        textAlign: 'center',
        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        cursor: 'pointer',
        marginTop: '2px',
    };

    return (
        <div
            style={baseStyle}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.35)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.25)';
            }}
        >
            {/* Заголовок */}
            <div style={titleStyle}>{title}</div>

            {/* Картинка */}
            <div style={imgWrapperStyle}>
                <img
                    src={image}
                    alt={title}
                    style={{
                        maxWidth: '120%',
                        maxHeight: '120%',
                        objectFit: 'contain',
                    }}
                />
            </div>

            {/* Цена */}
            <div style={priceStyle}>{price}</div>
        </div>
    );
}


export default function ShopEnergy() {
    return (
        <div className={styles.wrapper}>
            <h2 className={styles.title}>ЕНЕРГІЯ</h2>
            <div className={styles.grid}>
                <ShopCard title="100 енергії" price="125 грн" image={Config.IMAGES.energy_mini} />
                <ShopCard title="200 енергії" price="200 грн" image={Config.IMAGES.energy_medium} />
                <ShopCard title="500 енергії" price="350 грн" image={Config.IMAGES.energy_large} />
                <ShopCard title="1000 енергії" price="600 грн" image={Config.IMAGES.energy_premium} />
            </div>
        </div>
    );
}
