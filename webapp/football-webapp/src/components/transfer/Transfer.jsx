import React, {useState, useEffect, useMemo, useCallback} from 'react';

// --- Imports (Images) ---
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
import styles from '../../css_files/trasfer/Transfer.module.css';
import {ModalRoot, PlayerModal, SetPriceModal} from "../modal_components/ModalComponents.jsx";
import {
    API_BASE_URL,
    buyPlayerFromTransfer,
    instantSellPlayer,
    postPlayerToTransfer,
    removePlayerFromTransfer
} from "../../api.js";
import {showAlert} from "../../alertService.jsx";

// --- Constants & Config ---
const ALL_IMAGES = {
    playerSets: [
        { cardBackground: Img55, avatar: Img59, flag: Img60, stat1Icon: Img56, stat2Icon: Img57, priceIcon: Img58 },
        { cardBackground: Img61, avatar: Img65, flag: Img66, stat1Icon: Img62, stat2Icon: Img63, priceIcon: Img64 },
        { cardBackground: Img67, avatar: Img71, flag: Img73, stat1Icon: Img68, stat2Icon: Img69, priceIcon: Img70 },
        { cardBackground: Img74, avatar: Img78, flag: Img80, stat1Icon: Img75, stat2Icon: Img76, priceIcon: Img77 },
    ],
    genericCdm: Card,
};

const TEXTS = {
    pageTitle: 'Трансферний центр',
    tabTransfers: 'Трансферний ринок',
    tabAgents: 'Вільні агенти',
    myTeamSection: 'Моя команда',
    marketSection: 'Ринок гравців',
    addPlayer: 'Додати',
    sellerLabel: 'Продавець:',
    buyButton: 'Купити',
    sellButton: 'Продати',
    loading: 'Оновлення списків...',
    error: 'Не вдалося завантажити дані. Спробуйте оновити сторінку.',
    addPlayerHint: 'Поповнити команду новим талантом',
    noPlayersInTeam: 'У вашій команді ще немає гравців',
    remove_from_sale: "Зняти",
    refreshTimerLabel: "Оновлення списку через:",
    filterBtn: "Фільтри",
    alt: {
        cardBg: (name) => `Фон картки гравця ${name}`,
        avatar: (name) => `Аватар гравця ${name}`,
        flag: (country) => `Прапор ${country}`,
        statIcon: (name) => `Іконка характеристики ${name}`,
        priceIcon: 'Іконка вартості',
    },
};

// --- Helpers ---
const formatPrice = (value) => {
    if (typeof value !== 'number' || !isFinite(value)) return 'N/A';
    return new Intl.NumberFormat('uk-UA').format(Math.round(value));
};
const getRarityConfig = (rarity) => {
    const r = rarity ? rarity.toUpperCase() : 'STANDARD';
    switch (r) {
        case 'EXCLUSIVE':
            // Фіолетовий неон для ексклюзиву
            return { label: 'EXCLUSIVE', color: '#d500f9', shadowColor: '#9c27b0' };
        case 'RARE':
            // Помаранчевий неон для рідкісного
            return { label: 'RARE', color: '#ff9100', shadowColor: '#e65100' };
        case 'STANDARD':
        default:
            // Світло-сірий (майже білий) для звичайного
            return { label: 'STANDARD', color: '#1b1b1c', shadowColor: '#505050' };
    }
};

// Helper to build query string from filter object
const buildQuery = (filters) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
            params.append(key, value);
        }
    });
    return params.toString();
};

// --- Sub-Components ---

