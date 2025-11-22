import React, {useCallback, useEffect, useRef, useState} from 'react';
// ✨ 1. ИМПОРТИРУЕМ ХУКИ ИЗ REACT-SPRING
import {useSpring, animated} from 'react-spring';
import styles from '../../css_files/main_css/InventoryModal.module.css';
import Config from '../../config.js';
import {motion, AnimatePresence} from 'framer-motion';
import {showAlert} from '../../alertService.jsx';
import {API_BASE_URL} from '../../api.js';
import {ModalRoot} from "../modal_components/ModalComponents.jsx";
import {Box as ModalBox} from '../modal_components/ModalComponents.jsx';
import Img77 from '../../assets/public/img65.png';
import ReactCanvasConfetti from 'react-canvas-confetti';
import boxOpenSound from '../../assets/public/sounds/lootbox.mp3';
import Confetti from "react-confetti";

// --- SVG ИКОНКА (без изменений) ---
const AgeIcon = ({className}) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" width="100%" height="100%"
         style={{
             shapeRendering: 'geometricPrecision',
             textRendering: 'geometricPrecision',
             imageRendering: 'optimizeQuality',
             fillRule: 'evenodd',
             clipRule: 'evenodd'
         }}
         viewBox="0 0 6.827 6.827">
        <defs>
            <style>{`.fil2{fill:#b38e85}.fil3{fill:#e7e9ee}.fil0{fill:#333;fill-rule:nonzero}`}</style>
        </defs>
        <g id="Layer_x0020_1">
            <g id="_625017608">
                <path id="_625017968" className="fil0"
                      d="M1.596 3.364H5.23a.397.397 0 0 1 .398.398v1.41a.08.08 0 0 1-.08.08H1.278a.08.08 0 0 1-.08-.08v-1.41a.397.397 0 0 1 .398-.398zm3.635.16H1.596a.237.237 0 0 0-.238.238v1.33h4.11v-1.33a.237.237 0 0 0-.237-.238z"/>
                <path id="_625017632" className="fil0"
                      d="M1.013 5.441h4.8v-.189h-4.8v.189zm4.88.16H.933a.08.08 0 0 1-.08-.08v-.349a.08.08 0 0 1 .08-.08h4.96a.08.08 0 0 1 .08.08v.349a.08.08 0 0 1-.08-.08z"/>
                <path id="_625018160" className="fil0"
                      d="M2.052 2.005h2.723a.395.395 0 0 1 .396.397v1.042a.08.08 0 0 1-.08.08H1.735a.08.08 0 0 1-.08-.08V2.402a.395.395 0 0 1 .397-.397zm2.723.16H2.052a.236.236 0 0 0-.237.237v.962h3.196v-.962a.236.236 0 0 0-.236-.237z"/>
                <path id="_625018112" className="fil0"
                      d="M1.198 4.233a.08.08 0 0 0 .16 0v-.041a.224.224 0 0 1 .225-.225.225.225 0 0 1 .225.225v.081a.384.384 0 0 0 .657.272.384.384 0 0 0 .113-.272v-.081a.224.224 0 0 1 .225-.225.225.225 0 0 1 .225.225v.081a.384.384 0 0 0 .385.385.384.384 0 0 0 .385-.385v-.081a.224.224 0 0 1 .225-.225.225.225 0 0 1 .226.225v.081a.384.384 0 0 0 .385.385.384.384 0 0 0 .385-.385v-.081a.224.224 0 0 1 .225-.225.225.225 0 0 1 .225.225v.081a.08.08 0 0 0 .16 0v-.081a.384.384 0 0 0-.657-.272.384.384 0 0 0-.113.272v.081a.224.224 0 0 1-.225.225.225.225 0 0 1-.225-.225v-.081a.384.384 0 0 0-.386-.385.384.384 0 0 0-.385.385v.081a.224.224 0 0 1-.225.225.225.225 0 0 1-.225-.225v-.081a.384.384 0 0 0-.385-.385.384.384 0 0 0-.385.385v.081a.224.224 0 0 1-.225.225.225.225 0 0 1-.225-.225v-.081a.384.384 0 0 0-.657-.272.384.384 0 0 0-.113.272v.04z"/>
                <path id="_625017560" className="fil0"
                      d="M1.655 2.733a.08.08 0 0 0 .16 0v-.032a.16.16 0 0 1 .16-.16.159.159 0 0 1 .16.16v.064a.32.32 0 0 0 .32.32.319.319 0 0 0 .32-.32v-.064a.16.16 0 0 1 .159-.16.159.159 0 0 1 .16.16v.064a.319.319 0 0 0 .32.32.319.319 0 0 0 .319-.32v-.064a.16.16 0 0 1 .16-.16.159.159 0 0 1 .16.16v.064a.32.32 0 0 0 .639 0v-.064a.16.16 1 1 .32 0v.064a.08.08 0 0 0 .16 0v-.064a.32.32 0 0 0-.64 0v.064a.16.16 1 1-.32 0v-.064a.32.32 0 0 0-.32-.32.319.319 0 0 0-.319.32v.064a.16.16 0 0 1-.16.16.159.159 0 0 1-.16-.16v-.064a.32.32 0 0 0-.32-.32.319.319 0 0 0-.319.32v.064a.16.16 0 0 1-.16.16.159.159 0 0 1-.16-.16v-.064a.32.32 0 0 0-.319-.32.319.319 0 0 0-.32.32v.032z"/>
                <path id="_625017728" className="fil0"
                      d="M3.8 1.403a.512.512 0 0 1-.022.563.496.496 0 0 1-.307.192.437.437 0 0 1-.343-.079.438.438 0 0 1-.172-.307.495.495 0 0 1 .623-.529.08.08 0 0 1 .057.066c.005.025.01.041.02.048.01.007.03.01.065.005a.08.08 0 0 1 .08.041zm-.087.279a.365.365 0 0 0-.029-.158.209.209 0 0 1-.124-.04.197.197 0 0 1-.068-.096.335.335 0 0 0-.377.368.279.279 0 0 0 .109.196.28.28 0 0 0 .219.049.332.332 0 0 0 .27-.32z"/>
            </g>
            <path
                d="M3.713 1.682a.365.365 0 0 0-.029-.158.209.209 0 0 1-.124-.04.197.197 0 0 1-.068-.096.335.335 0 0 0-.377.368.272.272 0 0 0 .26.25h.028a.336.336 0 0 0 .248-.135.332.332 0 0 0 .062-.19z"
                style={{fill: '#f45a52'}}/>
            <path className="fil2"
                  d="M4.775 2.165H2.052a.236.236 0 0 0-.237.237v.023a.316.316 0 0 1 .386.05.32.32 0 0 1 .094.226v.064a.16.16 0 1 0 .32 0v-.064a.32.32 0 0 1 .639 0v.064a.16.16 0 1 0 .319 0v-.064a.32.32 0 0 1 .64 0v.064a.16.16 0 1 0 .319 0v-.064a.32.32 0 0 1 .48-.276v-.023a.236.236 0 0 0-.237-.237z"/>
            <path className="fil3"
                  d="M3.187 2.991a.319.319 0 0 1-.093-.226v-.064a.16.16 0 1 0-.32 0v.064a.319.319 0 0 1-.64 0v-.064a.16.16 0 0 0-.319 0v.662h3.196V2.702a.16.16 0 1 0-.32 0v.064a.32.32 0 0 1-.639 0v-.064a.16.16 0 1 0-.319 0v.064a.32.32 0 0 1-.546.226z"/>
            <path className="fil2"
                  d="M5.091 3.524H1.595a.237.237 0 0 0-.237.238v.118a.382.382 0 0 1 .497.04c.07.07.113.166.113.272v.081a.224.224 0 0 0 .225.225.225.225 0 0 0 .225-.225v-.081a.384.384 0 0 1 .657-.272c.07.07.113.166.113.272v.081a.224.224 0 0 0 .225.225.225.225 0 0 0 .225-.225v-.081a.384.384 0 0 1 .657-.272c.07.07.114.166.114.272v.081a.224.224 0 0 0 .225.225.225.225 0 0 0 .225-.225v-.081a.384.384 0 0 1 .61-.312v-.118a.237.237 0 0 0-.238-.238h-.14z"/>
            <path classNameclassName="fil3"
                  d="M3.142 4.545a.384.384 0 0 1-.114-.272v-.081a.224.224 0 0 0-.225-.225.225.225 0 0 0-.225.225v.081a.384.384 0 0 1-.657.272.384.384 0 0 1-.113-.272v-.081a.224.224 0 0 0-.225-.225.225.225 0 0 0-.225.224v.901h4.11V4.192a.224.224 0 0 0-.224-.225.225.225 0 0 0-.225.225v.081a.384.384 0 0 1-.657.272.384.384 0 0 1-.113-.272v-.081a.224.224 0 0 0-.226-.225.225.225 0 0 0-.225.225v.081a.384.384 0 0 1-.656.272z"/>
            <path style={{fill: '#949494'}} d="M5.549 5.253H1.013v.188h4.8v-.188z"/>
        </g>
        <path style={{fill: 'none'}} d="M0 0h6.827v6.827H0z"/>
    </svg>
);

