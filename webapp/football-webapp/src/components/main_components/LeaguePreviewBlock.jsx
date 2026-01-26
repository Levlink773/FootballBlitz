import React, { useState, useEffect, useMemo } from 'react';
import {
    FaArrowUp, FaArrowDown, FaShieldAlt,
    FaChessPawn, FaMedal, FaGem, FaCrown, FaTrophy, FaGlobeAmericas, FaChevronRight
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import styles from '../../css_files/main_css/LeaguePreviewBlock.module.css';
import { API_BASE_URL } from "../../api.js"; // 🔥 Імпорт API URL

// Конфігурація ліг
const LEAGUE_DISPLAY_CONFIG = {
    'BRONZE':     { name: 'Бронзова',     color: '#CD7F32', bgGradient: 'linear-gradient(135deg, #a67c52 0%, #6a4a3a 100%)', icon: <FaChessPawn /> },
    'SILVER':     { name: 'Срібна',       color: '#C0C0C0', bgGradient: 'linear-gradient(135deg, #e0e0e0 0%, #909090 100%)', icon: <FaMedal /> },
    'GOLD':       { name: 'Золота',       color: '#FFD700', bgGradient: 'linear-gradient(135deg, #ffd700 0%, #b8860b 100%)', icon: <FaMedal /> },
    'PLATINUM':   { name: 'Платинова',    color: '#E5E4E2', bgGradient: 'linear-gradient(135deg, #e5e4e2 0%, #506d84 100%)', icon: <FaGem /> },
    'DIAMOND':    { name: 'Діамантова',   color: '#00BFFF', bgGradient: 'linear-gradient(135deg, #00bfff 0%, #005f99 100%)', icon: <FaGem /> },
    'MASTER':     { name: 'Майстер',      color: '#9d00ff', bgGradient: 'linear-gradient(135deg, #9d00ff 0%, #4b0082 100%)', icon: <FaCrown /> },
    'GRAND':      { name: 'Гранд',        color: '#FF4444', bgGradient: 'linear-gradient(135deg, #ff4444 0%, #8b0000 100%)', icon: <FaCrown /> },
    'LEGENDARY':  { name: 'Легендарна',   color: '#FFD700', bgGradient: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)', icon: <FaTrophy /> },
    'WORLD':      { name: 'Світова',      color: '#00F2FF', bgGradient: 'linear-gradient(135deg, #00f2ff 0%, #008080 100%)', icon: <FaGlobeAmericas /> },
};

// Запасні фрази, якщо сервер не надіслав zone_msg
const BACKUP_MOTIVATION = [
    "Вперед до вершини! 🚀",
    "Ти можеш стати легендою! 🏆",
    "Кожен матч має значення!",
    "Не здавайся, топ близько! 💪",
];

const LeaguePreviewBlock = ({ user }) => {
    const navigate = useNavigate();

    // 🔥 Стейт для даних ліги
    const [leagueStats, setLeagueStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // 🔥 ЗАВАНТАЖЕННЯ ДАНИХ З БЕКЕНДУ
    useEffect(() => {
        if (!user?.user_id) return;

        const fetchLeagueData = async () => {
            try {
                // Перевірте URL! Він має відповідати вашому роутеру (наприклад /users/leaderboard або просто /leaderboard)
                const res = await fetch(`${API_BASE_URL}/users/leaderboard?user_id=${user.user_id}&sort_by=seasonal`);
                if (res.ok) {
                    const data = await res.json();
                    // data.user_position містить rank, zone, zone_msg
                    setLeagueStats(data.user_position);
                }
            } catch (error) {
                console.error("Failed to fetch league stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeagueData();
    }, [user?.user_id]);


    // Отримуємо налаштування візуалу
    const userLeagueKey = user?.league || 'BRONZE';
    const leagueData = LEAGUE_DISPLAY_CONFIG[userLeagueKey] || LEAGUE_DISPLAY_CONFIG['BRONZE'];

    // Випадкова фраза (як запасний варіант)
    const randomBackup = useMemo(() => {
        return BACKUP_MOTIVATION[Math.floor(Math.random() * BACKUP_MOTIVATION.length)];
    }, []);

    // --- ЛОГІКА ЗОНИ (На основі даних з сервера) ---
    const currentZone = leagueStats?.zone || 'RETENTION'; // Якщо ще вантажиться - дефолт
    const currentRank = leagueStats?.rank || '-';

    // Текст мотивації: беремо з сервера (zone_msg), якщо нема - рандом
    const motivationText = leagueStats?.zone_msg || randomBackup;

    let zoneConfig = {
        icon: <FaShieldAlt />,
        color: '#FFD700',
        text: 'Зона збереження',
        styleClass: styles.zoneRetention // Використовуємо класи з CSS (якщо додали їх)
    };

    if (currentZone === 'PROMOTION') {
        zoneConfig = { icon: <FaArrowUp />, color: '#00FF88', text: 'Зона підвищення' };
    } else if (currentZone === 'DEMOTION') {
        zoneConfig = { icon: <FaArrowDown />, color: '#FF4444', text: 'Зона вильоту' };
    }

    const handleClick = () => {
        navigate('/league');
    };

    return (
        <div className={styles.wrapper} onClick={handleClick}>
            {/* Ліва частина: Іконка */}
            <div className={styles.iconContainer} style={{ background: leagueData.bgGradient }}>
                <div className={styles.iconInner}>
                    {leagueData.icon}
                </div>
            </div>

            {/* Центральна частина: Інфо */}
            <div className={styles.infoContainer}>
                <div className={styles.headerRow}>
                    <div className={styles.leagueName} style={{ color: leagueData.color }}>
                        {leagueData.name} ліга
                    </div>
                </div>

                <div className={styles.rankInfo}>
                    <span className={styles.rankText}>Місце:</span>
                    {/* Показуємо спіннер або "...", поки вантажиться */}
                    <span className={styles.rankValue} style={{color: '#fff'}}>
                        {loading ? '...' : `#${currentRank}`}
                    </span>

                    {!loading && (
                        <>
                            <span className={styles.dot}>•</span>
                            <span
                                className={styles.miniZoneText}
                                style={{
                                    color: zoneConfig.color,
                                    borderColor: zoneConfig.color,
                                    background: `${zoneConfig.color}20` // 20% прозорості кольору
                                }}
                            >
                                <span style={{marginRight: 3}}>{zoneConfig.icon}</span>
                                {zoneConfig.text}
                            </span>
                        </>
                    )}
                </div>

                {/* 🔥 МОТИВАЦІЯ (З сервера або рандом) */}
                <div className={styles.motivationText}>
                    "{motivationText}"
                </div>
            </div>

            {/* Права частина: Стрілка */}
            <div className={styles.arrowContainer}>
                <FaChevronRight className={styles.chevron} />
            </div>

            <div className={styles.sheen}></div>
        </div>
    );
};

export default LeaguePreviewBlock;