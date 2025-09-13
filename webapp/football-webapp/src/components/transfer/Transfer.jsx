import React from 'react';

// Импорты всех картинок
import img55 from '../../assets/img55.png';
import img56 from '../../assets/img56.png';
import img57 from '../../assets/img57.png';
import img58 from '../../assets/img58.png';
import img59 from '../../assets/img59.png';
import img60 from '../../assets/img60.png';

import img61 from '../../assets/img61.png';
import img62 from '../../assets/img62.png';
import img63 from '../../assets/img63.png';
import img64 from '../../assets/img64.png';
import img65 from '../../assets/img65.png';
import img66 from '../../assets/img66.png';

import img67 from '../../assets/img67.png';
import img68 from '../../assets/img68.png';
import img69 from '../../assets/img69.png';
import img70 from '../../assets/img70.png';
import img71 from '../../assets/img71.png';
import img73 from '../../assets/img73.png';

import img74 from '../../assets/img74.png';
import img75 from '../../assets/img75.png';
import img76 from '../../assets/img76.png';
import img77 from '../../assets/img77.png';
import img78 from '../../assets/img78.png';
import img80 from '../../assets/img80.png';
import card from '../../assets/img_6.png';
// Данные игроков
const playersData = [
    { id: 1, name: 'Іван Занько', position: 'Нападник', seller: '@joe33', price: 1500, stats: { value1: 61, value2: 5 }, images: { cardBackground: img55, cdm: card, avatar: img59, flag: img60, stat1Icon: img56, stat2Icon: img57, priceIcon: img58 } },
    { id: 2, name: 'Дмитро Гуц', position: 'Нападник', seller: '@joe33', price: 1800, stats: { value1: 57, value2: 8 }, images: { cardBackground: img61, cdm: card, avatar: img65, flag: img66, stat1Icon: img62, stat2Icon: img63, priceIcon: img64 } },
    { id: 3, name: 'Торі Гевер', position: 'Нападник', seller: '@joe33', price: 4000, stats: { value1: 70, value2: 10 }, images: { cardBackground: img67, cdm: card, avatar: img71, flag: img73, stat1Icon: img68, stat2Icon: img69, priceIcon: img70 } },
    { id: 4, name: 'Барні Гуц', position: 'Нападник', seller: '@joe33', price: 2000, stats: { value1: 57, value2: 10 }, images: { cardBackground: img74, cdm: card, avatar: img78, flag: img80, stat1Icon: img75, stat2Icon: img76, priceIcon: img77 } },
    { id: 5, name: 'Іван Занько', position: 'Нападник', seller: '@joe33', price: 1500, stats: { value1: 61, value2: 5 }, images: { cardBackground: img55,cdm: card, avatar: img59, flag: img60, stat1Icon: img56, stat2Icon: img57, priceIcon: img58 } },
    { id: 6, name: 'Дмитро Гуц', position: 'Нападник', seller: '@joe33', price: 1800, stats: { value1: 57, value2: 8 }, images: { cardBackground: img61,cdm: card, avatar: img65, flag: img66, stat1Icon: img62, stat2Icon: img63, priceIcon: img64 } },
    { id: 7, name: 'Торі Гевер', position: 'Нападник', seller: '@joe33', price: 4000, stats: { value1: 70, value2: 10 }, images: { cardBackground: img67,cdm: card, avatar: img71, flag: img73, stat1Icon: img68, stat2Icon: img69, priceIcon: img70 } },
    { id: 8, name: 'Барні Гуц', position: 'Нападник', seller: '@joe33', price: 2000, stats: { value1: 57, value2: 10 }, images: { cardBackground: img74,cdm: card, avatar: img78, flag: img80, stat1Icon: img75, stat2Icon: img76, priceIcon: img77 } },
];