const HeaderBar = ({title}) => (
    <h2 style={{textAlign: 'center', margin: '0 0 16px', fontSize: 20, fontWeight: 700}}>{title}</h2>
);
const SecondaryButton = ({onClick, children}) => (
    <button onClick={onClick} style={{
        padding: '10px 16px',
        borderRadius: 10,
        border: '1px solid #555',
        background: '#333',
        color: 'white',
        cursor: 'pointer'
    }}>{children}</button>
);
const GradientButton = ({onClick, children, style = {}}) => (
    <button onClick={onClick} style={{
        padding: '10px 20px',
        borderRadius: 10,
        border: 'none',
        background: 'linear-gradient(90deg, #007BFF, #00C6FF)',
        color: 'white',
        fontWeight: 'bold',
        cursor: 'pointer', ...style
    }}>{children}</button>
);
// --- API-ХЕЛПЕРЫ (без изменений) ---
const openLootBoxAPI = async (userId, boxType) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/open-box`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({box_type: boxType})
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({detail: 'Unknown error'}));
        throw new Error(errorData.detail || 'Не вдалося відкрити бокс.');
    }
    return response.json();
};
const fetchAllCharactersAPI = (userId) => fetch(`${API_BASE_URL}/users/${userId}/all`);
const setMainCharacterAPI = (userId, characterId) => fetch(`${API_BASE_URL}/users/${userId}/set-main`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({character_id: characterId})
});

// --- МАЛІ, ПЕРЕВИКОРИСТОВУВАНІ КОМПОНЕНТИ (без изменений) ---
const StatDisplay = ({iconNode, iconSrc, value, label}) => (
    <div className={styles.statItem}>{iconNode || <img src={iconSrc} alt={label} className={styles.statIcon}/>}
        <div className={styles.statInfo}><span className={styles.statValue}>{value}</span><span
            className={styles.statLabel}>{label}</span></div>
    </div>
);
const EquipmentSlot = ({imgSrc, altText, label}) => (
    <div className={styles.equipmentSlot} title={label}><img src={imgSrc} alt={altText}
                                                             className={styles.equipmentImage}/></div>
);
const InventorySlot = ({item, onOpen, isOpening}) => {
    const isLootBox = item && item.type && item.image && item.name;
    if (!isLootBox) return <div className={styles.inventorySlot}/>;
    const {type, count, image, name} = item;
    const canOpen = count > 0 && !isOpening;
    const slotClasses = `${styles.inventorySlot} ${canOpen ? styles.clickable : ''} ${isOpening ? styles.disabled : ''}`;
    return (<div className={slotClasses} onClick={() => canOpen && onOpen(type, image)}
                 title={canOpen ? `Відкрити ${name}` : (isOpening ? 'Зачекайте...' : 'У вас немає цих боксів')}>{<img
        src={image} alt={name} className={styles.itemImage}/>}{count > 0 &&
        <span className={styles.itemCount}>x{count}</span>}</div>);
};

// --- ВЕЛИКІ ЛОГІЧНІ БЛОКИ (без изменений) ---
const UserResources = ({user, onOpenReferral}) => (
    <div className={styles.resourcesBar}>
        <StatDisplay iconSrc={Config.IMAGES.coin} value={user.money ?? 0} label="Монети"/>

        <motion.button
            className={styles.referralButton}
            onClick={onOpenReferral}
            title="Запросити друзів (+бонуси)"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
            {/* Додаємо зображення персонажа */}
            <img
                src={Config.IMAGES.referal_character}
                alt="Referral character icon"
                style={{ width: '30px', height: '30px', marginRight: '4px' }}
            />
            +
        </motion.button>

        <StatDisplay iconSrc={Config.IMAGES.energy} value={user.energy ?? 0} label="Енергія"/>
    </div>
);

const CharacterHub = ({
                          user,
                          allCharacters,
                          currentIndex,
                          onPrev,
                          onNext,
                          onSetMain,
                          isSettingMain,
                          isMainCharacter
                      }) => {
    const displayedCharacter = allCharacters[currentIndex];
    if (!displayedCharacter) return null;
    return (<div className={styles.characterHub}>
        <div className={styles.characterSwitcher}>
            <button onClick={onPrev} className={styles.switchButton} disabled={allCharacters.length <= 1}>‹</button>
            <div className={styles.characterDisplayWrapper}>
                <div className={styles.equipmentColumn}><EquipmentSlot imgSrc={Config.IMAGES.tshirt} altText="Футболка"
                                                                       label="Футболка"/><EquipmentSlot
                    imgSrc={Config.IMAGES.shorts} altText="Шорти" label="Шорти"/></div>
                <div className={styles.characterDisplay}><AnimatePresence mode="wait">
                    <motion.div key={currentIndex} initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}}
                                exit={{opacity: 0, scale: 0.9}} transition={{duration: 0.2}}><img
                        src={isMainCharacter ? Img77 : Config.IMAGES.avatar_uk} alt={displayedCharacter.name}
                        className={styles.characterImage}/></motion.div>
                </AnimatePresence><h3 className={styles.characterName}>{displayedCharacter.name}</h3><p
                    className={styles.characterTeam}>{user.team_name}</p></div>
                <div className={styles.equipmentColumn}><EquipmentSlot imgSrc={Config.IMAGES.gaiters} altText="Гетри"
                                                                       label="Гетри"/><EquipmentSlot
                    imgSrc={Config.IMAGES.boots} altText="Бутси" label="Бутси"/></div>
            </div>
            <button onClick={onNext} className={styles.switchButton} disabled={allCharacters.length <= 1}>›</button>
        </div>
        <div className={styles.characterStatsGrid}><StatDisplay iconSrc={Config.IMAGES.arm}
                                                                value={Math.round(displayedCharacter.power)}
                                                                label="Сила"/><StatDisplay
            iconSrc={Config.IMAGES.target} value={displayedCharacter.talent} label="Талант"/><StatDisplay
            iconNode={<AgeIcon className={styles.statIcon}/>} value={displayedCharacter.age} label="Вік"/></div>
        {!isMainCharacter && (<button onClick={onSetMain} className={styles.makeMainButton}
                                      disabled={isSettingMain}>{isSettingMain ? 'Зберігаємо...' : '🌟 Зробити основним'}</button>)}
    </div>);
};
const InventorySection = ({items, onOpenBox, isOpening}) => (
    <div className={styles.inventorySection}>
        <div className={styles.inventoryGrid}>{items.map((item, index) => (
            <InventorySlot key={item.type || `empty-${index}`} item={item} onOpen={onOpenBox}
                           isOpening={isOpening}/>))}</div>
    </div>
);

// --- ВАРИАНТЫ АНИМАЦИЙ ДЛЯ FRAMER MOTION (без изменений) ---
const rewardContainerVariants = {
    hidden: {opacity: 0},
    visible: {opacity: 1, transition: {staggerChildren: 0.25, delayChildren: 0.2}},
};
const rewardItemVariants = {
    hidden: {opacity: 0, y: 50, scale: 0.8},
    visible: {opacity: 1, y: 0, scale: 1, transition: {type: 'spring', stiffness: 120, damping: 12}},
};
const fetchReferralCountAPI = (userId) => fetch(`${API_BASE_URL}/users/${userId}/count_of_ref`);

// ✨--- НОВИЙ КОМПОНЕНТ "ВИДУ" ДЛЯ РЕФЕРАЛІВ ---✨
// (Це, по суті, вміст ReferralModal, але без <Box>)
const ReferralView = ({user, onBack}) => {
    const [referralCount, setReferralCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isCopied, setIsCopied] = useState(false);
    const referralLink = `https://t.me/football_blitz_bot?start=ref_${user?.user_id}`;

    useEffect(() => {
        if (!user?.user_id) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        fetchReferralCountAPI(user.user_id)
            .then(res => res.json())
            .then(data => setReferralCount(data.count || 0))
            .catch(err => console.error("Failed to fetch referral count:", err))
            .finally(() => setIsLoading(false));
    }, [user?.user_id]);

    function handleCopy() {
        navigator.clipboard.writeText(referralLink).then(() => {
            setIsCopied(true);
            showAlert("Посилання скопійовано!", "success");
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            showAlert("Помилка копіювання.", "error");
        });
    }

    // Стилі (адаптовані для вбудовування)
    const bonusBoxStyle = {
        background: 'var(--surface-highlight)',
        border: '1px solid var(--surface-border)',
        borderRadius: 12,
        padding: "12px 8px",
        margin: "16px 0",
        fontSize: 18,
        fontWeight: 700,
        lineHeight: 1.4,
        textAlign: 'center',
        boxShadow: "0 4px 12px var(--shadow-color)"
    };
    const linkDisplayStyle = {
        padding: "12px 16px",
        borderRadius: 10,
        border: "1px solid var(--surface-border)",
        background: "rgba(0,0,0,0.2)",
        color: "var(--text-primary)",
        width: "100%",
        boxSizing: "border-box",
        fontSize: 14,
        fontWeight: 500,
        textAlign: 'center',
        wordBreak: 'break-all',
        marginBottom: 12
    };
    const statsStyle = {
        fontSize: 16,
        color: "var(--text-secondary)",
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '2px 31px'
    };

    return (
        <div style={{padding: 16, maxWidth: 460, margin: '0 auto'}}>
            <HeaderBar title="🌀 Реферальна система"/>
            <div style={{padding: "8px 8px 0"}}>
                <p style={{textAlign: 'center', fontSize: 16, margin: '0 0 16px', color: 'var(--text-primary)'}}>
                    Запрошуй друзів та отримуй цінні бонуси! 🎉
                </p>
                <motion.div style={bonusBoxStyle} initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}}>
                    🔋 <strong>300 енергії</strong> та 💰 <strong>300 монет</strong>
                </motion.div>
                <div style={{marginTop: 20, marginBottom: 20}}>
                    <div style={statsStyle}>
                        <span>👥 Твої реферали:</span>
                        <span style={{color: 'var(--text-primary)', fontWeight: 700, fontSize: 18}}>
                            {isLoading ? "..." : referralCount}
                        </span>
                    </div>
                </div>
                <div>
                    <div style={{fontSize: 14, color: "var(--text-secondary)", marginBottom: 10, textAlign: 'center'}}>
                        🎯 Твоє реферальне посилання:
                    </div>
                    <div style={linkDisplayStyle}>{referralLink}</div>
                </div>
                <div
                    style={{display: "flex", gap: 10, justifyContent: "flex-end", alignItems: 'center', marginTop: 24}}>
                    {/* КНОПКА "НАЗАД" - використовує той самий обробник, що і "Х" */}
                    <SecondaryButton onClick={onBack}>Назад</SecondaryButton>
                    <GradientButton onClick={handleCopy} style={{minWidth: 160}}>
                        {isCopied ? "Скопійовано!" : "Копіювати"}
                    </GradientButton>
                </div>
            </div>
        </div>
    );
};
// --- ✨ 2. НОВЫЙ КОМПОНЕНТ ДЛЯ АНИМАЦИИ ЧИСЕЛ ---
const AnimatedNumber = ({value}) => {
    const {number} = useSpring({
        from: {number: 0},
        number: value,
        delay: 0, // небольшая задержка перед началом счета
        config: {mass: 2, tension: 12, friction: 10},
    });

    return <animated.span>{number.to(n => n.toFixed(0))}</animated.span>;
};