const FilterModal = ({ initialFilters, onClose, onApply }) => {
    const [localFilters, setLocalFilters] = useState(initialFilters);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleApply = () => {
        onApply(localFilters);
    };

    const handleReset = () => {
        const resetState = {
            price_min: '', price_max: '',
            power_min: '', power_max: '',
            talent_min: '', talent_max: '',
            age_min: '', age_max: '',
            position: '',
            rarity: '', // 🔥 ДОДАНО: Скидання рідкості
            sort_by: '', sort_order: 'desc'
        };
        setLocalFilters(resetState);
        onApply(resetState);
    };

    return (
        <div className={styles.filterContainer}>
            <h3 style={{ textAlign: 'center', margin: 0 }}>Фільтри пошуку</h3>

            {/* ... (Ціна, Сила, Талант залишаються без змін) ... */}

            <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Ціна (Min - Max)</label>
                <div className={styles.filterRow}>
                    <input type="number" name="price_min" placeholder="0" value={localFilters.price_min} onChange={handleChange} className={styles.filterInput} />
                    <input type="number" name="price_max" placeholder="Max" value={localFilters.price_max} onChange={handleChange} className={styles.filterInput} />
                </div>
            </div>

            <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Сила</label>
                <div className={styles.filterRow}>
                    <input type="number" name="power_min" placeholder="0" value={localFilters.power_min} onChange={handleChange} className={styles.filterInput} />
                    <input type="number" name="power_max" placeholder="100" value={localFilters.power_max} onChange={handleChange} className={styles.filterInput} />
                </div>
            </div>

            <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Талант</label>
                <div className={styles.filterRow}>
                    <input type="number" name="talent_min" placeholder="0" value={localFilters.talent_min} onChange={handleChange} className={styles.filterInput} />
                    <input type="number" name="talent_max" placeholder="10" value={localFilters.talent_max} onChange={handleChange} className={styles.filterInput} />
                </div>
            </div>

            {/* 🔥 НОВЕ ПОЛЕ: РІДКІСТЬ 🔥 */}
            <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Рідкість</label>
                <select name="rarity" value={localFilters.rarity} onChange={handleChange} className={styles.filterSelect}>
                    <option value="">Всі типи</option>
                    <option value="STANDARD">Standard</option>
                    <option value="RARE">Rare (Рідкісний)</option>
                    <option value="EXCLUSIVE">Exclusive (Ексклюзив)</option>
                </select>
            </div>

            <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Позиція</label>
                <select name="position" value={localFilters.position} onChange={handleChange} className={styles.filterSelect}>
                    <option value="">Всі позиції</option>
                    <option value="GOALKEEPER">Воротар</option>
                    <option value="DEFENDER">Захисник</option>
                    <option value="MIDFIELDER">Півзахисник</option>
                    <option value="ATTACKER">Нападник</option>
                </select>
            </div>

            <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Сортування</label>
                <div className={styles.filterRow}>
                    <select name="sort_by" value={localFilters.sort_by} onChange={handleChange} className={styles.filterSelect}>
                        <option value="">За замовчуванням</option>
                        <option value="price">Ціна</option>
                        <option value="power">Сила</option>
                        <option value="talent">Талант</option>
                        <option value="age">Вік</option>
                        <option value="created_at">Час додавання</option>
                    </select>
                    <select name="sort_order" value={localFilters.sort_order} onChange={handleChange} className={styles.filterSelect} style={{width: '80px'}}>
                        <option value="desc">⬇ 9-0</option>
                        <option value="asc">⬆ 0-9</option>
                    </select>
                </div>
            </div>

            <div className={styles.filterActions}>
                <button className={styles.resetBtn} onClick={handleReset}>Скинути</button>
                <button className={styles.applyBtn} onClick={handleApply}>Застосувати</button>
            </div>
        </div>
    );
};

const CountdownTimer = () => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0);
            const diff = midnight - now;
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);
            const pad = (num) => num.toString().padStart(2, '0');
            return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        };
        const timer = setInterval(() => { setTimeLeft(calculateTimeLeft()); }, 1000);
        setTimeLeft(calculateTimeLeft());
        return () => clearInterval(timer);
    }, []);

    return (
        <div className={styles.timerWrapper}>
            <div className={styles.timerLabel}>{TEXTS.refreshTimerLabel}</div>
            <div className={styles.timerDigits}>{timeLeft}</div>
        </div>
    );
};

const LoadingSpinner = () => (
    <div className={styles.statusContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.statusText}>{TEXTS.loading}</p>
    </div>
);

const ErrorDisplay = ({ message }) => (
    <div className={styles.statusContainer}>
        <p className={`${styles.statusText} ${styles.errorText}`}>{message}</p>
    </div>
);