// Стили
const styles = {
    outerWrapper: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 18,
    },
    myTeamTitle: {
        fontSize: 28,
        fontWeight: 800,
        color: 'white',
        textShadow: '0px 3px 6px rgba(0,0,0,0.75)',
        letterSpacing: 1,
        marginTop: 0,
    },
    myTeamSection: {
        width: 'calc(180px * 2 + 20px)',
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },

    // мини-карта
    miniCard: {
        width: 188,
        height: 120,
        position: 'relative',
        borderRadius: 15,
        overflow: 'hidden',
        color: 'white',
        fontFamily: 'Inter, sans-serif',
        boxShadow: '0 6px 18px rgba(0,0,0,0.45)',
        background: 'rgba(0,0,0,0.08)',
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
        textShadow: '0 2px 4px rgba(0,0,0,0.6)',
    },
    miniPosition: {
        fontSize: 10,
        color: '#ddd',
        fontWeight: 700,
    },
    // поднял статы выше (чтобы не конфликтовали с аватаром/кнопкой)
    miniStats: {
        position: 'absolute',
        left: 80,
        top: 46,          // <-- moved up (was bottom-based)
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
        color: 'white',
        textShadow: '0 1px 3px rgba(0,0,0,0.6)',
    },
    miniPriceWrap: {
        position: 'absolute',
        left: 12,
        bottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontWeight: 800,
        color: 'white',
        textShadow: '0 1px 3px rgba(0,0,0,0.6)',
    },
    // кнопка ПРОДАТИ — теперь в стиле основной кнопки (градиент, тень)
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
        background: 'linear-gradient(179deg, #FBF21B 0%, #F8BA19 100%)', // same as main buy
        boxShadow: '0px 6px 12px rgba(0,0,0,0.35)',
        color: '#111',
        fontWeight: 800,
        cursor: 'pointer',
        fontSize: 12,
        border: '1px solid rgba(0,0,0,0.08)',
        zIndex: 3,
    },

    // большие карточки (как были)
    card: {
        width: 180,
        height: 120,
        position: 'relative',
        borderRadius: 15,
        overflow: 'hidden',
        color: 'white',
        fontFamily: 'Inter, sans-serif',
    },
    cardBackground: { position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, zIndex: -1 },
    avatar: { width: 43, height: 47, left: 11, top: 11, position: 'absolute', borderRadius: 10 },
    textShadow: { textShadow: '2px 2px 4px rgba(0, 0, 0, 0.50)' },
    playerInfo: { position: 'absolute', top: 9, left: 60 },
    playerName: { fontSize: 11, fontWeight: '700' },
    playerPosition: { fontSize: 6, color: '#A5A5A5', fontWeight: '700' },
    flag: { width: 11, height: 8, position: 'absolute', top: 13, right: 13, borderRadius: 2 },
    statsContainer: { position: 'absolute', top: 38, left: 60, display: 'flex', alignItems: 'center', gap: 12 },
    statItem: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: '700' },
    sellerInfo: { position: 'absolute', top: 60, left: 60, fontSize: 6, fontWeight: '700' },
    sellerName: { color: '#02FE1F' },
    buySection: { position: 'absolute', bottom: 9, left: 11, display: 'flex', alignItems: 'center' },
    price: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: '700' },
    buyButton: {
        width: 68, height: 21,
        background: 'linear-gradient(179deg, #FBF21B 0%, #F8BA19 100%)',
        boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
        borderRadius: 10, display: 'flex', justifyContent: 'center', alignItems: 'center',
        color: 'black', fontSize: 9, fontWeight: '400', cursor: 'pointer', marginLeft: 15
    },
    gridContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '20px',
        padding: '10px',
        width: 'calc(180px * 2 + 20px)',
        background: 'rgba(255, 255, 255, 0)',
        marginTop: 6,
        paddingBottom: 110,
    }
};

