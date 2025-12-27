import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useSpring, animated} from 'react-spring';
import styles from '../../css_files/main_css/InventoryModal.module.css';
import Config from '../../config.js';
import {motion, AnimatePresence} from 'framer-motion';
import {showAlert} from '../../alertService.jsx';
import {API_BASE_URL} from '../../api.js';
import {ModalRoot, Box as ModalBox} from "../modal_components/ModalComponents.jsx";
import ReactCanvasConfetti from 'react-canvas-confetti';
import boxOpenSound from '../../assets/public/sounds/lootbox.mp3';
import AgeIconMini from '../mini_components.jsx';
import Confetti from "react-confetti";
import Img77 from '../../assets/public/img65.png';
import {LootBoxOpeningModal} from "../modal_components/LootBoxOpeningModal.jsx";

// =========================================================
// 🛠️ ЗАГАЛЬНІ КОМПОНЕНТИ ТА УТИЛІТИ
// =========================================================

const HeaderBar = ({title}) => (
    <h2 style={{textAlign: 'center', margin: '0 0 16px', fontSize: 20, fontWeight: 700}}>{title}</h2>
);

const SecondaryButton = ({onClick, children, style = {}}) => (
    <button onClick={onClick} style={{
        padding: '8px 12px',
        borderRadius: 8,
        border: '1px solid #555',
        background: '#333',
        color: 'white',
        cursor: 'pointer', ...style
    }}>{children}</button>
);

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

const AnimatedNumber = ({value}) => {
    const {number} = useSpring({from: {number: 0}, number: value, config: {mass: 1, tension: 20, friction: 10}});
    return <animated.span>{number.to(n => n.toFixed(0))}</animated.span>;
};

