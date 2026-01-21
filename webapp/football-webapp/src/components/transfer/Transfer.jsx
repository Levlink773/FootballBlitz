import React, {useState, useEffect, useMemo} from 'react';

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

// --- Sub-Components ---

const CountdownTimer = () => {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const midnight = new Date(now);
            midnight.setHours(24, 0, 0, 0); // Next midnight (00:00:00)
            const diff = midnight - now;

            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            const pad = (num) => num.toString().padStart(2, '0');
            return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        setTimeLeft(calculateTimeLeft()); // Init call

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

const PlayerCard = React.memo(({ player, index, onCardClick }) => (
    <article
        className={styles.playerCard}
        style={{ animationDelay: `${index * 70}ms` }}
        onClick={() => onCardClick(player)}
    >
        <img src={player.images.cardBackground} className={styles.cardBg} alt="" />
        <img src={player.images.avatar} className={styles.cardAvatar} alt="" />
        <img src={player.images.flag} className={styles.cardFlag} alt="" />
        <div className={styles.cardInfo}>
            <h4 className={styles.cardName}>{player.name}</h4>
            <p className={styles.cardPosition}>{player.position}</p>
        </div>
        <div className={styles.cardStats}>
            <div><img src={player.images.stat1Icon} alt="" /><span>{player.stats.value1}</span></div>
            <div><img src={player.images.stat2Icon} alt="" /><span>{player.stats.value2}</span></div>
        </div>
        <p className={styles.cardSeller}>{TEXTS.sellerLabel} <span>{player.seller ?? '—'}</span></p>
        <div className={styles.cardFooter}>
            <div className={styles.cardPrice}>
                <img src={player.images.priceIcon} alt="" />
                <span>{formatPrice(player.price)}</span>
            </div>
        </div>
    </article>
));

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
    const [modalView, setModalView] = useState('closed');
    const [isProcessing, setIsProcessing] = useState(false);

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

    const fetchData = useMemo(() => async () => {
        if (!userId) {
            setError("User ID not found.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const [myTeamRes, transfersRes, freeAgentsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/characters/by-user/${userId}`),
                fetch(`${API_BASE_URL}/transfers/`),
                fetch(`${API_BASE_URL}/transfers/free_agents`)
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
                    name: character.name || 'Невідомий', position: 'Нападник',
                    age: character.age, power: Math.round(character.power || 0), talent: character.talent,
                    price: character.character_price || 0,
                    stats: { value1: Math.round(character.power || 0), value2: character.talent || 0 },
                    images: { ...imageSet, cdm: ALL_IMAGES.genericCdm },
                    owner: { user_id: userId, username: user.username, user_name: user.username },
                    isTeamMember: true, transfer: transferInfo || null,
                };
            };

            const mapTransferToCard = (apiItem, index) => {
                const character = apiItem.character;
                if (!character) return null;
                const imageSet = ALL_IMAGES.playerSets[index % ALL_IMAGES.playerSets.length];
                return {
                    id: apiItem.id, characterId: character.id,
                    name: character.name || 'Невідомий', position: 'Нападник',
                    seller: character.owner?.username || 'Система', price: apiItem.price,
                    age: character.age, power: Math.round(character.power || 0), talent: character.talent,
                    stats: { value1: Math.round(character.power || 0), value2: character.talent || 0 },
                    images: { ...imageSet, cdm: ALL_IMAGES.genericCdm },
                    owner: character.owner, transfer: apiItem,
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
    }, [userId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- Handlers ---
    const closeModal = () => { setSelectedPlayer(null); setModalView('closed'); };
    const handlePlayerClick = (player) => { setSelectedPlayer(player); setModalView('details'); };

    // Transaction handlers (Sell, Buy, Remove, Instant Sell) - reusing existing logic
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
    if (loading) return <LoadingSpinner />;
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
                            {/* Added margin top via CSS for separation */}
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
        </main>
    );
}