// --- ГОЛОВНИЙ КОМПОНЕНТ МОДАЛЬНОГО ВІКНА ---
export const InventoryModal = ({user, onClose, onUserUpdate}) => {
    // ... все стейты остаются без изменений
    const [isOpening, setIsOpening] = useState(false);
    const [rewards, setRewards] = useState(null);
    const [openedBoxImage, setOpenedBoxImage] = useState(null);
    const [allCharacters, setAllCharacters] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSettingMain, setIsSettingMain] = useState(false);
    const [animationPhase, setAnimationPhase] = useState('idle');

    // ... вся логика хуков и обработчиков остается без изменений
    const refAnimationInstance = useRef(null);
    const getInstance = useCallback((instance) => {
        refAnimationInstance.current = instance;
    }, []);
    const makeShot = useCallback((particleRatio, opts) => {
        refAnimationInstance.current && refAnimationInstance.current({
            ...opts,
            origin: {y: 0.6},
            particleCount: Math.floor(200 * particleRatio),
        });
    }, []);
    const fireConfetti = useCallback(() => {
        makeShot(0.25, {spread: 26, startVelocity: 55});
        makeShot(0.2, {spread: 60});
        makeShot(0.35, {spread: 100, decay: 0.91, scalar: 0.8});
        makeShot(0.1, {spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2});
        makeShot(0.1, {spread: 120, startVelocity: 45});
    }, [makeShot]);
    const [showConfettiHappy, setShowConfettiHappy] = useState(false);
    const [windowSize, setWindowSize] = useState({width: window.innerWidth, height: window.innerHeight});

    const [currentView, setCurrentView] = useState('inventory');
    // ✨--- ЛОГІКА ПЕРЕМИКАННЯ ВИДУ ---✨

    // ✨ 4. ДОДАЄМО НОВИЙ СТЕЙТ ДЛЯ РЕФЕРАЛЬНОГО ВІКНА
    const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({width: window.innerWidth, height: window.innerHeight});
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const loadCharacters = async () => {
            setIsLoading(true);
            try {
                const response = await fetchAllCharactersAPI(user.user_id);
                if (!response.ok) throw new Error('Не вдалося завантажити персонажів.');
                const data = await response.json();
                setAllCharacters(data || []);
                const mainCharIndex = data ? data.findIndex(c => c.id === user.main_character_id) : -1;
                setCurrentIndex(mainCharIndex >= 0 ? mainCharIndex : 0);
            } catch (error) {
                showAlert(error.message);
            } finally {
                setIsLoading(false);
            }
        };
        loadCharacters();
    }, [user.user_id, user.main_character_id]);

    const handleNext = () => {
        if (!allCharacters.length) return;
        setCurrentIndex((prev) => (prev + 1) % allCharacters.length);
    };
    const handlePrev = () => {
        if (!allCharacters.length) return;
        setCurrentIndex((prev) => (prev - 1 + allCharacters.length) % allCharacters.length);
    };

    const handleSetMain = async () => {
        const displayedCharacter = allCharacters[currentIndex];
        if (!displayedCharacter) return;
        setIsSettingMain(true);
        try {
            const response = await setMainCharacterAPI(user.user_id, displayedCharacter.id);
            if (!response.ok) throw new Error('Помилка встановлення персонажа.');
            const updatedUser = await response.json();
            onUserUpdate(updatedUser);
            showAlert('Головного персонажа успішно змінено!', 'success');
        } catch (error) {
            showAlert(error.message);
        } finally {
            setIsSettingMain(false);
        }
    };

    const handleOpenBox = async (boxType, boxImage) => {
        setIsOpening(true);
        setOpenedBoxImage(boxImage);
        setAnimationPhase('idle');
        setRewards(null);
        const audio = new Audio(boxOpenSound);
        audio.volume = 0.7;
        const oldMoney = user.money;
        const oldEnergy = user.energy;
        try {
            const openPromise = openLootBoxAPI(user.user_id, boxType);
            setTimeout(() => {
                setAnimationPhase('shaking');
                setTimeout(async () => {
                    audio.play().catch(() => {
                        console.error("Audio ne mogu")
                    });
                }, 1500);
            }, 200);
            setTimeout(async () => {
                const updatedUser = await openPromise;
                const moneyReward = (updatedUser.money ?? 0) - (oldMoney ?? 0);
                const energyReward = (updatedUser.energy ?? 0) - (oldEnergy ?? 0);
                setRewards({money: moneyReward, energy: energyReward});
                setAnimationPhase('revealed');
                fireConfetti();
                setShowConfettiHappy(true);
                setTimeout(() => {
                    onUserUpdate(updatedUser);
                    setRewards(null);
                    setOpenedBoxImage(null);
                    setIsOpening(false);
                    setAnimationPhase('idle');
                }, 5000);
            }, 2000);
        } catch (error) {
            showAlert(error.message);
            setIsOpening(false);
        }
    };

    // ... остальная логика компонента без изменений
    const lootBoxes = [
        {type: 'SMALL_BOX', count: user.count_of_small_box, image: Config.IMAGES.box_mini, name: "Малий Бокс"},
        {type: 'MEDIUM_BOX', count: user.count_of_medium_box, image: Config.IMAGES.box_medium, name: "Середній Бокс"},
        {type: 'LARGE_BOX', count: user.count_of_big_box, image: Config.IMAGES.box_premium, name: "Великий Бокс"}
    ].filter(box => box.count > 0);
    const totalSlots = 10;
    const emptySlotsCount = totalSlots - lootBoxes.length;
    const emptySlots = Array.from({length: Math.max(0, emptySlotsCount)}).map(() => ({}));
    const inventoryItems = [...lootBoxes, ...emptySlots];
    const isMainCharacter = allCharacters[currentIndex]?.id === user.main_character_id;

    if (isLoading) {
        return <ModalRoot onClose={onClose}><ModalBox>
            <div>Завантаження...</div>
        </ModalBox></ModalRoot>;
    }

    const COMPACT_VERTICAL_SHIFT = '-10px';
    const containerStyle = !isMainCharacter ? {'--compact-vertical-shift': COMPACT_VERTICAL_SHIFT} : {};

    const handleOpenReferral = () => setCurrentView('referral');
    const handleBackToInventory = () => setCurrentView('inventory');

    return (
        <ModalRoot onClose={onClose}>
            {/*
          ModalBox.onClose тепер динамічний:
          - Якщо ми в інвентарі (inventory) -> викликаємо зовнішній onClose (закриття модалки).
          - Якщо ми в рефералці (referral) -> викликаємо handleBackToInventory (повернення до інвентаря).
        */}
            <ModalBox
                onClose={currentView === 'inventory' ? onClose : handleBackToInventory}
            >
                <ReactCanvasConfetti refConfetti={getInstance} style={{
                    position: 'absolute',
                    pointerEvents: 'none',
                    width: '100%',
                    height: '100%',
                    top: 0,
                    left: 0,
                    zIndex: 9999
                }}/>
                {showConfettiHappy && (
                    <Confetti
                        width={windowSize.width}
                        height={windowSize.height}
                        recycle={false}
                        numberOfPieces={400}
                        gravity={0.1}
                        onConfettiComplete={() => setShowConfettiHappy(false)}
                        style={{zIndex: 9999}}
                    />
                )}

                {/* ✨ Анімація переходу між видами: Inventory <-> Referral */}
                <AnimatePresence mode="wait">

                    {/* --------------------------------- */}
                    {/* 1. ВИД ІНВЕНТАРЯ (за замовчуванням) */}
                    {/* --------------------------------- */}
                    {currentView === 'inventory' && (
                        <motion.div
                            key="inventory"
                            // Анімація входу: з'являється зліва
                            initial={{opacity: 0, x: "-100%"}}
                            animate={{opacity: 1, x: "0%"}}
                            // Анімація виходу: йде вправо
                            exit={{opacity: 0, x: "100%"}}
                            transition={{duration: 0.3, ease: "easeInOut"}}
                            // ✅ ИСПРАВЛЕНО: style={{ position: 'absolute', width: '100%' }} - УДАЛЕНО
                        >
                            <div className={`${styles.inventoryContainer} ${!isMainCharacter ? styles.scaledDown : ''}`}
                                 style={containerStyle}>
                                <UserResources
                                    user={user}
                                    onOpenReferral={handleOpenReferral} // <--- Тепер змінює стейт currentView
                                />
                                <CharacterHub user={user} allCharacters={allCharacters} currentIndex={currentIndex}
                                              onPrev={handlePrev} onNext={handleNext} onSetMain={handleSetMain}
                                              isSettingMain={isSettingMain} isMainCharacter={isMainCharacter}/>
                                <InventorySection items={inventoryItems} onOpenBox={handleOpenBox}
                                                  isOpening={isOpening}/>
                            </div>

                            {/* БЛОК АНІМАЦІЇ ВІДКРИТТЯ БОКСУ (Вкладено всередину) */}
                            <AnimatePresence>
                                {isOpening && (
                                    <motion.div className={styles.animationOverlay} initial={{opacity: 0}}
                                                animate={{opacity: 1}} exit={{opacity: 0}}>
                                        <AnimatePresence>
                                            {animationPhase === 'revealed' && (
                                                <motion.div className={styles.flashEffect} initial={{opacity: 0}}
                                                            animate={{opacity: [0, 1, 0]}}
                                                            transition={{duration: 0.5, times: [0, 0.1, 1]}}/>
                                            )}
                                        </AnimatePresence>
                                        <AnimatePresence>
                                            {animationPhase !== 'revealed' && (
                                                <motion.img
                                                    src={openedBoxImage}
                                                    alt="Opening box..."
                                                    className={styles.openingBox}
                                                    initial={{scale: 0.5, y: 100, opacity: 0}}
                                                    animate={animationPhase === 'shaking'
                                                        ? {
                                                            opacity: 1,
                                                            y: 0,
                                                            rotate: [0, -5, 5, -5, 5, -5, 0],
                                                            scale: [1, 1.2, 1.1, 1.5, 1.4, 1.8, 1.9],
                                                            transition: {
                                                                rotate: {
                                                                    duration: 0.4,
                                                                    repeat: Infinity,
                                                                    ease: 'linear'
                                                                },
                                                                scale: {
                                                                    duration: 1.8,
                                                                    ease: "easeInOut",
                                                                    times: [0, 0.2, 0.3, 0.5, 0.6, 0.8, 1]
                                                                }
                                                            }
                                                        }
                                                        : {
                                                            opacity: 1,
                                                            scale: 1,
                                                            y: 0,
                                                            transition: {type: 'spring', stiffness: 100}
                                                        }
                                                    }
                                                    exit={{scale: 5, opacity: 0, transition: {duration: 0.3}}}
                                                />
                                            )}
                                        </AnimatePresence>

                                        {animationPhase === 'revealed' && rewards && (
                                            <motion.div className={styles.rewardContainer}
                                                        variants={rewardContainerVariants} initial="hidden"
                                                        animate="visible">
                                                <motion.h2 className={styles.rewardTitle} variants={rewardItemVariants}>
                                                    Отримано!
                                                </motion.h2>
                                                <motion.p className={styles.rewardItem} variants={rewardItemVariants}>
                                                    <img src={Config.IMAGES.coin} alt="Money"/> +<AnimatedNumber
                                                    value={rewards.money}/>
                                                </motion.p>
                                                <motion.p className={styles.rewardItem} variants={rewardItemVariants}>
                                                    <img src={Config.IMAGES.energy} alt="Energy"/> +<AnimatedNumber
                                                    value={rewards.energy}/>
                                                </motion.p>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* ------------------------------ */}
                    {/* 2. ВИД РЕФЕРАЛІВ */}
                    {/* ------------------------------ */}
                    {currentView === 'referral' && (
                        <motion.div
                            key="referral"
                            // Анімація входу: з'являється справа
                            initial={{opacity: 0, x: "100%"}}
                            animate={{opacity: 1, x: "0%"}}
                            // Анімація виходу: йде вліво
                            exit={{opacity: 0, x: "-100%"}}
                            transition={{duration: 0.3, ease: "easeInOut"}}
                            // ✅ ИСПРАВЛЕНО: style={{ position: 'absolute', width: '100%' }} - УДАЛЕНО
                        >
                            <ReferralView
                                user={user}
                                onBack={handleBackToInventory} // Натискання на "Назад" або "X" повертає в інвентар
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </ModalBox>
        </ModalRoot>
    );
};