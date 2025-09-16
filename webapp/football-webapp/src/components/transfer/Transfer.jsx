import React, { useState } from 'react';

// --- Импорты всех картинок ---
import Img55 from '../../Assets/Img55.Png';
import Img56 from '../../Assets/Img56.Png';
import Img57 from '../../Assets/Img57.Png';
import Img58 from '../../Assets/Img58.Png';
import Img59 from '../../Assets/Img59.Png';
import Img60 from '../../Assets/Img60.Png';
import Img61 from '../../Assets/Img61.Png';
import Img62 from '../../Assets/Img62.Png';
import Img63 from '../../Assets/Img63.Png';
import Img64 from '../../Assets/Img64.Png';
import Img65 from '../../Assets/Img65.Png';
import Img66 from '../../Assets/Img66.Png';
import Img67 from '../../Assets/Img67.Png';
import Img68 from '../../Assets/Img68.Png';
import Img69 from '../../Assets/Img69.Png';
import Img70 from '../../Assets/Img70.Png';
import Img71 from '../../Assets/Img71.Png';
import Img73 from '../../Assets/Img73.Png';
import Img74 from '../../Assets/Img74.Png';
import Img75 from '../../Assets/Img75.Png';
import Img76 from '../../Assets/Img76.Png';
import Img77 from '../../Assets/Img77.Png';
import Img78 from '../../Assets/Img78.Png';
import Img80 from '../../Assets/Img80.Png';
import Card from '../../Assets/Img_6.Png';

