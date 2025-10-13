import React, {useEffect, useState} from 'react';
import styles from '../../css_files/main_css/InventoryModal.module.css';
import Config from '../../config.js';
import {motion, AnimatePresence} from 'framer-motion';
import {showAlert} from '../../alertService.jsx';
import {API_BASE_URL} from '../../api.js';
import {ModalRoot} from "../modal_components/ModalComponents.jsx";
import {Box as ModalBox} from '../modal_components/ModalComponents.jsx';
import Img77 from '../../assets/public/img78.png';

// --- SVG ІКОНКА ---
const AgeIcon = ({className}) => (

    <svg

        className={className}

        xmlns="http://www.w3.org/2000/svg"

        xmlSpace="preserve"

        width="100%" // Ширина и высота задаются через CSS для гибкости

        height="100%"

        style={{
            shapeRendering: 'geometricPrecision',
            textRendering: 'geometricPrecision',
            imageRendering: 'optimizeQuality',
            fillRule: 'evenodd',
            clipRule: 'evenodd'
        }}

        viewBox="0 0 6.827 6.827"

    >

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
                      d="M1.655 2.733a.08.08 0 0 0 .16 0v-.032a.16.16 0 0 1 .16-.16.159.159 0 0 1 .16.16v.064a.32.32 0 0 0 .32.32.319.319 0 0 0 .32-.32v-.064a.16.16 0 0 1 .159-.16.159.159 0 0 1 .16.16v.064a.319.319 0 0 0 .32.32.319.319 0 0 0 .319-.32v-.064a.16.16 0 0 1 .16-.16.159.159 0 0 1 .16.16v.064a.32.32 0 0 0 .639 0v-.064a.16.16 0 1 1 .32 0v.064a.08.08 0 0 0 .16 0v-.064a.32.32 0 0 0-.64 0v.064a.16.16 0 1 1-.32 0v-.064a.32.32 0 0 0-.32-.32.319.319 0 0 0-.319.32v.064a.16.16 0 0 1-.16.16.159.159 0 0 1-.16-.16v-.064a.32.32 0 0 0-.32-.32.319.319 0 0 0-.319.32v.064a.16.16 0 0 1-.16.16.159.159 0 0 1-.16-.16v-.064a.32.32 0 0 0-.319-.32.319.319 0 0 0-.32.32v.032z"/>

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

            <path className="fil3"
                  d="M3.142 4.545a.384.384 0 0 1-.114-.272v-.081a.224.224 0 0 0-.225-.225.225.225 0 0 0-.225.225v.081a.384.384 0 0 1-.657.272.384.384 0 0 1-.113-.272v-.081a.224.224 0 0 0-.225-.225.225.225 0 0 0-.225.224v.901h4.11V4.192a.224.224 0 0 0-.224-.225.225.225 0 0 0-.225.225v.081a.384.384 0 0 1-.657.272.384.384 0 0 1-.113-.272v-.081a.224.224 0 0 0-.226-.225.225.225 0 0 0-.225.225v.081a.384.384 0 0 1-.656.272z"/>

            <path style={{fill: '#949494'}} d="M5.549 5.253H1.013v.188h4.8v-.188z"/>

        </g>

        <path style={{fill: 'none'}} d="M0 0h6.827v6.827H0z"/>

    </svg>

);


// --- API-ХЕЛПЕРИ ---
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


// --- МАЛІ, ПЕРЕВИКОРИСТОВУВАНІ КОМПОНЕНТИ ---

const StatDisplay = ({iconNode, iconSrc, value, label}) => (
    <div className={styles.statItem}>
        {iconNode || <img src={iconSrc} alt={label} className={styles.statIcon}/>}
        <div className={styles.statInfo}>
            <span className={styles.statValue}>{value}</span>
            <span className={styles.statLabel}>{label}</span>
        </div>
    </div>
);

const EquipmentSlot = ({imgSrc, altText, label}) => (
    <div className={styles.equipmentSlot} title={label}>
        <img src={imgSrc} alt={altText} className={styles.equipmentImage}/>
    </div>
);

