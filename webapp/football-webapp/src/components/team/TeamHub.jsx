// src/components/team/TeamHub.jsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '../../css_files/team/Team.module.css';
import Config from '../../config.js';
import { API_BASE_URL } from '../../api.js';
import TrainingBlock from "../main_components/TrainingBlock.jsx";
import TrainingBlockTeam from "./TrainingBlockTeam.jsx";

// 🔥 Імпорт нового блоку тренування

// --- API Helpers ---
const fetchAllCharactersAPI = (userId) => fetch(`${API_BASE_URL}/users/${userId}/all`);

const saveSquadAPI = (userId, squadMap) => {
    const payload = {
        gk: squadMap.gk.map(p => p ? p.id : null),
        def: squadMap.def.map(p => p ? p.id : null),
        mid: squadMap.mid.map(p => p ? p.id : null),
        att: squadMap.att.map(p => p ? p.id : null)
    };
    return fetch(`${API_BASE_URL}/users/${userId}/save-squad`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
};

const getCharacterRarityInfo = (character) => {
    const { talent, age } = character;

    // EXCLUSIVE LOGIC
    if (talent >= 9) {
        if (age > 30) {
            return { type: 'RARE', label: 'RARE CARD', styleClass: styles.rarityRare };
        }
        return { type: 'EXCLUSIVE', label: 'EXCLUSIVE CARD', styleClass: styles.rarityExclusive };
    }

    // RARE LOGIC
    if (talent >= 7 && talent <= 8) {
        return { type: 'RARE', label: 'RARE CARD', styleClass: styles.rarityRare };
    }

    // STANDARD LOGIC
    return { type: 'STANDARD', label: 'STANDARD CARD', styleClass: styles.rarityStandard };
};

const PlayerDetailView = ({ character, onClose, isMain }) => {
    if (!character) return null;

    const posMap = {
        'GOALKEEPER': 'ВОРОТАР',
        'DEFENDER': 'ЗАХИСНИК',
        'MIDFIELDER': 'ПІВЗАХИСНИК',
        'ATTACKER': 'НАПАДНИК'
    };
    const positionLabel = posMap[character.position] || character.position || "ГРАВЕЦЬ";

    // 2. Отримуємо інфо про рідкість
    const rarityInfo = getCharacterRarityInfo(character);

    return (
        <motion.div
            className={styles.modalBackdrop}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            {/* 3. Додаємо клас рідкості до контейнера */}
            <motion.div
                className={`${styles.detailContainer} ${rarityInfo.styleClass}`}
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={styles.detailHeader}>
                    <button className={styles.backButton} onClick={onClose}>
                        ‹ Команда
                    </button>
                    <div className={styles.detailPositionBadge}>
                        {positionLabel}
                    </div>
                </div>

                {/* Hero Section */}
                <div className={styles.heroSection}>
                    <div className={styles.equipColumn}>
                        <div className={styles.equipSlot} title="Футболка">
                            <img src={Config.IMAGES.tshirt} alt="Shirt" className={styles.equipImage} />
                        </div>
                        <div className={styles.equipSlot} title="Шорти">
                            <img src={Config.IMAGES.shorts} alt="Shorts" className={styles.equipImage} />
                        </div>
                    </div>

                    <div className={styles.avatarContainer}>
                        {/* 4. Додаємо бейдж рідкості над аватаром */}
                        <div className={styles.rarityBadge}>{rarityInfo.label}</div>

                        <div className={styles.avatarGlow}></div>
                        <img
                            src={Config.IMAGES.avatar_uk}
                            alt={character.name}
                            className={styles.avatarImg}
                        />
                        <div className={styles.charInfo}>
                            <h3 className={styles.charName}>{character.name}</h3>
                            <p className={styles.charTeam}>{character.country || "Команда"}</p>
                        </div>
                    </div>

                    <div className={styles.equipColumn}>
                        <div className={styles.equipSlot} title="Гетри">
                            <img src={Config.IMAGES.gaiters} alt="Gaiters" className={styles.equipImage} />
                        </div>
                        <div className={styles.equipSlot} title="Бутси">
                            <img src={Config.IMAGES.boots} alt="Boots" className={styles.equipImage} />
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className={styles.statsContainer}>
                    <div className={styles.statCard}>
                        <img src={Config.IMAGES.arm} alt="Power" style={{ width: 20, marginBottom: 4 }} />
                        <span className={styles.statVal}>{Math.round(character.power)}</span>
                        <span className={styles.statLbl}>Сила</span>
                    </div>
                    <div className={styles.statCard}>
                        <img src={Config.IMAGES.target} alt="Talent" style={{ width: 20, marginBottom: 4 }} />
                        <span className={styles.statVal}>{character.talent}</span>
                        <span className={styles.statLbl}>Талант</span>
                    </div>
                    <div className={styles.statCard}>
                        <span style={{ fontSize: 20, marginBottom: 4 }}>🎂</span>
                        <span className={styles.statVal}>{character.age}</span>
                        <span className={styles.statLbl}>Вік</span>
                    </div>
                </div>

                <div className={styles.slotsSection}>
                    <div className={styles.slotsTitle}>Слоти гравця</div>
                    <div className={styles.slotsGrid}>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className={styles.emptyFeatureSlot} title="Пустий слот"></div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- UI Components ---

const PitchSlot = ({ player, onClick, positionLabel, isSelected }) => {

    // Логіка визначення класу рідкості для іконки на полі
    let rarityClass = '';

    if (player) {
        const { talent, age } = player;

        // EXCLUSIVE: Талант 9+, вік <= 30
        if (talent >= 9 && age <= 30) {
            rarityClass = styles.slotExclusive;
        }
        // RARE: Талант 7-8 АБО (Талант 9+ і вік > 30)
        else if ((talent >= 7 && talent <= 8) || (talent >= 9 && age > 30)) {
            rarityClass = styles.slotRare;
        }
        // STANDARD: Всі інші
        else {
            rarityClass = styles.slotStandard;
        }
    }

    return (
        <motion.div
            className={`
                ${styles.playerSlot} 
                ${!player ? styles.empty : ''} 
                ${isSelected ? styles.selected : ''} 
                ${rarityClass} 
            `}
            onClick={onClick}
            whileTap={{ scale: 0.95 }}
        >
            {player ? (
                <>
                    <div className={styles.slotPositionBadge}>{positionLabel}</div>
                    <img
                        src={Config.IMAGES.avatar_uk}
                        alt={player.name}
                        className={styles.playerIconImg}
                    />
                    <span className={styles.playerNameMini}>{player.name}</span>
                    <div className={styles.slotRating}>{Math.round(player.power)}</div>
                </>
            ) : (
                <span className={styles.emptySlotLabel}>{positionLabel}</span>
            )}
        </motion.div>
    );
};

const TeamStatsPanel = ({ stats }) => {
    return (
        <div className={styles.statsPanel}>
            <div className={styles.statsHeader}>КЛУБ</div>
            <StatRow label="Сила" value={stats.totalPower} icon="💪" color="#FFD700" />
            <StatRow label="Ціна" value={`${(stats.totalPrice / 1000).toFixed(1)}k`} icon="💰" color="#4CAF50" />
            <StatRow label="Вік" value={stats.avgAge} icon="🎂" color="#2196F3" />
            <StatRow label="Талант" value={stats.avgTalent} icon="🌟" color="#E91E63" />
        </div>
    );
};

const StatRow = ({ label, value, icon, color }) => (
    <div className={styles.statRow}>
        <span className={styles.statIcon}>{icon}</span>
        <div className={styles.statInfo}>
            <span className={styles.statLabel}>{label}</span>
            <span className={styles.statValue} style={{ color: color }}>{value}</span>
        </div>
    </div>
);

// 🔥 НОВИЙ КОМПОНЕНТ: СЛОТ НА СКАМЕЙЦІ ЗАПАСНИХ
const BenchSlot = ({ player, onClick, isSelected }) => {
    // Визначення класу рідкості
    let rarityClass = '';
    if (player) {
        const { talent, age } = player;
        if (talent >= 9 && age <= 30) {
            rarityClass = styles.slotExclusive;
        } else if ((talent >= 7 && talent <= 8) || (talent >= 9 && age > 30)) {
            rarityClass = styles.slotRare;
        }
    }

    return (
        <motion.div
            className={`${styles.benchSlot} ${isSelected ? styles.selected : ''} ${rarityClass}`}
            onClick={onClick}
            whileTap={{ scale: 0.95 }}
        >
            <img
                src={Config.IMAGES.avatar_uk}
                alt={player.name}
                className={styles.benchPlayerImg}
            />
            <span className={styles.benchPlayerName}>{player.name}</span>
            <div className={styles.benchPlayerPower}>{Math.round(player.power)}</div>
        </motion.div>
    );
};


// --- MAIN COMPONENT ---

// 🔥 Додано onUserUpdate в пропси, щоб TrainingBlock міг оновлювати енергію
export default function TeamHub({ user, onUserUpdate }) {
    const [isLoading, setIsLoading] = useState(true);
    const [allCharacters, setAllCharacters] = useState([]);

    const [squadMap, setSquadMap] = useState({
        gk: [null],
        def: [null, null, null, null],
        mid: [null, null, null, null],
        att: [null, null, null, null]
    });

    const [benchPlayers, setBenchPlayers] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [detailPlayer, setDetailPlayer] = useState(null);

    const [teamStats, setTeamStats] = useState({
        avgAge: 0, avgTalent: 0, totalPower: 0, totalPrice: 0
    });

    // --- Stats Logic ---
    const calculateTeamStats = (activeSquadMap) => {
        const activePlayers = [
            ...activeSquadMap.gk,
            ...activeSquadMap.def,
            ...activeSquadMap.mid,
            ...activeSquadMap.att
        ].filter(p => p !== null);

        if (activePlayers.length === 0) return;

        let totalAge = 0, totalTalent = 0, totalPower = 0, totalPrice = 0;

        activePlayers.forEach(c => {
            totalAge += c.age;
            totalTalent += c.talent;
            totalPower += c.power;
            const price = (c.power * 20) + (c.talent * 60) - (c.age * 15);
            totalPrice += Math.max(0, price);
        });

        setTeamStats({
            avgAge: (totalAge / activePlayers.length).toFixed(1),
            avgTalent: (totalTalent / activePlayers.length).toFixed(1),
            totalPower: Math.round(totalPower),
            totalPrice: Math.round(totalPrice)
        });
    };

    // --- Init Logic ---
    const initializeSquad = (chars) => {
        const hasSavedPos = chars.some(c => c.squad_position);
        let newSquad = { gk: [null], def: Array(4).fill(null), mid: Array(4).fill(null), att: Array(4).fill(null) };
        const usedIds = new Set();
        let newBench = [];

        if (hasSavedPos) {
            chars.forEach(c => {
                if (c.squad_position) {
                    const [sec, idxStr] = c.squad_position.split('_');
                    const idx = parseInt(idxStr, 10);
                    if (newSquad[sec] && idx >= 0 && idx < newSquad[sec].length) {
                        newSquad[sec][idx] = c;
                        usedIds.add(c.id);
                    }
                }
            });
            newBench = chars.filter(c => !usedIds.has(c.id)).sort((a, b) => b.power - a.power);
        } else {
            const sortedChars = [...chars].sort((a, b) => b.power - a.power);
            const fillLine = (posName, sec, limit) => {
                const candidates = sortedChars.filter(c => c.position === posName && !usedIds.has(c.id));
                for (let i = 0; i < limit && i < candidates.length; i++) {
                    newSquad[sec][i] = candidates[i];
                    usedIds.add(candidates[i].id);
                }
            };
            fillLine('GOALKEEPER', 'gk', 1);
            fillLine('DEFENDER', 'def', 4);
            fillLine('MIDFIELDER', 'mid', 4);
            fillLine('ATTACKER', 'att', 4);
            newBench = sortedChars.filter(c => !usedIds.has(c.id));
            saveSquadAPI(user.user_id, newSquad).catch(console.error);
        }

        setSquadMap(newSquad);
        setBenchPlayers(newBench);
        calculateTeamStats(newSquad);
    };

    useEffect(() => {
        if (!user?.user_id) return;
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
                console.error("Failed to load team data", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [user.user_id]);

    const handleSlotClick = (section, index, player) => {
        if (!selectedSlot) {
            setSelectedSlot({ section, index, player });
            return;
        }

        if (selectedSlot.section === section && selectedSlot.index === index) {
            if (player) {
                setDetailPlayer(player);
            }
            setSelectedSlot(null);
            return;
        }

        // 🔥 Нова логіка: якщо вибрано гравця зі скамейки
        if (selectedSlot.section === 'bench') {
            const newSquad = { ...squadMap };
            const fieldPlayer = newSquad[section][index];

            // Ставимо гравця зі скамейки на поле
            newSquad[section][index] = selectedSlot.player;

            // Оновлюємо скамейку
            const newBench = benchPlayers.filter((_, i) => i !== selectedSlot.index);
            if (fieldPlayer) {
                newBench.push(fieldPlayer);
            }

            setSquadMap(newSquad);
            setBenchPlayers(newBench.sort((a, b) => b.power - a.power));
            setSelectedSlot(null);
            calculateTeamStats(newSquad);
            saveSquadAPI(user.user_id, newSquad).catch(console.error);
            return;
        }

        // Звичайна логіка обміну між слотами на полі
        const newSquad = { ...squadMap };
        const playerA = newSquad[selectedSlot.section][selectedSlot.index];
        const playerB = newSquad[section][index];

        newSquad[selectedSlot.section][selectedSlot.index] = playerB;
        newSquad[section][index] = playerA;

        setSquadMap(newSquad);
        setSelectedSlot(null);
        calculateTeamStats(newSquad);
        saveSquadAPI(user.user_id, newSquad).catch(console.error);
    };

    const isSelected = (sec, idx) => {
        return selectedSlot && selectedSlot.section === sec && selectedSlot.index === idx;
    };

    // 🔥 НОВА ФУНКЦІЯ: Обробка кліку на гравця зі скамейки
    const handleBenchClick = (player, index) => {
        // Якщо нічого не вибрано - вибираємо гравця зі скамейки
        if (!selectedSlot) {
            setSelectedSlot({ section: 'bench', index, player });
            return;
        }

        // Якщо клікнули на того ж гравця - показуємо деталі
        if (selectedSlot.section === 'bench' && selectedSlot.index === index) {
            setDetailPlayer(player);
            setSelectedSlot(null);
            return;
        }

        // Якщо вибрано гравця з поля - міняємо місцями
        if (selectedSlot.section !== 'bench') {
            const newSquad = { ...squadMap };
            const fieldPlayer = newSquad[selectedSlot.section][selectedSlot.index];

            // Ставимо гравця зі скамейки на поле
            newSquad[selectedSlot.section][selectedSlot.index] = player;

            // Оновлюємо скамейку: прибираємо гравця зі скамейки і додаємо колишнього з поля (якщо є)
            const newBench = benchPlayers.filter((_, i) => i !== index);
            if (fieldPlayer) {
                newBench.push(fieldPlayer);
            }

            setSquadMap(newSquad);
            setBenchPlayers(newBench.sort((a, b) => b.power - a.power));
            setSelectedSlot(null);
            calculateTeamStats(newSquad);
            saveSquadAPI(user.user_id, newSquad).catch(console.error);
        } else {
            // Якщо вибрано іншого гравця зі скамейки - просто перевибираємо
            setSelectedSlot({ section: 'bench', index, player });
        }
    };

    if (isLoading) {
        return <div style={{ color: 'white', textAlign: 'center', marginTop: 40 }}>Завантаження складу...</div>;
    }

    return (
        <div className={styles.hubContainer}>

            {/* ЗАГОЛОВОК І ІНСТРУКЦІЯ */}
            <div className={styles.headerContainer}>
                <h2 className={styles.mainTitle}>Склад Команди</h2>
                <div className={styles.instructionText}>
                    Натисни для вибору, ще раз для деталей. Клік на іншого для заміни.
                </div>
            </div>

            {/* ОБГОРТАЄМО ПОЛЕ І СТАТИСТИКУ В mainLayout */}
            <div className={styles.mainLayout}>

                {/* ПОЛЕ (Зліва) */}
                <div className={styles.pitch}>
                    {/* ATTACK */}
                    <div className={styles.pitchRow}>
                        <span className={styles.pitchLabel}>FWD</span>
                        {squadMap.att.map((p, i) => (
                            <PitchSlot
                                key={`att-${i}`}
                                player={p}
                                positionLabel="FWD"
                                isSelected={isSelected('att', i)}
                                onClick={() => handleSlotClick('att', i, p)}
                            />
                        ))}
                    </div>

                    {/* MIDFIELD */}
                    <div className={styles.pitchRow}>
                        <span className={styles.pitchLabel}>MID</span>
                        {squadMap.mid.map((p, i) => (
                            <PitchSlot
                                key={`mid-${i}`}
                                player={p}
                                positionLabel="MID"
                                isSelected={isSelected('mid', i)}
                                onClick={() => handleSlotClick('mid', i, p)}
                            />
                        ))}
                    </div>

                    {/* DEFENSE */}
                    <div className={styles.pitchRow}>
                        <span className={styles.pitchLabel}>DEF</span>
                        {squadMap.def.map((p, i) => (
                            <PitchSlot
                                key={`def-${i}`}
                                player={p}
                                positionLabel="DEF"
                                isSelected={isSelected('def', i)}
                                onClick={() => handleSlotClick('def', i, p)}
                            />
                        ))}
                    </div>

                    {/* GOALKEEPER */}
                    <div className={styles.pitchRow}>
                        <span className={styles.pitchLabel}>GK</span>
                        <PitchSlot
                            player={squadMap.gk[0]}
                            positionLabel="GK"
                            isSelected={isSelected('gk', 0)}
                            onClick={() => handleSlotClick('gk', 0, squadMap.gk[0])}
                        />
                    </div>
                </div>

                {/* СТАТИСТИКА (Справа) */}
                <TeamStatsPanel stats={teamStats} />

            </div>

            {/* 🔥 СЕКЦІЯ СКАМЕЙКИ ЗАПАСНИХ 🔥 */}
            {benchPlayers.length > 0 && (
                <div className={styles.benchSection}>
                    <div className={styles.benchTitle}>
                        🏟️ Скамейка Запасних <span>({benchPlayers.length})</span>
                    </div>
                    <div className={styles.benchGrid}>
                        {benchPlayers.map((player, index) => (
                            <BenchSlot
                                key={`bench-${player.id}`}
                                player={player}
                                isSelected={selectedSlot?.section === 'bench' && selectedSlot?.index === index}
                                onClick={() => handleBenchClick(player, index)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* 🔥 БЛОК ТРЕНУВАННЯ В САМОМУ НИЗУ 🔥 */}
            <TrainingBlockTeam user={user} onUserUpdate={onUserUpdate} />

            {/* МОДАЛЬНЕ ВІКНО */}
            <AnimatePresence>
                {detailPlayer && (
                    <PlayerDetailView
                        character={detailPlayer}
                        isMain={true}
                        onClose={() => setDetailPlayer(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}