// --- Анимации ---
const animationStyles = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(15px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

// --- Тексты (вынесены для удобства перевода/редактирования) ---
const TEXT = {
    pageTitle: 'Моя команда',
    marketTitle: 'Трансферний ринок',
    addPlayer: 'Додати гравця',
    sellerLabel: 'Продавець:',
    buyButton: 'Купити',
    sellButton: 'Продати',
    priceUnit: '', // можно указать валюту/символ, например '₴' или '⚽'
    altCardBg: (name) => `${name} — фон картки`,
    altAvatar: (name) => `${name} — аватар`,
    altFlag: (name) => `${name} — прапор`,
    altStatIcon: (statIndex) => `Іконка показника ${statIndex}`,
    addPlayerTitle: 'Додати нового гравця до команди',
};

// --- Утилиты ---
function formatPrice(value) {
    try {
        // форматируем число с пробелами как разделителями тысяч
        return new Intl.NumberFormat('uk-UA').format(value) + (TEXT.priceUnit ? ` ${TEXT.priceUnit}` : '');
    } catch (e) {
        return String(value);
    }
}

// --- Данные игроков ---
const playersData = [
    { id: 1, name: 'Іван Занько', position: 'Нападник', seller: '@Joe33', price: 1500, stats: { value1: 61, value2: 5 }, images: { cardBackground: Img55, cdm: Card, avatar: Img59, flag: Img60, stat1Icon: Img56, stat2Icon: Img57, priceIcon: Img58 } },
    { id: 2, name: 'Дмитро Гуц', position: 'Нападник', seller: '@Joe33', price: 1800, stats: { value1: 57, value2: 8 }, images: { cardBackground: Img61, cdm: Card, avatar: Img65, flag: Img66, stat1Icon: Img62, stat2Icon: Img63, priceIcon: Img64 } },
    { id: 3, name: 'Торі Гевер', position: 'Нападник', seller: '@Joe33', price: 4000, stats: { value1: 70, value2: 10 }, images: { cardBackground: Img67, cdm: Card, avatar: Img71, flag: Img73, stat1Icon: Img68, stat2Icon: Img69, priceIcon: Img70 } },
    { id: 4, name: 'Барні Гуц', position: 'Нападник', seller: '@Joe33', price: 2000, stats: { value1: 57, value2: 10 }, images: { cardBackground: Img74, cdm: Card, avatar: Img78, flag: Img80, stat1Icon: Img75, stat2Icon: Img76, priceIcon: Img77 } },
    { id: 5, name: 'Іван Занько', position: 'Нападник', seller: '@Joe33', price: 1500, stats: { value1: 61, value2: 5 }, images: { cardBackground: Img55, cdm: Card, avatar: Img59, flag: Img60, stat1Icon: Img56, stat2Icon: Img57, priceIcon: Img58 } },
    { id: 6, name: 'Дмитро Гуц', position: 'Нападник', seller: '@Joe33', price: 1800, stats: { value1: 57, value2: 8 }, images: { cardBackground: Img61, cdm: Card, avatar: Img65, flag: Img66, stat1Icon: Img62, stat2Icon: Img63, priceIcon: Img64 } },
    { id: 7, name: 'Торі Гевер', position: 'Нападник', seller: '@Joe33', price: 4000, stats: { value1: 70, value2: 10 }, images: { cardBackground: Img67, cdm: Card, avatar: Img71, flag: Img73, stat1Icon: Img68, stat2Icon: Img69, priceIcon: Img70 } },
    { id: 8, name: 'Барні Гуц', position: 'Нападник', seller: '@Joe33', price: 2000, stats: { value1: 57, value2: 10 }, images: { cardBackground: Img74, cdm: Card, avatar: Img78, flag: Img80, stat1Icon: Img75, stat2Icon: Img76, priceIcon: Img77 } },
];

// --- Стили ---
const styles = {
    outerWrapper: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
        fontFamily: 'Inter, sans-serif',
    },
    title: {
        fontSize: 28,
        fontWeight: 800,
        color: 'white',
        textShadow: '0 3px 8px rgba(0,0,0,0.8)',
        letterSpacing: 1,
        marginTop: 0,
    },
    sectionTitle: {
        fontSize: 26,
        fontWeight: 800,
        color: 'white',
        textShadow: '0 3px 8px rgba(0,0,0,0.8)',
        margin: '6px 0 0 0',
    },
    myTeamSection: {
        width: 'calc(188px * 2 + 20px)',
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    gridContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '20px',
        width: 'calc(180px * 2 + 20px)',
        paddingBottom: 110,
    },
    miniCard: {
        width: 188,
        height: 120,
        position: 'relative',
        borderRadius: 15,
        overflow: 'hidden',
        color: 'white',
        boxShadow: '0 6px 18px rgba(0,0,0,0.45)',
        background: 'rgba(0,0,0,0.08)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    },
    miniCardBg: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        zIndex: -1,
        objectFit: 'cover',
    },
    miniAvatar: {
        width: 54,
        height: 58,
        position: 'absolute',
        left: 12,
        top: 12,
        borderRadius: 10,
    },
    miniNameWrap: {
        position: 'absolute',
        left: 80,
        top: 12,
        color: 'white',
        fontWeight: 800,
        fontSize: 14,
        textShadow: '0 2px 4px rgba(0,0,0,0.7)',
    },
    miniPosition: {
        fontSize: 10,
        color: '#ddd',
        fontWeight: 700,
    },
    miniStats: {
        position: 'absolute',
        left: 80,
        top: 46,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        zIndex: 2,
    },
    miniStatItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        fontWeight: 800,
        textShadow: '0 1px 3px rgba(0,0,0,0.7)',
    },
    miniPriceWrap: {
        position: 'absolute',
        left: 12,
        bottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontWeight: 800,
        textShadow: '0 1px 3px rgba(0,0,0,0.7)',
    },
    miniSellButton: {
        position: 'absolute',
        right: 12,
        bottom: 12,
        minWidth: 74,
        height: 30,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(179deg, #fbf21b 0%, #f8ba19 100%)',
        boxShadow: '0 6px 12px rgba(0,0,0,0.35)',
        color: '#111',
        fontWeight: 800,
        cursor: 'pointer',
        fontSize: 12,
        border: '1px solid rgba(0,0,0,0.08)',
        zIndex: 3,
        transition: 'transform 0.2s ease, filter 0.2s ease',
    },
    card: {
        width: 180,
        height: 120,
        position: 'relative',
        borderRadius: 15,
        overflow: 'hidden',
        color: 'white',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: 'pointer',
    },
    cardBackground: { position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, zIndex: -1 },
    avatar: { width: 43, height: 47, left: 11, top: 11, position: 'absolute', borderRadius: 10 },
    textShadow: { textShadow: '0 2px 5px rgba(0, 0, 0, 0.75)' },
    playerInfo: { position: 'absolute', top: 9, left: 60 },
    playerName: { fontSize: 11, fontWeight: '700' },
    playerPosition: { fontSize: 6, color: '#A5A5A5', fontWeight: '700' },
    flag: { width: 11, height: 8, position: 'absolute', top: 13, right: 13, borderRadius: 2 },
    statsContainer: { position: 'absolute', top: 38, left: 60, display: 'flex', alignItems: 'center', gap: 12 },
    statItem: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: '700' },
    sellerInfo: { position: 'absolute', top: 60, left: 60, fontSize: 6, fontWeight: '700' },
    sellerName: { color: '#02fe1f' },
    buySection: { position: 'absolute', bottom: 9, left: 11, display: 'flex', alignItems: 'center' },
    price: { top: '10px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: '700' },
    buyButton: {
        width: 68,
        height: 21,
        background: 'linear-gradient(179deg, #fbf21b 0%, #f8ba19 100%)',
        boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)',
        borderRadius: 10,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'black',
        fontSize: 9,
        fontWeight: '400',
        cursor: 'pointer',
        marginLeft: 15,
        transition: 'transform 0.2s ease, filter 0.2s ease',
        border: 'none',
    },
};

