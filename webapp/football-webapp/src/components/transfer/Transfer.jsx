import React, {useState, useEffect} from 'react';

// --- Імпорты всех картинок ---
import Img55 from '../../assets/public/img55.png';
import Img56 from '../../assets/public/img56.png';
import Img57 from '../../assets/public/img57.png';
import Img58 from '../../assets/public/img58.png';
import Img59 from '../../assets/public/img59.png';
import Img60 from '../../assets/public/img60.png';
import Img61 from '../../assets/public/img61.png';
import Img62 from '../../assets/public/img62.png';
import Img63 from '../../assets/public/img63.png';
import Img64 from '../../assets/public/img64.png';
import Img65 from '../../assets/public/img65.png';
import Img66 from '../../assets/public/img66.png';
import Img67 from '../../assets/public/img67.png';
import Img68 from '../../assets/public/img68.png';
import Img69 from '../../assets/public/img69.png';
import Img70 from '../../assets/public/img70.png';
import Img71 from '../../assets/public/img71.png';
import Img73 from '../../assets/public/img73.png';
import Img74 from '../../assets/public/img74.png';
import Img75 from '../../assets/public/img75.png';
import Img76 from '../../assets/public/img76.png';
import Img77 from '../../assets/public/img77.png';
import Img78 from '../../assets/public/img78.png';
import Img80 from '../../assets/public/img80.png';
import Card from '../../assets/public/img_6.png';
import {ModalRoot, PlayerModal, SetPriceModal} from "../modal_components/ModalComponents.jsx";
import {instantSellPlayer, postPlayerToTransfer, removePlayerFromTransfer} from "../../api.js";

// --- Вспомогательный массив со всеми импортами для удобства ---
// Это "костыль", необходимый, так как бэкенд не отдает URL картинок.
// В идеале, бэкенд должен присылать ссылки на изображения для каждого игрока.
const ALL_IMAGES = {
    playerSets: [
        {cardBackground: Img55, avatar: Img59, flag: Img60, stat1Icon: Img56, stat2Icon: Img57, priceIcon: Img58},
        {cardBackground: Img61, avatar: Img65, flag: Img66, stat1Icon: Img62, stat2Icon: Img63, priceIcon: Img64},
        {cardBackground: Img67, avatar: Img71, flag: Img73, stat1Icon: Img68, stat2Icon: Img69, priceIcon: Img70},
        {cardBackground: Img74, avatar: Img78, flag: Img80, stat1Icon: Img75, stat2Icon: Img76, priceIcon: Img77},
    ],
    genericCdm: Card,
};

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

// --- Тексты ---
const TEXT = {
    pageTitle: 'Моя команда',
    marketTitle: 'Трансферний ринок',
    freeAgentsTitle: 'Вільні агенти',
    addPlayer: 'Додати гравця',
    sellerLabel: 'Продавець:',
    buyButton: 'Купити',
    sellButton: 'Продати',
    priceUnit: '',
    loading: 'Завантаження ринку...',
    error: 'Не вдалося завантажити дані. Спробуйте пізніше.',
    altCardBg: (name) => `${name} — фон картки`,
    altAvatar: (name) => `${name} — аватар`,
    altFlag: (name) => `${name} — прапор`,
    altStatIcon: (statIndex) => `Іконка показника ${statIndex}`,
    addPlayerTitle: 'Додати нового гравця до команди',
    noPlayersInTeam: 'У вас немає гравців',
};