const InventorySlot = ({item, onOpen, isOpening}) => {
    const isLootBox = item && item.type && item.image && item.name;

    if (!isLootBox) {
        return <div className={styles.inventorySlot}/>;
    }

    const {type, count, image, name} = item;
    const canOpen = count > 0 && !isOpening;

    const slotClasses = `
        ${styles.inventorySlot}
        ${canOpen ? styles.clickable : ''}
        ${isOpening && !canOpen ? styles.disabled : ''}
    `;

    return (
        <div
            className={slotClasses}
            onClick={() => canOpen && onOpen(type, image)}
            title={canOpen ? `Відкрити ${name}` : (isOpening ? 'Зачекайте...' : 'У вас немає цих боксів')}
        >
            <img src={image} alt={name} className={styles.itemImage}/>
            {count > 0 && <span className={styles.itemCount}>x{count}</span>}
        </div>
    );
};


// --- ВЕЛИКІ ЛОГІЧНІ БЛОКИ ---

const UserResources = ({user}) => (
    <div className={styles.resourcesBar}>
        <StatDisplay iconSrc={Config.IMAGES.coin} value={user.money ?? 0} label="Монети"/>
        <StatDisplay iconSrc={Config.IMAGES.energy} value={user.energy ?? 0} label="Енергія"/>
    </div>
);

const CharacterHub = ({
                          user, allCharacters, currentIndex, onPrev, onNext, onSetMain, isSettingMain, isMainCharacter
                      }) => {
    const displayedCharacter = allCharacters[currentIndex];
    if (!displayedCharacter) return null;

    return (
        <div className={styles.characterHub}>
            <div className={styles.characterSwitcher}>
                <button onClick={onPrev} className={styles.switchButton} disabled={allCharacters.length <= 1}>‹</button>
                <div className={styles.characterDisplayWrapper}>
                    <div className={styles.equipmentColumn}>
                        <EquipmentSlot imgSrc={Config.IMAGES.tshirt} altText="Футболка" label="Футболка"/>
                        <EquipmentSlot imgSrc={Config.IMAGES.shorts} altText="Шорти" label="Шорти"/>
                    </div>
                    <div className={styles.characterDisplay}>
                        <AnimatePresence mode="wait">
                            <motion.div key={currentIndex} initial={{opacity: 0, scale: 0.9}}
                                        animate={{opacity: 1, scale: 1}} exit={{opacity: 0, scale: 0.9}}
                                        transition={{duration: 0.2}}>
                                <img src={isMainCharacter ? Config.IMAGES.avatar_uk : Img77}
                                     alt={displayedCharacter.name} className={styles.characterImage}/>
                            </motion.div>
                        </AnimatePresence>
                        <h3 className={styles.characterName}>{displayedCharacter.name}</h3>
                        <p className={styles.characterTeam}>{user.team_name}</p>
                    </div>
                    <div className={styles.equipmentColumn}>
                        <EquipmentSlot imgSrc={Config.IMAGES.gaiters} altText="Гетри" label="Гетри"/>
                        <EquipmentSlot imgSrc={Config.IMAGES.boots} altText="Бутси" label="Бутси"/>
                    </div>
                </div>
                <button onClick={onNext} className={styles.switchButton} disabled={allCharacters.length <= 1}>›</button>
            </div>
            <div className={styles.characterStatsGrid}>
                <StatDisplay iconSrc={Config.IMAGES.arm} value={Math.round(displayedCharacter.power)} label="Сила"/>
                <StatDisplay iconSrc={Config.IMAGES.target} value={displayedCharacter.talent} label="Талант"/>
                <StatDisplay iconNode={<AgeIcon className={styles.statIcon}/>} value={displayedCharacter.age}
                             label="Вік"/>
            </div>
            {!isMainCharacter && (
                <button onClick={onSetMain} className={styles.makeMainButton} disabled={isSettingMain}>
                    {isSettingMain ? 'Зберігаємо...' : '🌟 Зробити основним'}
                </button>
            )}
        </div>
    );
};