// --- Компоненты ---

const PlayerCard = React.memo(({ player, index }) => {
    const { name, position, seller, price, stats, images } = player;
    const [isHovered, setIsHovered] = useState(false);

    const cardStyle = {
        ...styles.card,
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isHovered ? '0 10px 25px rgba(0,0,0,0.5)' : '0 5px 15px rgba(0,0,0,0.3)',
        opacity: 0,
        animation: `fadeIn 0.5s ease-out forwards`,
        animationDelay: `${index * 0.07}s`,
    };

    const buyButtonStyle = {
        ...styles.buyButton,
        transform: isHovered ? 'scale(1.08)' : 'scale(1)',
        filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
    };

    return (
        <article
            style={cardStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label={`${name} — картка гравця`}
        >
            <img src={images.cardBackground} style={styles.cardBackground} alt={TEXT.altCardBg(name)} />
            <img src={images.avatar} style={styles.avatar} alt={TEXT.altAvatar(name)} />
            <img src={images.flag} style={styles.flag} alt={TEXT.altFlag(name)} />

            <div style={styles.playerInfo}>
                <div style={{ ...styles.playerName, ...styles.textShadow }}>{name}</div>
                <div style={{ ...styles.playerPosition, ...styles.textShadow }}>{position}</div>
            </div>

            <div style={styles.statsContainer}>
                <div style={styles.statItem} title={`Показник: ${stats.value1}`}>
                    <img src={images.stat1Icon} alt={TEXT.altStatIcon(1)} />
                    <span>{stats.value1}</span>
                </div>
                <div style={styles.statItem} title={`Показник: ${stats.value2}`}>
                    <img src={images.stat2Icon} alt={TEXT.altStatIcon(2)} />
                    <span>{stats.value2}</span>
                </div>
            </div>

            <div style={{ ...styles.sellerInfo, ...styles.textShadow }}>
                <span>{TEXT.sellerLabel} </span>
                <span style={styles.sellerName}>{seller ?? '—'}</span>
            </div>

            <div style={styles.buySection}>
                <div style={{ ...styles.price, ...styles.textShadow }} title={`${formatPrice(price)} `}>
                    <img src={images.priceIcon} alt="Price Icon" style={{ position: 'relative', top: 3, left: 5 }} />
                    <span>{formatPrice(price)}</span>
                </div>
                <button
                    type="button"
                    style={buyButtonStyle}
                    aria-label={`${TEXT.buyButton} ${name}`}
                    title={`${TEXT.buyButton} ${name}`}
                    onClick={() => console.log('Купити', player.id)}
                >
                    {TEXT.buyButton}
                </button>
            </div>
        </article>
    );
});

const MiniPlayer = React.memo(({ player }) => {
    const { name, position, price, stats, images } = player;
    const [isHovered, setIsHovered] = useState(false);

    const cardStyle = {
        ...styles.miniCard,
        transform: isHovered ? 'scale(1.04)' : 'scale(1)',
        boxShadow: isHovered ? '0 8px 22px rgba(0,0,0,0.55)' : '0 6px 18px rgba(0,0,0,0.45)',
    };

    const sellButtonStyle = {
        ...styles.miniSellButton,
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
    };

    return (
        <div
            style={cardStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label={`${name} — міні-картка`}
        >
            <img src={images.cdm} style={styles.miniCardBg} alt={TEXT.altCardBg(name)} />
            <img src={images.avatar} style={styles.miniAvatar} alt={TEXT.altAvatar(name)} />

            <div style={styles.miniNameWrap}>
                <div>{name}</div>
                <div style={styles.miniPosition}>{position}</div>
            </div>

            <div style={styles.miniStats}>
                <div style={styles.miniStatItem} title={`Показник: ${stats.value1}`}>
                    <img src={images.stat1Icon} alt={TEXT.altStatIcon(1)} style={{ width: 18, height: 18 }} />
                    <span>{stats.value1}</span>
                </div>
                <div style={styles.miniStatItem} title={`Показник: ${stats.value2}`}>
                    <img src={images.stat2Icon} alt={TEXT.altStatIcon(2)} style={{ width: 18, height: 18 }} />
                    <span>{stats.value2}</span>
                </div>
            </div>

            <div style={styles.miniPriceWrap}>
                <img src={images.priceIcon} alt={`Іконка ціни`} style={{ width: 20, height: 20, position: 'relative', top: 3, left: 5 }} />
                <div>{formatPrice(price)}</div>
            </div>

            <button
                style={sellButtonStyle}
                aria-label={`${TEXT.sellButton} ${name}`}
                title={`${TEXT.sellButton} ${name}`}
                onClick={() => {
                    console.log('Продати Ігрока', player.id);
                }}
                type="button"
            >
                {TEXT.sellButton}
            </button>
        </div>
    );
});

export default function TransferOption() {
    const firstPlayer = playersData[0];

    return (
        <section style={styles.outerWrapper} aria-label="Трансферний інтерфейс">
            <style>{animationStyles}</style>

            <h2 style={styles.title}>{TEXT.pageTitle}</h2>

            <div style={styles.myTeamSection}>
                <MiniPlayer player={firstPlayer} />
                <div
                    role="button"
                    tabIndex={0}
                    title={TEXT.addPlayerTitle}
                    style={{
                        width: 188, height: 120, borderRadius: 15,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)', color: '#F1F1F1',
                        fontWeight: 800, textTransform: 'uppercase', fontSize: 14, textAlign: 'center',
                        cursor: 'pointer',
                    }}
                    onClick={() => console.log('Додати гравця')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') console.log('Додати гравця'); }}
                    aria-label={TEXT.addPlayer}
                >
                    <div>{TEXT.addPlayer}</div>
                </div>
            </div>

            <h3 style={styles.sectionTitle}>{TEXT.marketTitle}</h3>

            <div style={styles.gridContainer}>
                {playersData.map((player, index) => (
                    <PlayerCard key={player.id} player={player} index={index} />
                ))}
            </div>
        </section>
    );
}