const SectionHeader = ({ title }) => (
    <h2 className={styles.sectionTitle}>{title}</h2>
);

const AddPlayerCard = ({ onClick }) => (
    <div className={styles.addPlayerCard} onClick={onClick} role="button">
        <span className={styles.addPlayerPlus}>+</span>
        <span className={styles.addPlayerText}>{TEXTS.addPlayer}</span>
    </div>
);

const MiniPlayerCard = React.memo(({ player, onCardClick }) => (
    <article className={styles.miniCard} onClick={() => onCardClick(player)}>
        <img src={player.images.cdm} className={styles.miniCardBg} alt={TEXTS.alt.cardBg(player.name)} />
        <img src={player.images.avatar} className={styles.miniAvatar} alt={TEXTS.alt.avatar(player.name)} />
        <div className={styles.miniInfo}>
            <h4 className={styles.miniName}>{player.name}</h4>
            <p className={styles.miniPosition}>{player.position}</p>
        </div>
        <div className={styles.miniStats}>
            <div><img src={player.images.stat1Icon} alt="" /><span>{player.stats.value1}</span></div>
            <div><img src={player.images.stat2Icon} alt="" /><span>{player.stats.value2}</span></div>
        </div>
        <div className={styles.miniPrice}>
            <img src={player.images.priceIcon} alt="" />
            <span>{formatPrice(player.price)}</span>
        </div>
        <button className={styles.miniSellButton} onClick={(e) => {
            e.stopPropagation();
            onCardClick(player);
        }}>
            {player.transfer ? TEXTS.remove_from_sale : TEXTS.sellButton}
        </button>
    </article>
));

// Импортируйте ваши styles и TEXTS, как обычно

// 1. Создаем красивые иконки для каждой редкости (можно заменить на <img>, если есть картинки)
const RARITY_ICONS = {
    common: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
    ),
    rare: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 12l10 10 10-10L12 2zm0 17l-7-7 7-7 7 7-7 7z"/></svg>
    ),
    epic: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
    ),
    legendary: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11h-5v1h5c.55 0 1 .45 1 1s-.45 1-1 1H5c-.55 0-1-.45-1-1s.45-1 1-1h5v-1H5z"/></svg>
    )
};

const PlayerCard = React.memo(({ player, index, onCardClick }) => {
    const rarityStyle = getRarityConfig(player.rarity);

    // 1. Иконка
    const RarityIcon = RARITY_ICONS[player.rarity.toLowerCase()] || RARITY_ICONS.common;

    // 2. Логика сокращения текста
    const rawRarity = player.rarity.toUpperCase();
    const displayRarity = rawRarity.length > 4
        ? `${rawRarity.slice(0, 4)}.`
        : rawRarity;

    // 3. Проверяем, является ли игрок "обычным" (common)
    const isCommon = player.rarity.toLowerCase() === 'common';

    return (
        <article
            className={styles.playerCard}
            style={{ animationDelay: `${index * 70}ms` }}
            onClick={() => onCardClick(player)}
        >
            <img src={player.images.cardBackground} className={styles.cardBg} alt="" />
            <img src={player.images.avatar} className={styles.cardAvatar} alt="" />
            <img src={player.images.flag} className={styles.cardFlag} alt="" />

            <div className={styles.cardInfo}>
                <h4
                    className={styles.cardName}
                    style={{
                        textShadow: `
                            -1px -1px 0 ${rarityStyle.shadowColor},
                             1px -1px 0 ${rarityStyle.shadowColor},
                            -1px  1px 0 ${rarityStyle.shadowColor},
                             1px  1px 0 ${rarityStyle.shadowColor}
                        `
                    }}
                >
                    {player.name}
                </h4>
                <p className={styles.cardPosition}>{player.position}</p>
            </div>

            <div className={styles.cardStats}>
                <div>
                    <img src={player.images.stat1Icon} alt={TEXTS.alt.statIcon('Сила')} />
                    <span>{player.stats.value1}</span>
                </div>

                <div>
                    <img src={player.images.stat2Icon} alt={TEXTS.alt.statIcon('Талант')} />
                    <span>{player.stats.value2}</span>
                </div>

                {/* ✨ РЕДКОСТЬ */}
                <div
                    style={{
                        color: rarityStyle.textColor || rarityStyle.shadowColor,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        // Жирность убрали, оставили стандартную или наследуемую
                    }}
                >
                    <span className={styles.iconWrapper} style={{ display: 'flex' }}>
                        {RarityIcon}
                    </span>

                    {/* Применяем обводку ТОЛЬКО если isCommon === true */}
                    <span
                        style={{
                            textShadow: isCommon ? `
                                -1px -1px 0 #ffffff,
                                 1px -1px 0 #ffffff,
                                -1px  1px 0 #ffffff,
                                 1px  1px 0 #ffffff
                            ` : 'none'
                        }}
                    >
                        {displayRarity}
                    </span>
                </div>
            </div>

            <p className={styles.cardSeller}>{TEXTS.sellerLabel} <span>{player.seller ?? '—'}</span></p>

            <div className={styles.cardFooter}>
                <div className={styles.cardPrice}>
                    <img src={player.images.priceIcon} alt="" />
                    <span>{formatPrice(player.price)}</span>
                </div>
            </div>
        </article>
    );
});
const MyTeamGrid = ({ team, onPlayerClick, onAddPlayer }) => (
    <div className={styles.myTeamGrid}>
        {team.length > 0 ? (
            team.map(player => <MiniPlayerCard key={player.characterId} player={player} onCardClick={onPlayerClick} />)
        ) : (
            <div className={styles.noPlayersText}>{TEXTS.noPlayersInTeam}</div>
        )}
        <AddPlayerCard onClick={onAddPlayer} />
    </div>
);

