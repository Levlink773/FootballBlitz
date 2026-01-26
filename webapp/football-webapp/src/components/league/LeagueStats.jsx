import React, { useEffect, useState } from 'react';
import styles from '../../css_files/league/League.module.css';
import { API_BASE_URL } from "../../api.js";
// 👇 ПЕРЕВІР ШЛЯХ ДО ТВОЇХ КОМПОНЕНТІВ MODALROOT ТА BOX
import {
    FaBolt, FaUserAstronaut, FaGem,
    FaArrowUp, FaArrowDown, FaShieldAlt,
    FaChessPawn, FaMedal, FaCrown, FaGlobeAmericas, FaTrophy
} from 'react-icons/fa';
import {Box, ModalRoot} from "../modal_components/ModalComponents.jsx";

// --- LEAGUE ICONS CONFIG ---
const LEAGUE_ICONS = {
    'BRONZE':     <FaChessPawn color="#CD7F32" />,
    'SILVER':     <FaMedal color="#C0C0C0" />,
    'GOLD':       <FaMedal color="#FFD700" />,
    'PLATINUM':   <FaGem color="#E5E4E2" />,
    'DIAMOND':    <FaGem color="#00BFFF" />,
    'MASTER':     <FaCrown color="#9d00ff" />,
    'GRAND':      <FaCrown color="#FF4444" />,
    'LEGENDARY':  <FaTrophy color="#FFD700" />,
    'WORLD':      <FaGlobeAmericas color="#00F2FF" />,
};