const InventorySection = ({items, onOpenBox, isOpening}) => (
    <div className={styles.inventorySection}>
        <div className={styles.inventoryGrid}>
            {items.map((item, index) => (
                <InventorySlot
                    key={item.type || `empty-${index}`}
                    item={item}
                    onOpen={onOpenBox}
                    isOpening={isOpening}
                />
            ))}
        </div>
    </div>
);

// --- ГОЛОВНИЙ КОМПОНЕНТ МОДАЛЬНОГО ВІКНА ---

export const InventoryModal = ({user, onClose, onUserUpdate}) => {
    const [isOpening, setIsOpening] = useState(false);
    const [rewards, setRewards] = useState(null);
    const [openedBoxImage, setOpenedBoxImage] = useState(null);
    const [allCharacters, setAllCharacters] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSettingMain, setIsSettingMain] = useState(false);

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
        setRewards(null);
        setOpenedBoxImage(boxImage);
        const oldMoney = user.money;
        const oldEnergy = user.energy;
        try {
            const updatedUser = await openLootBoxAPI(user.user_id, boxType);
            const moneyReward = (updatedUser.money ?? 0) - (oldMoney ?? 0);
            const energyReward = (updatedUser.energy ?? 0) - (oldEnergy ?? 0);
            setTimeout(() => {
                setRewards({money: moneyReward, energy: energyReward});
            }, 1500);
            setTimeout(() => {
                onUserUpdate(updatedUser);
                setIsOpening(false);
                setRewards(null);
            }, 4000);
        } catch (error) {
            showAlert(error.message);
            setIsOpening(false);
        }
    };

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
    // ✅ 1. ПЕРЕМЕННАЯ ДЛЯ РЕГУЛИРОВКИ ВЕРТИКАЛЬНОГО СДВИГА
    // Вы можете легко изменить это значение. Отрицательное - сдвиг вверх.
    const COMPACT_VERTICAL_SHIFT = '-40px';
    const containerStyle = !isMainCharacter
        ? {'--compact-vertical-shift': COMPACT_VERTICAL_SHIFT}
        : {};
    return (
        <ModalRoot onClose={onClose}>
            <ModalBox onClose={onClose}>
                <div
                    className={`${styles.inventoryContainer} ${!isMainCharacter ? styles.scaledDown : ''}`}
                    style={containerStyle}
                >
                    <UserResources user={user}/>
                    <CharacterHub
                        user={user}
                        allCharacters={allCharacters}
                        currentIndex={currentIndex}
                        onPrev={handlePrev}
                        onNext={handleNext}
                        onSetMain={handleSetMain}
                        isSettingMain={isSettingMain}
                        isMainCharacter={isMainCharacter}
                    />
                    <InventorySection
                        items={inventoryItems}
                        onOpenBox={handleOpenBox}
                        isOpening={isOpening}
                    />
                </div>


                <AnimatePresence>
                    {isOpening && (
                        <motion.div className={styles.animationOverlay} initial={{opacity: 0}} animate={{opacity: 1}}
                                    exit={{opacity: 0}}>
                            {!rewards ? (
                                <motion.img src={openedBoxImage} alt="Opening box..." className={styles.openingBox}
                                            initial={{scale: 0.5, y: 100}}
                                            animate={{scale: 1, y: 0, rotate: [0, -15, 15, -15, 15, 0]}}
                                            transition={{type: "spring", stiffness: 200, damping: 10}}
                                />
                            ) : (
                                <motion.div className={styles.rewardContainer} initial={{scale: 0.8, opacity: 0}}
                                            animate={{scale: 1, opacity: 1}}>
                                    <h2 className={styles.rewardTitle}>Отримано!</h2>
                                    <p className={styles.rewardItem}><img src={Config.IMAGES.money_icon}
                                                                          alt="Money"/> +{rewards.money}</p>
                                    <p className={styles.rewardItem}><img src={Config.IMAGES.energy_icon}
                                                                          alt="Energy"/> +{rewards.energy}</p>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </ModalBox>
        </ModalRoot>
    );
};