const MarketGrid = ({ players, onPlayerClick, startIndex = 0 }) => (
    <div className={styles.marketGrid}>
        {players.map((player, index) => (
            <PlayerCard key={player.id} player={player} index={startIndex + index} onCardClick={onPlayerClick} />
        ))}
    </div>
);

// --- Main Component ---

export default function TransferOption({ user, onUserUpdate }) {
    const [activeTab, setActiveTab] = useState('market'); // 'market' | 'agents'
    const [myTeam, setMyTeam] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [freeAgents, setFreeAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [modalView, setModalView] = useState('closed'); // 'closed' | 'details' | 'setPrice' | 'filters'
    const [isProcessing, setIsProcessing] = useState(false);

    // Filter State
    const [filterParams, setFilterParams] = useState({
        price_min: '', price_max: '',
        power_min: '', power_max: '',
        talent_min: '', talent_max: '',
        age_min: '', age_max: '',
        position: '',
        rarity: '', // 🔥 Додано сюди
        sort_by: '', sort_order: 'desc'
    });

    const userId = user?.user_id;

    // --- Data Fetching ---
    const fetchUser = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/users/${userId}`);
            if (!res.ok) return;
            const userData = await res.json();
            if (onUserUpdate) onUserUpdate(userData);
        } catch (e) {
            console.error("fetchUser error", e);
        }
    };

    // Modified fetchData to accept filters
    const fetchData = useCallback(async (currentFilters = filterParams) => {
        if (!userId) {
            setError("User ID not found.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const queryString = buildQuery(currentFilters);

            // Fetch My Team (always same)
            const myTeamReq = fetch(`${API_BASE_URL}/characters/by-user/${userId}`);

            // Fetch Transfers with filters
            const transfersReq = fetch(`${API_BASE_URL}/transfers/?${queryString}`);

            // Fetch Free Agents with filters
            const freeAgentsReq = fetch(`${API_BASE_URL}/transfers/free_agents?${queryString}`);

            const [myTeamRes, transfersRes, freeAgentsRes] = await Promise.all([
                myTeamReq, transfersReq, freeAgentsReq
            ]);

            if (!myTeamRes.ok || !transfersRes.ok || !freeAgentsRes.ok) throw new Error('Network response error');

            const myTeamData = await myTeamRes.json();
            const transfersData = await transfersRes.json();
            const freeAgentsData = await freeAgentsRes.json();

            // Mappers
            const transfersMap = new Map();
            transfersData.forEach(t => { if (t.character) transfersMap.set(t.character.id, t); });

            const mapCharacterToCard = (character, index) => {
                if (!character) return null;
                const imageSet = ALL_IMAGES.playerSets[index % ALL_IMAGES.playerSets.length];
                const transferInfo = transfersMap.get(character.id);
                return {
                    id: character.id, characterId: character.id,
                    name: character.name || 'Невідомий', position: character.position || 'Гравець:',
                    age: character.age, power: Math.round(character.power || 0), talent: character.talent,
                    price: character.character_price || 0,
                    stats: { value1: Math.round(character.power || 0), value2: character.talent || 0 },
                    images: { ...imageSet, cdm: ALL_IMAGES.genericCdm },
                    owner: { user_id: userId, username: user.username, user_name: user.username },
                    isTeamMember: true, transfer: transferInfo || null,
                    rarity: character.rarity,
                };
            };

            const mapTransferToCard = (apiItem, index) => {
                const character = apiItem.character;
                console.log(character)
                if (!character) return null;
                const imageSet = ALL_IMAGES.playerSets[index % ALL_IMAGES.playerSets.length];
                return {
                    id: apiItem.id, characterId: character.id,
                    name: character.name || 'Невідомий', position: character.position || 'Гравець:',
                    seller: character.owner?.username || 'Система', price: apiItem.price,
                    age: character.age, power: Math.round(character.power || 0), talent: character.talent,
                    stats: { value1: Math.round(character.power || 0), value2: character.talent || 0 },
                    images: { ...imageSet, cdm: ALL_IMAGES.genericCdm },
                    owner: character.owner, transfer: apiItem,
                    rarity: character.rarity,
                };
            };

            setMyTeam(myTeamData.map(mapCharacterToCard).filter(Boolean));
            setTransfers(transfersData.map(mapTransferToCard).filter(Boolean));
            setFreeAgents(freeAgentsData.map(mapTransferToCard).filter(Boolean));

        } catch (err) {
            console.error("Fetch error:", err);
            setError(TEXTS.error);
        } finally {
            setLoading(false);
        }
    }, [userId]); // filterParams removed from dependency to avoid loop, we pass it as arg

    // Initial load
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // --- Handlers ---
    const closeModal = () => { setSelectedPlayer(null); setModalView('closed'); };
    const handlePlayerClick = (player) => { setSelectedPlayer(player); setModalView('details'); };

    const handleApplyFilters = (newFilters) => {
        setFilterParams(newFilters); // Save to state
        fetchData(newFilters); // Trigger fetch with new filters
        setModalView('closed');
    };

    // Transaction handlers
    const handleSellConfirm = async (price) => {
        if (!selectedPlayer) return;
        setIsProcessing(true);
        try {
            await postPlayerToTransfer(selectedPlayer.id, price);
            await fetchData();
            closeModal();
        } catch (error) { showAlert(error.message); } finally { setIsProcessing(false); }
    };

    const handleRemoveFromSale = async () => {
        if (!selectedPlayer?.transfer) return;
        setIsProcessing(true);
        try {
            await removePlayerFromTransfer(selectedPlayer.transfer.id);
            await fetchData();
            closeModal();
        } catch (error) { showAlert(error.message); } finally { setIsProcessing(false); }
    };

    const handleInstantSell = async () => {
        if (!selectedPlayer) return;
        if (!window.confirm(`Ви впевнені, що хочете миттєво продати ${selectedPlayer.name}?`)) return;
        setIsProcessing(true);
        try {
            const result = await instantSellPlayer(selectedPlayer.id);
            showAlert(result.message);
            await fetchData(); await fetchUser(); closeModal();
        } catch (error) { showAlert(error.message); } finally { setIsProcessing(false); }
    };

    const handleBuy = async () => {
        if (!selectedPlayer?.transfer) return;
        if (!window.confirm(`Купити ${selectedPlayer.name} за ${selectedPlayer.price} монет?`)) return;
        setIsProcessing(true);
        try {
            const result = await buyPlayerFromTransfer(selectedPlayer.transfer.id, userId);
            showAlert(result.message);
            await fetchData(); await fetchUser(); closeModal();
        } catch (error) { showAlert(error.message); } finally { setIsProcessing(false); }
    };

    // --- Render ---
    if (loading && modalView === 'closed') return <LoadingSpinner />; // Don't hide if just applying filter
    if (error) return <ErrorDisplay message={error} />;

    return (
        <main className={styles.pageWrapper}>
            <h1 className={styles.pageTitle}>{TEXTS.pageTitle}</h1>

            {/* --- Tabs Navigation --- */}
            <div className={styles.tabsContainer}>
                <button
                    className={`${styles.tabButton} ${activeTab === 'market' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('market')}
                >
                    {TEXTS.tabTransfers}
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'agents' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('agents')}
                >
                    {TEXTS.tabAgents}
                </button>
            </div>

            {/* --- Filter Button --- */}
            <button className={styles.filterButton} onClick={() => setModalView('filters')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                {TEXTS.filterBtn}
            </button>


            {/* --- Tab Content: Market & My Team --- */}
            {activeTab === 'market' && (
                <div className={styles.tabContent}>
                    <SectionHeader title={TEXTS.myTeamSection} />
                    <MyTeamGrid team={myTeam} onPlayerClick={handlePlayerClick} onAddPlayer={() => {}} />

                    {transfers.length > 0 && (
                        <>
                            <SectionHeader title={TEXTS.marketSection} />
                            <MarketGrid players={transfers} onPlayerClick={handlePlayerClick} />
                        </>
                    )}
                    {transfers.length === 0 && (
                        <div className={styles.noDataPlaceholder}>На ринку зараз немає пропозицій</div>
                    )}
                </div>
            )}

            {/* --- Tab Content: Free Agents --- */}
            {activeTab === 'agents' && (
                <div className={styles.tabContent}>
                    <CountdownTimer />

                    {freeAgents.length > 0 ? (
                        <>
                            <MarketGrid players={freeAgents} onPlayerClick={handlePlayerClick} startIndex={0} />
                        </>
                    ) : (
                        <div className={styles.noDataPlaceholder}>Агенти зараз недоступні</div>
                    )}
                </div>
            )}

            {/* --- Modals --- */}
            {modalView === 'details' && selectedPlayer && (
                <ModalRoot>
                    <PlayerModal
                        player={selectedPlayer}
                        isOwner={selectedPlayer.owner?.user_id === userId}
                        onClose={closeModal}
                        isProcessing={isProcessing}
                        onInstantSell={handleInstantSell}
                        onBuy={handleBuy}
                        onSell={() => setModalView('setPrice')}
                        onRemoveFromSale={handleRemoveFromSale}
                    />
                </ModalRoot>
            )}

            {modalView === 'setPrice' && selectedPlayer && (
                <ModalRoot>
                    <SetPriceModal
                        minPrice={Math.round(selectedPlayer.price * 0.7)}
                        initialPrice={Math.round(selectedPlayer.price)}
                        maxPrice={100_000_000}
                        onClose={closeModal}
                        onBack={() => setModalView('details')}
                        onConfirm={handleSellConfirm}
                        isProcessing={isProcessing}
                    />
                </ModalRoot>
            )}

            {/* Filter Modal using generic ModalRoot */}
            {modalView === 'filters' && (
                <ModalRoot>
                    <div style={{ pointerEvents: 'auto' }}> {/* Ensure clicks work */}
                        <div className={styles.modalContent} style={{background: '#1a1a1a', padding: '20px', borderRadius: '16px', border: '1px solid #444', width: '320px', maxWidth: '90vw'}}>
                            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                                <button onClick={() => setModalView('closed')} style={{background:'none', border:'none', color:'#fff', fontSize:'20px', cursor:'pointer'}}>×</button>
                            </div>
                            <FilterModal
                                initialFilters={filterParams}
                                onClose={() => setModalView('closed')}
                                onApply={handleApplyFilters}
                            />
                        </div>
                    </div>
                </ModalRoot>
            )}
        </main>
    );
}