// --- API ---
const openLootBoxAPI = async (userId, boxType) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/open-box`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({box_type: boxType})
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({detail: 'Unknown error'}));
        throw new Error(errorData.detail || 'Не вдалося відкрити бокс.');
    }
    return response.json();
};
const fetchAllCharactersAPI = (userId) => fetch(`${API_BASE_URL}/users/${userId}/all`);
const fetchReferralCountAPI = (userId) => fetch(`${API_BASE_URL}/users/${userId}/count_of_ref`);
const setMainCharacterAPI = (userId, characterId) => fetch(`${API_BASE_URL}/users/${userId}/set-main`, {
    method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({character_id: characterId})
});

// 🔥 API ДЛЯ ЗБЕРЕЖЕННЯ СКЛАДУ
const saveSquadAPI = (userId, squadMap) => {
    const payload = {
        gk: squadMap.gk.map(p => p ? p.id : null),
        def: squadMap.def.map(p => p ? p.id : null),
        mid: squadMap.mid.map(p => p ? p.id : null),
        att: squadMap.att.map(p => p ? p.id : null)
    };
    return fetch(`${API_BASE_URL}/users/${userId}/save-squad`, {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
    });
};

// --- HEADER З РЕСУРСАМИ ---
const UserResources = ({user, onOpenReferral}) => (
    <div className={styles.resourcesBar}>
        <StatDisplay iconSrc={Config.IMAGES.coin} value={user.money ?? 0} label="Монети"/>
        <motion.button className={styles.referralButton} onClick={onOpenReferral} whileHover={{scale: 1.05}}
                       whileTap={{scale: 0.95}}>
            <img src={Config.IMAGES.referal_character} alt="Ref"
                 style={{width: '24px', height: '24px', marginRight: '4px'}}/> +
        </motion.button>
        <StatDisplay iconSrc={Config.IMAGES.energy} value={user.energy ?? 0} label="Енергія"/>
    </div>
);

// =========================================================
// 🏟️ 1. КОМПОНЕНТИ ПОЛЯ ТА ЛАВКИ
// =========================================================

// Слот на полі
const PitchSlot = ({player, onClick, positionLabel, isEmpty, isSelected}) => {
    return (
        <motion.div
            className={`
                ${styles.playerSlot} 
                ${isEmpty ? styles.empty : ''} 
                ${isSelected ? styles.selected : ''}
            `}
            onClick={onClick}
            whileTap={{scale: 0.95}}
            animate={isSelected ? {
                scale: 1.15,
                borderColor: '#00ff88',
                boxShadow: '0 0 15px rgba(0, 255, 136, 0.5)'
            } : {}}
        >
            {player ? (
                <>
                    <div className={styles.slotPositionBadge}>{positionLabel}</div>
                    <img src={Config.IMAGES.avatar_uk} alt={player.name} className={styles.playerIconImg}/>
                    <span className={styles.playerNameMini}>{player.name}</span>
                    <div className={styles.slotRating}>{Math.round(player.power)}</div>
                </>
            ) : (
                <span className={styles.emptySlotLabel}>{positionLabel}</span>
            )}
        </motion.div>
    );
};

// Лавка запасних (горизонтальний скрол)
const Bench = ({players, onSelect, selectedPlayerId}) => {
    return (
        <div className={styles.benchContainer}>
            <div className={styles.sectionTitle}>Лавка запасних ({players.length})</div>
            <div className={styles.benchScroll}>
                {players.map(player => (
                    <motion.div
                        key={player.id}
                        className={`${styles.benchSlot} ${selectedPlayerId === player.id ? styles.selected : ''}`}
                        onClick={() => onSelect(player)}
                        whileTap={{scale: 0.95}}
                    >
                        <img src={Config.IMAGES.avatar_uk} alt={player.name} className={styles.benchImage}/>
                        <div className={styles.benchInfo}>
                            <span
                                className={styles.benchPos}>{player.position ? player.position.substring(0, 3) : 'UNK'}</span>
                            <span className={styles.benchOvr}>{Math.round(player.power)}</span>
                        </div>
                    </motion.div>
                ))}
                {players.length === 0 && <div className={styles.emptyBenchMsg}>Лавка порожня</div>}
            </div>
        </div>
    );
};

// Компонент Поля
const SquadBoard = ({squadData, onSlotClick, selectedSlot}) => {
    const isSelected = (sec, idx) => selectedSlot && selectedSlot.type === 'field' && selectedSlot.section === sec && selectedSlot.index === idx;

    return (
        <div className={styles.squadContainer}>
            <div className={styles.pitch}>
                {/* ATTACK */}
                <div className={styles.pitchRow}>
                    <span className={styles.pitchLabel}>FWD</span>
                    {squadData.att.map((p, i) => (
                        <PitchSlot key={`att-${i}`} player={p} positionLabel="FWD" isSelected={isSelected('att', i)}
                                   onClick={() => onSlotClick('field', {section: 'att', index: i, player: p})}/>
                    ))}
                </div>
                {/* MIDFIELD */}
                <div className={styles.pitchRow}>
                    <span className={styles.pitchLabel}>MID</span>
                    {squadData.mid.map((p, i) => (
                        <PitchSlot key={`mid-${i}`} player={p} positionLabel="MID" isSelected={isSelected('mid', i)}
                                   onClick={() => onSlotClick('field', {section: 'mid', index: i, player: p})}/>
                    ))}
                </div>
                {/* DEFENSE */}
                <div className={styles.pitchRow}>
                    <span className={styles.pitchLabel}>DEF</span>
                    {squadData.def.map((p, i) => (
                        <PitchSlot key={`def-${i}`} player={p} positionLabel="DEF" isSelected={isSelected('def', i)}
                                   onClick={() => onSlotClick('field', {section: 'def', index: i, player: p})}/>
                    ))}
                </div>
                {/* GOALKEEPER */}
                <div className={styles.pitchRow}>
                    <span className={styles.pitchLabel}>GK</span>
                    <PitchSlot player={squadData.gk[0]} positionLabel="GK" isSelected={isSelected('gk', 0)}
                               onClick={() => onSlotClick('field', {
                                   section: 'gk',
                                   index: 0,
                                   player: squadData.gk[0]
                               })}/>
                </div>
            </div>
        </div>
    );
};

// =========================================================
// 👤 2. КОМПОНЕНТ ДЕТАЛЕЙ ГРАВЦЯ
// =========================================================

// Всередині InventoryModal.jsx

const PlayerDetailView = ({character, onClose, isMain}) => {
    if (!character) return null;

    // Мапінг позицій
    const posMap = {
        'GOALKEEPER': 'ВОРОТАР',
        'DEFENDER': 'ЗАХИСНИК',
        'MIDFIELDER': 'ПІВЗАХИСНИК',
        'ATTACKER': 'НАПАДНИК'
    };
    const positionLabel = posMap[character.position] || character.position || "ГРАВЕЦЬ";

    return (
        <motion.div
            className={styles.detailContainer}
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: 20}}
            transition={{duration: 0.3, ease: "easeOut"}}
        >
            {/* 1. Header */}
            <div className={styles.detailHeader}>
                <button className={styles.backButton} onClick={onClose}>
                    ‹ Команда
                </button>
                <div className={styles.detailPositionBadge}>
                    {positionLabel}
                </div>
            </div>

            {/* 2. Hero Section (Avatar + Equipment) */}
            <div className={styles.heroSection}>
                {/* Left Equips */}
                <div className={styles.equipColumn}>
                    <div className={styles.equipSlot} title="Футболка">
                        <img src={Config.IMAGES.tshirt} alt="Shirt" className={styles.equipImage}/>
                    </div>
                    <div className={styles.equipSlot} title="Шорти">
                        <img src={Config.IMAGES.shorts} alt="Shorts" className={styles.equipImage}/>
                    </div>
                </div>

                {/* Center Avatar */}
                <div className={styles.avatarContainer}>
                    <div className={styles.avatarGlow}></div>
                    <img
                        src={isMain ? Img77 : Config.IMAGES.avatar_uk}
                        alt={character.name}
                        className={styles.avatarImg}
                    />
                    <div className={styles.charInfo}>
                        <h3 className={styles.charName}>{character.name}</h3>
                        <p className={styles.charTeam}>{character.country || "Команда"}</p>
                    </div>
                </div>

                {/* Right Equips */}
                <div className={styles.equipColumn}>
                    <div className={styles.equipSlot} title="Гетри">
                        <img src={Config.IMAGES.gaiters} alt="Gaiters" className={styles.equipImage}/>
                    </div>
                    <div className={styles.equipSlot} title="Бутси">
                        <img src={Config.IMAGES.boots} alt="Boots" className={styles.equipImage}/>
                    </div>
                </div>
            </div>

            {/* 3. Stats Section */}
            <div className={styles.statsContainer}>
                <div className={styles.statCard}>
                    <img src={Config.IMAGES.arm} alt="Power" style={{width: 20, marginBottom: 4}}/>
                    <span className={styles.statVal}>{Math.round(character.power)}</span>
                    <span className={styles.statLbl}>Сила</span>
                </div>
                <div className={styles.statCard}>
                    <img src={Config.IMAGES.target} alt="Talent" style={{width: 20, marginBottom: 4}}/>
                    <span className={styles.statVal}>{character.talent}</span>
                    <span className={styles.statLbl}>Талант</span>
                </div>
                <div className={styles.statCard}>
                    {/* Передаємо size={20} щоб зменшити іконку тортика */}
                    <AgeIconMini size={20} style={{marginBottom: 4}}/>
                    <span className={styles.statVal}>{character.age}</span>
                    <span className={styles.statLbl}>Вік</span>
                </div>
            </div>

            {/* 4. Footer Slots */}
            <div className={styles.slotsSection}>
                <div className={styles.slotsTitle}>Слоти гравця</div>
                <div className={styles.slotsGrid}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <motion.div
                            key={i}
                            className={styles.emptyFeatureSlot}
                            whileHover={{scale: 1.05}}
                            whileTap={{scale: 0.95}}
                            title="Пустий слот"
                        >
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

// =========================================================
// 📦 3. ЗАГАЛЬНИЙ ІНВЕНТАР (Лутбокси)
// =========================================================
const GeneralInventory = ({lootBoxes, onOpenBox, isOpening}) => (
    <div className={styles.benchSection} style={{position: 'relative', top: -24}}>
        <div className={styles.divider}></div>
        <div className={styles.sectionTitle}>Інвентар клубу</div>
        <div className={styles.inventoryGrid}>
            {lootBoxes.map((box, i) => (
                <div key={`box-${i}`}
                     className={`${styles.inventorySlot} ${styles.clickable} ${isOpening ? styles.disabled : ''}`}
                     onClick={() => !isOpening && onOpenBox(box.type, box.image)}
                     title={box.name}
                >
                    <img src={box.image} alt={box.name} className={styles.itemImage}/>
                    <span className={styles.itemCount}>x{box.count}</span>
                </div>
            ))}
            {Array.from({length: Math.max(0, 5 - lootBoxes.length)}).map((_, i) => (
                <div key={`empty-${i}`} className={styles.inventorySlot} style={{opacity: 0.2}}/>
            ))}
        </div>
    </div>
);

// --- РЕФЕРАЛИ ---
const ReferralView = ({user, onBack}) => {
    const [referralCount, setReferralCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isCopied, setIsCopied] = useState(false);
    const referralLink = `https://t.me/football_blitz_bot?start=ref_${user?.user_id}`;

    useEffect(() => {
        if (!user?.user_id) return;
        setIsLoading(true);
        fetchReferralCountAPI(user.user_id)
            .then(res => res.json()).then(data => setReferralCount(data.count || 0))
            .finally(() => setIsLoading(false));
    }, [user?.user_id]);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    return (
        <div style={{padding: 16, maxWidth: 460, margin: '0 auto'}}>
            <HeaderBar title="🌀 Реферальна система"/>
            <div style={{padding: "8px 8px 0"}}>
                <div style={{
                    background: 'var(--surface-highlight)',
                    border: '1px solid var(--surface-border)',
                    borderRadius: 12,
                    padding: "12px",
                    margin: "16px 0",
                    textAlign: 'center'
                }}>
                    🔋 <strong>300 енергії</strong> та 💰 <strong>300 монет</strong>
                </div>
                <div style={{margin: '20px 0', display: 'flex', justifyContent: 'space-between', padding: '0 10px'}}>
                    <span>👥 Твої реферали:</span>
                    <strong>{isLoading ? "..." : referralCount}</strong>
                </div>
                <div style={{
                    padding: 10,
                    background: "rgba(0,0,0,0.2)",
                    borderRadius: 8,
                    wordBreak: 'break-all',
                    textAlign: 'center',
                    fontSize: 14
                }}>
                    {referralLink}
                </div>
                <div style={{display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24}}>
                    <SecondaryButton onClick={onBack}>Назад</SecondaryButton>
                    <GradientButton onClick={handleCopy}>{isCopied ? "Скопійовано!" : "Копіювати"}</GradientButton>
                </div>
            </div>
        </div>
    );
};