// --- Утилиты ---
// Универсальная версия formatPrice
function formatPrice(value, {precision = 0, mode = 'round', nearest = 1} = {}) {
    // безопасно приводим к числу
    if (typeof value !== 'number') value = Number(value);
    if (!isFinite(value)) return String(value);

    // проверим mode
    const allowed = {round: Math.round, floor: Math.floor, ceil: Math.ceil};
    const fn = allowed[mode] || Math.round;

    let rounded;
    if (nearest && Math.abs(nearest) > 1) {
        // округление к ближайшему N (например nearest = 100)
        rounded = fn(value / nearest) * nearest;
        // при таком округлении дробная точность = 0
        precision = 0;
    } else {
        // округление до precision знаков после запятой
        const factor = Math.pow(10, precision);
        rounded = fn(value * factor) / factor;
    }

    // форматируем с нужным количеством дробных знаков (для украинизированной локали)
    const nf = new Intl.NumberFormat('uk-UA', {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
    });

    return nf.format(rounded) + (TEXT.priceUnit ? ` ${TEXT.priceUnit}` : '');
}

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
        width: 'calc(188px * 2 + 16px)',
        gridTemplateColumns: 'repeat(2, 1fr)',
        display: 'grid',
        gap: 16,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    gridContainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '20px',
        width: 'calc(180px * 2 + 20px)',
        paddingBottom: 60,
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
    cardBackground: {position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, zIndex: -1},
    avatar: {width: 43, height: 47, left: 11, top: 11, position: 'absolute', borderRadius: 10},
    textShadow: {textShadow: '0 2px 5px rgba(0, 0, 0, 0.75)'},
    playerInfo: {position: 'absolute', top: 9, left: 60},
    playerName: {fontSize: 11, fontWeight: '700'},
    playerPosition: {fontSize: 6, color: '#A5A5A5', fontWeight: '700'},
    flag: {width: 11, height: 8, position: 'absolute', top: 13, right: 13, borderRadius: 2},
    statsContainer: {position: 'absolute', top: 38, left: 60, display: 'flex', alignItems: 'center', gap: 12},
    statItem: {display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: '700'},
    sellerInfo: {position: 'absolute', top: 60, left: 60, fontSize: 6, fontWeight: '700'},
    sellerName: {color: '#02fe1f'},
    buySection: {position: 'absolute', bottom: 9, left: 11, display: 'flex', alignItems: 'center'},
    price: {top: '10px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: '700'},
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

const PlayerCard = React.memo(({player, index, onCardClick}) => {
    const {name, position, seller, price, stats, images} = player;
    const [isHovered, setIsHovered] = useState(false);

    const cardStyle = {
        ...styles.card,
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isHovered ? '0 10px 25px rgba(0,0,0,0.5)' : '0 5px 15px rgba(0,0,0,0.3)',
        opacity: 0,
        animation: `fadeIn 0.5s ease-out forwards`,
        animationDelay: `${index * 0.07}s`,
        cursor: 'pointer',
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
            // --- ДОДАНО: Обробник кліку ---
            onClick={() => onCardClick(player)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter') onCardClick(player);
            }}
        >
            <img src={images.cardBackground} style={styles.cardBackground} alt={TEXT.altCardBg(name)}/>
            <img src={images.avatar} style={styles.avatar} alt={TEXT.altAvatar(name)}/>
            <img src={images.flag} style={styles.flag} alt={TEXT.altFlag(name)}/>

            <div style={styles.playerInfo}>
                <div style={{...styles.playerName, ...styles.textShadow}}>{name}</div>
                <div style={{...styles.playerPosition, ...styles.textShadow}}>{position}</div>
            </div>

            <div style={styles.statsContainer}>
                <div style={styles.statItem} title={`Показник: ${stats.value1}`}>
                    <img src={images.stat1Icon} alt={TEXT.altStatIcon(1)}/>
                    <span>{stats.value1}</span>
                </div>
                <div style={styles.statItem} title={`Показник: ${stats.value2}`}>
                    <img src={images.stat2Icon} alt={TEXT.altStatIcon(2)}/>
                    <span>{stats.value2}</span>
                </div>
            </div>

            <div style={{...styles.sellerInfo, ...styles.textShadow}}>
                <span>{TEXT.sellerLabel} </span>
                <span style={styles.sellerName}>{seller ?? '—'}</span>
            </div>

            <div style={styles.buySection}>
                <div style={{...styles.price, ...styles.textShadow}} title={`${formatPrice(price)} `}>
                    <img src={images.priceIcon} alt="Price Icon" style={{position: 'relative', top: 3, left: 5}}/>
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

const MiniPlayer = React.memo(({player, onCardClick}) => {
    const {name, position, price, stats, images} = player;
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
            onClick={() => onCardClick(player)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label={`${name} — міні-картка`}
        >
            <img src={images.cdm} style={styles.miniCardBg} alt={TEXT.altCardBg(name)}/>
            <img src={images.avatar} style={styles.miniAvatar} alt={TEXT.altAvatar(name)}/>

            <div style={styles.miniNameWrap}>
                <div>{name}</div>
                <div style={styles.miniPosition}>{position}</div>
            </div>

            <div style={styles.miniStats}>
                <div style={styles.miniStatItem} title={`Показник: ${stats.value1}`}>
                    <img src={images.stat1Icon} alt={TEXT.altStatIcon(1)} style={{width: 18, height: 18}}/>
                    <span>{stats.value1}</span>
                </div>
                <div style={styles.miniStatItem} title={`Показник: ${stats.value2}`}>
                    <img src={images.stat2Icon} alt={TEXT.altStatIcon(2)} style={{width: 18, height: 18}}/>
                    <span>{stats.value2}</span>
                </div>
            </div>

            <div style={styles.miniPriceWrap}>
                <img src={images.priceIcon} alt={`Іконка ціни`}
                     style={{width: 20, height: 20, position: 'relative', top: 3, left: 5}}/>
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


// --- Основной компонент с логикой загрузки данных ---
// --- Основной компонент с логикой загрузки данных ---
export default function TransferOption({user}) {
    // ВАЖЛИВО: Замініть це значення на ID поточного авторизованого користувача

    const [myTeam, setMyTeam] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [freeAgents, setFreeAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // --- ДОДАНО: Стан для керування модальним вікном ---
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    // 'closed', 'details', 'setPrice'
    const [modalView, setModalView] = useState('closed');
    // Для блокування кнопок під час запитів
    const [isProcessing, setIsProcessing] = useState(false);

    /**
     * Преобразует данные трансфера из API в формат для PlayerCard.
     */
    const mapTransferToCard = (apiItem, index) => {
        const character = apiItem.character;
        if (!character) return null;

        const imageSet = ALL_IMAGES.playerSets[index % ALL_IMAGES.playerSets.length];

        return {
            id: apiItem.id,
            characterId: character.id,
            name: character.name || 'Невідомий гравець',
            position: 'Нападник',
            seller: character.owner?.username || 'Система',
            price: apiItem.price,
            age: character.age,
            power: Math.round(character.power || 0),
            talent: character.talent,
            stats: {
                value1: Math.round(character.power || 0),
                value2: character.talent || 0
            },
            images: {...imageSet, cdm: ALL_IMAGES.genericCdm}
        };
    };

    /**
     * Преобразует данные персонажа з API в формат для MiniPlayer.
     */
    const mapCharacterToCard = (character, index) => {
        if (!character) return null;

        const imageSet = ALL_IMAGES.playerSets[index % ALL_IMAGES.playerSets.length];

        return {
            ...character,
            id: character.id, // Використовуємо ID персонажа, оскільки ID трансфера тут немає
            characterId: character.id,
            name: character.name || 'Невідомий гравець',
            position: 'Нападник',
            age: character.age,
            power: Math.round(character.power || 0),
            talent: character.talent,
            // У персонажа є розрахункова вартість, а не ціна з ринку
            price: character.character_price || 0, // Припускаємо, що character_to_dict повертає це поле
            stats: {
                value1: Math.round(character.power || 0),
                value2: character.talent || 0
            },
            images: {...imageSet, cdm: ALL_IMAGES.genericCdm}
        }
    }
    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [myTeamResponse, transfersResponse, freeAgentsResponse] = await Promise.all([
                fetch(`http://localhost:8123/characters/by-user/${user.user_id}`), // Новий запит
                fetch('http://localhost:8123/transfers'),
                fetch('http://localhost:8123/transfers/free_agents')
            ]);

            if (!myTeamResponse.ok || !transfersResponse.ok || !freeAgentsResponse.ok) {
                throw new Error('Помилка мережі при завантаженні даних');
            }

            const myTeamData = await myTeamResponse.json();
            const transfersData = await transfersResponse.json();
            const freeAgentsData = await freeAgentsResponse.json();

            setMyTeam(myTeamData.map(mapCharacterToCard).filter(Boolean));
            setTransfers(transfersData.map(mapTransferToCard).filter(Boolean));
            setFreeAgents(freeAgentsData.map(mapTransferToCard).filter(Boolean));

        } catch (err) {
            console.error("Fetch error:", err);
            setError(TEXT.error);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {

        fetchData();
    }, [user.user_id]); // Додаємо ID як залежність, щоб перезавантажити дані при зміні користувача
    // --- ДОДАНО: Функції для відкриття та закриття модального вікна ---
    const handleOpenModal = (player) => {
        setSelectedPlayer(player);
    };

    const handleCloseModal = () => {
        setSelectedPlayer(null);
    };

    const handleBuyPlayer = () => {
        if (!selectedPlayer) return;
        console.log(`Купуємо гравця (з модального вікна): ID ${selectedPlayer.id}`);
        // Тут буде ваша логіка покупки
        handleCloseModal(); // Закриваємо вікно після дії
    };
    // --- Функція закриття всіх модальних вікон ---
    const closeModal = () => {
        setSelectedPlayer(null);
        setModalView('closed');
    };

    // --- Обробники кліків по картках ---
    const handleMarketPlayerClick = (player) => {
        setSelectedPlayer(player);
        setModalView('details');
    };

    const handleMyPlayerClick = (player) => {
        setSelectedPlayer(player);
        setModalView('details');
    };

    // --- ЛОГІКА РОБОТИ З API ---
    const handleSellConfirm = async (price) => {
        if (!selectedPlayer) return;
        setIsProcessing(true);
        try {
            await postPlayerToTransfer(selectedPlayer.id, price);
            await fetchData(); // Оновлюємо дані після успішної операції
            closeModal();
        } catch (error) {
            console.error("Помилка продажу гравця:", error);
            alert(error.message); // Показати помилку користувачу
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemoveFromSale = async () => {
        if (!selectedPlayer || !selectedPlayer.transfer) return;
        setIsProcessing(true);
        try {
            await removePlayerFromTransfer(selectedPlayer.transfer.id);
            await fetchData(); // Оновлюємо дані
            closeModal();
        } catch (error) {
            console.error("Помилка зняття з трансферу:", error);
            alert(error.message);
        } finally {
            setIsProcessing(false);
        }
    };
    // --- ✨ НОВА ФУНКЦІЯ: ОБРОБНИК МОМЕНТАЛЬНОГО ПРОДАЖУ ✨ ---
    const handleInstantSell = async () => {
        if (!selectedPlayer) return;

        // Додаємо підтвердження, оскільки дія незворотня
        const isConfirmed = window.confirm(
            `Ви впевнені, що хочете моментально продати ${selectedPlayer.name} за ${selectedPlayer.price.toLocaleString('uk-UA')} монет? Ця дія незворотня.`
        );

        if (!isConfirmed) {
            return;
        }

        setIsProcessing(true);
        try {
            const result = await instantSellPlayer(selectedPlayer.id);
            console.log("Гравець моментально проданий:", result);
            alert(result.message); // Повідомляємо користувача про успіх
            await fetchData();   // Оновлюємо всі дані
            closeModal();        // Закриваємо модальне вікно
        } catch (error) {
            console.error("Помилка моментального продажу:", error);
            alert(error.message); // Показуємо помилку
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return <div style={{...styles.title, textAlign: 'center'}}>{TEXT.loading}</div>;
    }

    if (error) {
        return <div style={{...styles.title, textAlign: 'center', color: '#ff6b6b'}}>{error}</div>;
    }

    return (
        <section style={styles.outerWrapper} aria-label="Трансферний інтерфейс">
            <style>{animationStyles}</style>
            {/* --- ДОДАНО: Рендер модального вікна, якщо гравець вибраний --- */}
            {selectedPlayer && (
                <ModalRoot>
                    <PlayerModal
                        player={selectedPlayer}
                        onClose={handleCloseModal}
                        onBuy={handleBuyPlayer}
                        onSell={() => console.log('Продаж з модального вікна не реалізовано')}
                    />
                </ModalRoot>
            )}

            <h2 style={styles.title}>{TEXT.pageTitle}</h2>

            {/* --- НАЧАЛО ИЗМЕНЕНИЙ В JSX --- */}
            <div style={styles.myTeamSection}>
                {myTeam.length > 0
                    ? myTeam.map(player => <MiniPlayer key={player.characterId} player={player} onCardClick={handleMyPlayerClick} />)
                    // Если игроков нет, можно ничего не выводить, т.к. кнопка добавления будет всегда
                    : null
                }

                {/* Кнопка "Додати гравця" теперь является элементом сетки */}
                <div
                    role="button"
                    tabIndex={0}
                    title={TEXT.addPlayerTitle}
                    style={{
                        width: 188, height: 120, borderRadius: 15,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.2), rgba(255,255,255,0.2))',
                        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)', color: '#F1F1F1',
                        fontWeight: 800, textTransform: 'uppercase', fontSize: 14, textAlign: 'center',
                        cursor: 'pointer', flexShrink: 0
                    }}
                    onClick={() => console.log('Додати гравця')}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') console.log('Додати гравця');
                    }}
                    aria-label={TEXT.addPlayer}
                >
                    <div>{TEXT.addPlayer}</div>
                </div>
            </div>
            {/* --- КОНЕЦ ИЗМЕНЕНИЙ В JSX --- */}
            {/* --- БЛОК УМОВНОГО РЕНДЕРИНГУ МОДАЛЬНИХ ВІКОН --- */}
            {modalView === 'details' && selectedPlayer && (
                <ModalRoot>
                    <PlayerModal
                        player={selectedPlayer}
                        isOwner={selectedPlayer.owner?.user_id === user.user_id}
                        onClose={closeModal}
                        isProcessing={isProcessing}
                        onInstantSell={handleInstantSell}
                        // Для гравців з ринку
                        onBuy={() => console.log("Купити гравця:", selectedPlayer.id)}
                        // Для своїх гравців
                        onSell={() => setModalView('setPrice')} // Перехід до вікна встановлення ціни
                        onRemoveFromSale={handleRemoveFromSale}
                    />
                </ModalRoot>
            )}

            {modalView === 'setPrice' && selectedPlayer && (
                <ModalRoot>
                    <SetPriceModal
                        minPrice={Math.round(selectedPlayer.price * 0.7)}
                        initialPrice={Math.round(selectedPlayer.price * 0.7)}
                        maxPrice={100000000} // Можна встановити динамічно
                        onClose={closeModal}
                        onBack={() => setModalView('details')} // Повернення до деталей
                        onConfirm={handleSellConfirm}
                        isProcessing={isProcessing}
                    />
                </ModalRoot>
            )}


            <h3 style={styles.sectionTitle}>{TEXT.marketTitle}</h3>
            <div style={styles.gridContainer}>
                {transfers.map((player, index) => (
                    <PlayerCard key={player.id} player={player} index={index} onCardClick={handleOpenModal}/>
                ))}
            </div>

            {freeAgents.length > 0 && (
                <>
                    <h3 style={styles.sectionTitle}>{TEXT.freeAgentsTitle}</h3>
                    <div style={styles.gridContainer}>
                        {freeAgents.map((player, index) => (
                            <PlayerCard key={player.id} player={player} index={transfers.length + index}
                                        onCardClick={handleOpenModal}/>
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