const LeagueStats = ({ user }) => {
    // --- MAIN DATA STATE ---
    const [stats, setStats] = useState(null);
    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- MODAL STATE ---
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState(null); // 'power', 'player', 'rich'
    const [modalData, setModalData] = useState([]);
    const [modalLoading, setModalLoading] = useState(false);

    // --- INITIAL FETCH ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, rankingsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/users/general-stats`),
                    fetch(`${API_BASE_URL}/users/team-rankings?user_id=${user?.user_id || 0}`)
                ]);

                if (statsRes.ok) setStats(await statsRes.json());
                if (rankingsRes.ok) setRankings(await rankingsRes.json());
            } catch (e) {
                console.error("Failed to load data", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    // --- HANDLER: CLICK ON CARD ---
    // --- HANDLER: CLICK ON CARD ---
    const handleCardClick = async (type) => {
        setModalType(type);
        setModalOpen(true);
        setModalLoading(true);
        setModalData([]);

        // Визначаємо правильні ендпоінти, які ми створили на Python
        let endpoint = '';
        if (type === 'power') endpoint = `${API_BASE_URL}/users/rankings/power`;
        if (type === 'rich') endpoint = `${API_BASE_URL}/users/rankings/value`;
        // Увага: переконайтеся, що на бекенді шлях саме такий (всередині роутера /users)
        if (type === 'player') endpoint = `${API_BASE_URL}/users/rankings/top-players`;

        try {
            // 🔥 РЕАЛЬНИЙ ЗАПИТ
            const res = await fetch(endpoint);

            if (res.ok) {
                const data = await res.json();
                setModalData(data);
            } else {
                console.error("Server returned error:", res.status);
                setModalData([]); // Якщо помилка, показуємо пустий список
            }

        } catch (e) {
            console.error("Failed to fetch modal data", e);
            setModalData([]);
        } finally {
            setModalLoading(false);
        }
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalType(null);
    };

    // --- HELPERS ---
    const getZoneIcon = (zone) => {
        switch (zone) {
            case 'PROMOTION': return <FaArrowUp style={{ color: '#00FF88', fontSize: '12px' }} />;
            case 'DEMOTION': return <FaArrowDown style={{ color: '#FF4444', fontSize: '12px' }} />;
            default: return <FaShieldAlt style={{ color: '#FFD700', fontSize: '12px' }} />;
        }
    };

    const getRowStyle = (zone) => {
        const baseStyle = {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(30, 30, 40, 0.6)', backdropFilter: 'blur(5px)',
            border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px',
            padding: '8px 12px', marginBottom: '6px'
        };
        switch (zone) {
            case 'PROMOTION': return { ...baseStyle, borderLeft: '4px solid #00FF88', background: 'linear-gradient(90deg, rgba(0, 255, 136, 0.1), rgba(30,30,40,0.8))' };
            case 'DEMOTION': return { ...baseStyle, borderLeft: '4px solid #FF4444', background: 'linear-gradient(90deg, rgba(255, 68, 68, 0.1), rgba(30,30,40,0.8))' };
            default: return { ...baseStyle, borderLeft: '4px solid #FFD700', background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.1), rgba(30,30,40,0.8))' };
        }
    };

    const getModalTitle = () => {
        if (modalType === 'power') return { text: "Топ команд за силою", icon: <FaBolt color="#FFD700" size={20}/> };
        if (modalType === 'rich') return { text: "Топ найбагатших команд", icon: <FaGem color="#F700FF" size={20}/> };
        if (modalType === 'player') return { text: "Топ найсильніших гравців", icon: <FaUserAstronaut color="#00F2FF" size={20}/> };
        return { text: "Рейтинг", icon: null };
    };

    // --- RENDER ---
    if (loading) return <div className={styles.placeholderText}>Завантаження...</div>;
    if (!stats) return <div className={styles.placeholderText}>Дані відсутні</div>;

    return (
        <div className={styles.statsContainer}>

            {/* --- 1. ВЕРХНІ КАРТКИ (CLICKABLE) --- */}

            {/* POWER */}
            <div className={`${styles.statCard} ${styles.cardPower}`} onClick={() => handleCardClick('power')}>
                <div className={styles.statInfo}>
                    <div className={styles.statIconBox} style={{ color: '#FFD700' }}><FaBolt /></div>
                    <div className={styles.statTexts}>
                        <div className={styles.statLabel}>НАЙСИЛЬНІША КОМАНДА</div>
                        <div className={styles.statMainName}>{stats.strongest_team.team_name}</div>
                        <div className={styles.statSubName}>{stats.strongest_team.user_name}</div>
                    </div>
                </div>
                <div className={styles.statValueBox}>
                    <div className={`${styles.statValue} ${styles.valPower}`}>{stats.strongest_team.value}</div>
                    <div className={styles.statUnit}>PWR</div>
                </div>
            </div>

            {/* PLAYER */}
            <div className={`${styles.statCard} ${styles.cardPlayer}`} onClick={() => handleCardClick('player')}>
                <div className={styles.statInfo}>
                    <div className={styles.statIconBox} style={{ color: '#00F2FF' }}><FaUserAstronaut /></div>
                    <div className={styles.statTexts}>
                        <div className={styles.statLabel}>НАЙСИЛЬНІШИЙ ГРАВЕЦЬ</div>
                        <div className={styles.statMainName}>{stats.strongest_player.character_name}</div>
                        <div className={styles.statSubName}>{stats.strongest_player.team_name}</div>
                    </div>
                </div>
                <div className={styles.statValueBox}>
                    <div className={`${styles.statValue} ${styles.valPlayer}`}>{stats.strongest_player.value}</div>
                    <div className={styles.statUnit}>RATING</div>
                </div>
            </div>

            {/* RICH */}
            <div className={`${styles.statCard} ${styles.cardRich}`} onClick={() => handleCardClick('rich')}>
                <div className={styles.statInfo}>
                    <div className={styles.statIconBox} style={{ color: '#F700FF' }}><FaGem /></div>
                    <div className={styles.statTexts}>
                        <div className={styles.statLabel}>НАЙДОРОЖЧА КОМАНДА</div>
                        <div className={styles.statMainName}>{stats.expensive_team.team_name}</div>
                        <div className={styles.statSubName}>$$$ CLUB</div>
                    </div>
                </div>
                <div className={styles.statValueBox}>
                    <div className={`${styles.statValue} ${styles.valRich}`}>
                        {stats.expensive_team.value.toLocaleString()}
                    </div>
                    <div className={styles.statUnit}>$ VALUE</div>
                </div>
            </div>


            {/* --- 2. СПИСОК РЕЙТИНГУ --- */}
            <div style={{ marginTop: '25px' }}>
                <div className={styles.tableHeader}>Турнірна Таблиця</div>

                <div className={styles.rankingsList}>
                    {rankings.map((team) => (
                        <div key={team.user_id} style={getRowStyle(team.zone)}>
                            {/* Ліва частина */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                                <div className={styles.rankNum}>#{team.rank}</div>
                                <div className={styles.leagueIcon}>{LEAGUE_ICONS[team.league]}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '5px' }}>
                                    <div className={styles.teamNameList}>
                                        {team.team_name}
                                        {team.user_id === user?.user_id && <span className={styles.youBadge}>YOU</span>}
                                    </div>
                                    <div className={styles.userNameList}>{team.user_name}</div>
                                </div>
                            </div>

                            {/* Права частина */}
                            <div className={styles.valueSection}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <div className={styles.ptsValue}>{team.points ?? 0}</div>
                                    <div className={styles.ptsLabel}>PTS</div>
                                </div>
                                <div className={styles.zoneIconWrapper}>
                                    {getZoneIcon(team.zone)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- 3. MODAL WINDOW --- */}
            {modalOpen && (
                <ModalRoot onClose={closeModal}>
                    <Box onClose={closeModal} style={{ padding: '0' }}>

                        {/* HEADER inside Box */}
                        <div className={styles.modalHeaderBox}>
                            <div className={styles.modalTitle}>
                                {getModalTitle().icon}
                                <span>{getModalTitle().text}</span>
                            </div>
                        </div>

                        {/* CONTENT inside Box */}
                        <div className={styles.modalScrollArea}>
                            {modalLoading ? (
                                <div style={{ textAlign: 'center', padding: '30px', color: '#888' }}>Завантаження...</div>
                            ) : (
                                modalData.length > 0 ? (
                                    modalData.map((item, index) => (
                                        <div key={index} className={styles.modalRow}>
                                            <div className={styles.modalRank}>#{item.rank || index + 1}</div>

                                            {/* Відмальовка залежить від типу списку */}
                                            {modalType === 'player' ? (
                                                <div className={styles.modalInfo}>
                                                    <div className={styles.modalName}>{item.character_name || item.team_name}</div>
                                                    <div className={styles.modalSub}>{item.team_name}</div>
                                                </div>
                                            ) : (
                                                <div className={styles.modalInfo}>
                                                    <div className={styles.modalName}>{item.team_name}</div>
                                                    <div className={styles.modalSub}>{item.user_name}</div>
                                                </div>
                                            )}

                                            <div className={styles.modalValue} style={{
                                                color: modalType === 'power' ? '#FFD700' :
                                                    modalType === 'player' ? '#00F2FF' : '#F700FF'
                                            }}>
                                                {item.value?.toLocaleString()}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>Список порожній</div>
                                )
                            )}
                        </div>
                    </Box>
                </ModalRoot>
            )}

        </div>
    );
};

export default LeagueStats;