// =========================================================
// 🚀 ГОЛОВНИЙ КОМПОНЕНТ
// =========================================================
export const InventoryModal = ({user, onClose, onUserUpdate}) => {
    const [currentView, setCurrentView] = useState('squad');
    const [isLoading, setIsLoading] = useState(true);

    // Дані
    const [allCharacters, setAllCharacters] = useState([]);
    const [squadMap, setSquadMap] = useState({
        gk: [null],
        def: [null, null, null, null],
        mid: [null, null, null, null],
        att: [null, null, null, null]
    });
    const [benchPlayers, setBenchPlayers] = useState([]);

    // Взаємодія { type: 'field'|'bench', section?, index?, player }
    const [selection, setSelection] = useState(null);
    const [selectedCharacter, setSelectedCharacter] = useState(null); // Для деталей

    // Логіка Боксів
    const [isOpening, setIsOpening] = useState(false);
    const [rewards, setRewards] = useState(null);
    const [openedBoxImage, setOpenedBoxImage] = useState(null);
    const [animationPhase, setAnimationPhase] = useState('idle');
    const [showConfettiHappy, setShowConfettiHappy] = useState(false);
    const [isSettingMain, setIsSettingMain] = useState(false);
    // 🔥 ЛОГИКА ОТКРЫТИЯ БОКСА (Новая)
    const [openingBoxType, setOpeningBoxType] = useState(null);

    // Confetti
    const refAnimationInstance = useRef(null);
    const getInstance = useCallback((instance) => {
        refAnimationInstance.current = instance;
    }, []);
    const fireConfetti = useCallback(() => {
        if (refAnimationInstance.current) refAnimationInstance.current({
            origin: {y: 0.6},
            particleCount: 100,
            spread: 70
        });
    }, []);

    // 1. INIT
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const res = await fetchAllCharactersAPI(user.user_id);
                if (res.ok) {
                    const chars = await res.json();
                    setAllCharacters(chars || []);
                    initializeSquad(chars || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user.user_id]);

    // 2. INITIALIZE SQUAD (SMART or SAVED)
    // 2. INITIALIZE SQUAD (SMART or SAVED)
    // 2. INITIALIZE SQUAD (SMART or SAVED)
    const initializeSquad = (chars) => {
        const hasSavedPos = chars.some(c => c.squad_position);

        if (hasSavedPos) {
            // ВІДНОВЛЕННЯ ЗБЕРЕЖЕНОЇ СХЕМИ
            // Створюємо порожню схему з NULL
            const newSquad = {
                gk: [null],
                def: [null, null, null, null],
                mid: [null, null, null, null],
                att: [null, null, null, null]
            };
            const usedIds = new Set();

            // 1. Спочатку розставляємо тих, хто має позицію
            chars.forEach(c => {
                if (c.squad_position) {
                    const [sec, idxStr] = c.squad_position.split('_'); // "def_1"
                    const idx = parseInt(idxStr, 10);

                    // Перевіряємо, чи існує така секція і індекс
                    if (newSquad[sec] && idx >= 0 && idx < newSquad[sec].length) {
                        newSquad[sec][idx] = c; // Ставимо гравця в КОНКРЕТНИЙ слот
                        usedIds.add(c.id);
                    }
                }
            });

            // 2. Решта йде на лавку
            const bench = chars.filter(c => !usedIds.has(c.id));
            // Лавку можна сортувати по силі, це ок
            bench.sort((a, b) => b.power - a.power);

            setSquadMap(newSquad);
            setBenchPlayers(bench);

        } else {
            // ПЕРШИЙ ЗАПУСК - РОЗУМНЕ СОРТУВАННЯ
            smartAutoFillSquad(chars);
        }
    };

    const smartAutoFillSquad = (chars) => {
        // Сортуємо всіх доступних гравців за силою
        const sortedChars = [...chars].sort((a, b) => b.power - a.power);

        const newSquad = {
            gk: [null],
            def: [null, null, null, null],
            mid: [null, null, null, null],
            att: [null, null, null, null]
        };
        const usedIds = new Set();

        // Helper для заповнення лінії
        const fillLine = (posName, sec, limit) => {
            // Знаходимо кандидатів на цю позицію, які ще не використані
            const candidates = sortedChars.filter(c => c.position === posName && !usedIds.has(c.id));

            // Заповнюємо слоти зліва направо (0, 1, 2...)
            for (let i = 0; i < limit && i < candidates.length; i++) {
                newSquad[sec][i] = candidates[i];
                usedIds.add(candidates[i].id);
            }
        };

        fillLine('GOALKEEPER', 'gk', 1);
        fillLine('DEFENDER', 'def', 4);
        fillLine('MIDFIELDER', 'mid', 4);
        fillLine('ATTACKER', 'att', 4);

        // Якщо залишились гравці, вони йдуть на лавку
        const bench = sortedChars.filter(c => !usedIds.has(c.id));

        setSquadMap(newSquad);
        setBenchPlayers(bench);

        // Зберігаємо цю авто-розстановку, щоб вона стала "збереженою"
        saveSquadAPI(user.user_id, newSquad).catch(console.error);
    };

    // 3. INTERACTION (SWAP / SELECT / DETAIL)
    const handleInteraction = (type, payload) => {
        if (!selection) {
            if (payload.player || type === 'field') setSelection({type, ...payload});
            return;
        }

        const isSame = (type === 'field' && selection.type === 'field' && selection.section === payload.section && selection.index === payload.index) ||
            (type === 'bench' && selection.type === 'bench' && selection.player?.id === payload.player?.id);

        if (isSame) {
            if (payload.player) {
                setSelection(null);
                setSelectedCharacter(payload.player);
                setCurrentView('detail');
            } else {
                setSelection(null);
            }
            return;
        }

        // SWAP
        performSwap(selection, {type, ...payload});
    };

    const performSwap = (source, target) => {
        const newSquad = {...squadMap};
        const newBench = [...benchPlayers];

        const getPlayer = (loc) => loc.type === 'bench' ? loc.player : newSquad[loc.section][loc.index];
        const p1 = getPlayer(source);
        const p2 = getPlayer(target);

        if (source.type === 'field' && target.type === 'field') {
            newSquad[source.section][source.index] = p2;
            newSquad[target.section][target.index] = p1;
        } else {
            // Field <-> Bench
            if (source.type === 'bench') {
                const idx = newBench.findIndex(p => p.id === p1.id);
                if (idx > -1) newBench.splice(idx, 1);
                newSquad[target.section][target.index] = p1;
                if (p2) newBench.push(p2);
            } else {
                const idx = newBench.findIndex(p => p.id === p2.id);
                if (idx > -1) newBench.splice(idx, 1);
                newSquad[source.section][source.index] = p2;
                if (p1) newBench.push(p1);
            }
        }

        setSquadMap(newSquad);
        setBenchPlayers(newBench);
        setSelection(null);

        // 🔥 ЗБЕРЕЖЕННЯ НА БЕКЕНД
        saveSquadAPI(user.user_id, newSquad).catch(console.error);
    };

    // 4. MAIN CHARACTER
    const handleSetMain = async (charId) => {
        setIsSettingMain(true);
        try {
            const res = await setMainCharacterAPI(user.user_id, charId);
            if (!res.ok) throw new Error();
            onUserUpdate(await res.json());
            showAlert('Головного гравця змінено!', 'success');
        } catch {
            showAlert('Помилка');
        } finally {
            setIsSettingMain(false);
        }
    };

    // 5. LOOTBOX
    const handleOpenBox = async (type, img) => {
        setIsOpening(true);
        setOpenedBoxImage(img);
        setAnimationPhase('idle');
        setRewards(null);
        const audio = new Audio(boxOpenSound);
        audio.volume = 0.5;
        try {
            const promise = openLootBoxAPI(user.user_id, type);
            setTimeout(() => {
                setAnimationPhase('shaking');
                setTimeout(() => audio.play().catch(() => {
                }), 1500);
            }, 200);
            const updatedUser = await promise;
            setTimeout(() => {
                setRewards({
                    money: (updatedUser.money ?? 0) - (user.money ?? 0),
                    energy: (updatedUser.energy ?? 0) - (user.energy ?? 0)
                });
                setAnimationPhase('revealed');
                fireConfetti();
                setShowConfettiHappy(true);
                setTimeout(() => {
                    onUserUpdate(updatedUser);
                    setRewards(null);
                    setIsOpening(false);
                }, 4000);
            }, 2000);
        } catch (e) {
            showAlert(e.message);
            setIsOpening(false);
        }
    };
    const handleOpenBoxClick = (type) => {
        // Просто устанавливаем тип бокса, который открываем.
        // Это триггернет рендер модалки LootBoxOpeningModal
        setOpeningBoxType(type);
    };

    const handleBoxClose = (updatedUserData) => {
        setOpeningBoxType(null); // Закриваємо модалку відкриття

        // Якщо нам передали оновлені дані - оновлюємо глобальний стейт
        if (updatedUserData && onUserUpdate) {
            console.log("Updating user data after lootbox:", updatedUserData);
            onUserUpdate(updatedUserData);
        }
    };

    const lootBoxes = [
        {type: 'SMALL_BOX', count: user.count_of_small_box, image: Config.IMAGES.box_mini, name: "Малий"},
        {type: 'MEDIUM_BOX', count: user.count_of_medium_box, image: Config.IMAGES.box_medium, name: "Середній"},
        {type: 'LARGE_BOX', count: user.count_of_big_box, image: Config.IMAGES.box_premium, name: "Великий"}
    ].filter(box => box.count > 0);

    const handleBack = () => {
        if (currentView !== 'squad') setCurrentView('squad'); else onClose();
    };

    if (isLoading) return <ModalRoot onClose={onClose} soundOnOpen={null}><ModalBox>
        <div>Завантаження...</div>
    </ModalBox></ModalRoot>;

    return (
        <>
            {/* 🔥 ЭПИЧНАЯ МОДАЛКА ОТКРЫТИЯ (Рендерится поверх всего через Portal) */}
            {openingBoxType && (
                <LootBoxOpeningModal
                    boxType={openingBoxType}
                    userId={user.user_id}
                    onClose={handleBoxClose}
                />
            )}
            <ModalRoot onClose={onClose} soundOnOpen={null}>
                <ModalBox onClose={handleBack}>
                    <ReactCanvasConfetti refConfetti={getInstance} style={{
                        position: 'absolute',
                        pointerEvents: 'none',
                        width: '100%',
                        height: '100%',
                        top: 0,
                        left: 0,
                        zIndex: 9999
                    }}/>
                    {showConfettiHappy &&
                        <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false}
                                  numberOfPieces={400} gravity={0.1}/>}

                    <AnimatePresence mode="wait">
                        {currentView === 'squad' && (
                            <motion.div key="squad" initial={{opacity: 0, x: "-20%"}} animate={{opacity: 1, x: "0%"}}
                                        exit={{opacity: 0, x: "-20%"}} transition={{duration: 0.25}}>
                                <div className={styles.inventoryContainer}>
                                    <UserResources user={user} onOpenReferral={() => setCurrentView('referral')}/>

                                    <div style={{textAlign: 'center', marginBottom: 5, color: '#aaa', fontSize: 11}}>
                                        Натисни для вибору, ще раз для деталей. Клік на іншого для заміни.
                                    </div>

                                    <SquadBoard
                                        squadData={{
                                            gk: squadMap.gk.map(id => id ? id : null),
                                            def: squadMap.def, mid: squadMap.mid, att: squadMap.att
                                        }}
                                        onSlotClick={handleInteraction}
                                        selectedSlot={selection}
                                    />

                                    <GeneralInventory
                                        lootBoxes={lootBoxes}
                                        onOpenBox={(type) => handleOpenBoxClick(type)}
                                        isOpening={!!openingBoxType} // Блокируем клики, если уже открываем
                                    />
                                </div>

                                <AnimatePresence>
                                    {isOpening && (
                                        <motion.div className={styles.animationOverlay} initial={{opacity: 0}}
                                                    animate={{opacity: 1}} exit={{opacity: 0}}>
                                            <AnimatePresence>
                                                {animationPhase !== 'revealed' && (
                                                    <motion.img src={openedBoxImage} className={styles.openingBox}
                                                                animate={animationPhase === 'shaking' ? {
                                                                    rotate: [0, -5, 5, 0],
                                                                    scale: [1, 1.1, 1]
                                                                } : {}}
                                                    />
                                                )}
                                            </AnimatePresence>
                                            {animationPhase === 'revealed' && rewards && (
                                                <motion.div className={styles.rewardContainer}
                                                            animate={{scale: [0.8, 1], opacity: 1}}>
                                                    <h2>+{rewards.money} 💰 / +{rewards.energy} ⚡</h2>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        {currentView === 'detail' && selectedCharacter && (
                            <motion.div key="detail" initial={{opacity: 0, scale: 0.9}} animate={{opacity: 1, scale: 1}}
                                        exit={{opacity: 0, scale: 0.9}} transition={{duration: 0.2}}>
                                <PlayerDetailView
                                    character={selectedCharacter}
                                    onClose={() => setCurrentView('squad')}
                                    onSetMain={handleSetMain}
                                    isSettingMain={isSettingMain}
                                    isMain={selectedCharacter.id === user.main_character_id}
                                />
                            </motion.div>
                        )}

                        {currentView === 'referral' && (
                            <motion.div key="referral" initial={{opacity: 0, x: "100%"}} animate={{opacity: 1, x: "0%"}}
                                        exit={{opacity: 0, x: "100%"}}>
                                <ReferralView user={user} onBack={() => setCurrentView('squad')}/>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </ModalBox>
            </ModalRoot>
        </>
    );
};