// Основной PlayerCard (как раньше)
function PlayerCard({ player, overrideStyle }) {
    const { name, position, seller, price, stats, images } = player;
    return (
        <div style={{ ...styles.card, ...overrideStyle }}>
            <img src={images.cardBackground} style={styles.cardBackground} alt={`${name} background`} />
            <img src={images.avatar} style={styles.avatar} alt={`${name} avatar`} />
            <img src={images.flag} style={styles.flag} alt="flag" />

            <div style={styles.playerInfo}>
                <div style={{ ...styles.playerName, ...styles.textShadow }}>{name}</div>
                <div style={{ ...styles.playerPosition, ...styles.textShadow }}>{position}</div>
            </div>

            <div style={styles.statsContainer}>
                <div style={styles.statItem}>
                    <img src={images.stat1Icon} alt="stat icon" />
                    <span>{stats.value1}</span>
                </div>
                <div style={styles.statItem}>
                    <img src={images.stat2Icon} alt="stat icon" />
                    <span>{stats.value2}</span>
                </div>
            </div>

            <div style={{ ...styles.sellerInfo, ...styles.textShadow }}>
                <span>Продавець: </span>
                <span style={styles.sellerName}>{seller}</span>
            </div>

            <div style={styles.buySection}>
                <div style={{ ...styles.price, ...styles.textShadow }}>
                    <img src={images.priceIcon} alt="price icon" />
                    <span>{price}</span>
                </div>
                <div style={styles.buyButton}>КУПИТИ</div>
            </div>
        </div>
    );
}

// Мини-карта с кнопкой ПРОДАТИ и показом статов (обновлено)
function MiniPlayer({ player }) {
    const { name, position, price, stats, images } = player;
    return (
        <div style={styles.miniCard}>
            <img src={images.cdm} style={styles.miniCardBg} alt="mini bg" />

            <img src={images.avatar} style={styles.miniAvatar} alt={`${name} avatar`} />

            <div style={styles.miniNameWrap}>
                <div>{name}</div>
                <div style={styles.miniPosition}>{position}</div>
            </div>

            {/* Поднял статы вверх, чтобы не конфликтовали */}
            <div style={styles.miniStats}>
                <div style={styles.miniStatItem}>
                    <img src={images.stat1Icon} alt="stat1" style={{ width: 18, height: 18 }} />
                    <span>{stats.value1}</span>
                </div>
                <div style={styles.miniStatItem}>
                    <img src={images.stat2Icon} alt="stat2" style={{ width: 18, height: 18 }} />
                    <span>{stats.value2}</span>
                </div>
            </div>

            <div style={styles.miniPriceWrap}>
                <img src={images.priceIcon} alt="coin" style={{ width: 20, height: 20 }} />
                <div>{price}</div>
            </div>

            {/* Кнопка ПРОДАТИ в общем стиле (градиент как у основной кнопки) */}
            <button
                style={styles.miniSellButton}
                onClick={() => {
                    // TODO: логика продажи (модал/API) — заменяй на нужный обработчик
                    console.log('Продать игрока', player.id);
                }}
            >
                ПРОДАТИ
            </button>
        </div>
    );
}

// Основной компонент страницы
export default function TransferOption() {
    const firstPlayer = playersData[0];

    return (
        <div style={styles.outerWrapper}>
            <h2 style={styles.myTeamTitle}>МОЯ КОМАНДА</h2>

            <div style={styles.myTeamSection}>
                <MiniPlayer player={firstPlayer} />
                <div style={{
                    width: 188, height: 120, borderRadius: 15,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)', color: '#f1f1f1',
                    fontWeight: 800, textTransform: 'uppercase', fontSize: 14
                }}>
                    <div>ДОДАТИ<br />ГРАВЦЯ</div>
                </div>
            </div>

            <h3 style={{ fontSize: 26, fontWeight: 800, color: 'white', textShadow: '0px 3px 6px rgba(0,0,0,0.75)', margin: '6px 0 0 0' }}>
                ТРАНСФЕРНИЙ РИНОК
            </h3>

            <div style={styles.gridContainer}>
                {playersData.map(player => (
                    <PlayerCard key={player.id} player={player} />
                ))}
            </div>
        </div>
    );
}
