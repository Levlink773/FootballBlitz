import React from 'react';
import styles from '../../css_files/league/League.module.css';
import {
    FaCrown, FaUserAstronaut, FaArrowUp, FaArrowDown, FaShieldAlt,
    FaChessPawn, FaMedal, FaTrophy, FaGem, FaGlobeAmericas
} from 'react-icons/fa';

// --- КОНФІГУРАЦІЯ ВІДОБРАЖЕННЯ ЛІГ ---
const LEAGUE_DISPLAY_CONFIG = {
    'BRONZE':     { name: 'Бронзова',     color: '#CD7F32', icon: <FaChessPawn /> },
    'SILVER':     { name: 'Срібна',       color: '#C0C0C0', icon: <FaMedal /> },
    'GOLD':       { name: 'Золота',       color: '#FFD700', icon: <FaMedal /> },
    'PLATINUM':   { name: 'Платинова',    color: '#E5E4E2', icon: <FaGem /> },
    'DIAMOND':    { name: 'Діамантова',   color: '#00BFFF', icon: <FaGem /> },
    'MASTER':     { name: 'Майстер',      color: '#9d00ff', icon: <FaCrown /> },
    'GRAND':      { name: 'Гранд',        color: '#FF4444', icon: <FaCrown /> },
    'LEGENDARY':  { name: 'Легендарна',   color: '#FFD700', icon: <FaTrophy /> },
    'WORLD':      { name: 'Світова',      color: '#00F2FF', icon: <FaGlobeAmericas /> },
};

const LeagueLeaderboard = ({ user, data, loading, filter, setFilter }) => {

    if (loading) return <div className={styles.placeholderText}>Завантаження топу...</div>;
    if (!data) return <div className={styles.placeholderText}>Дані відсутні</div>;

    const { top_three, user_position } = data;

    const firstPlace = top_three.find(u => u.rank === 1);
    const secondPlace = top_three.find(u => u.rank === 2);
    const thirdPlace = top_three.find(u => u.rank === 3);

    // --- СТИЛЬ ДЛЯ ЗАГОЛОВКУ (PREMIUM LOOK) ---
    const premiumHeaderStyle = {
        fontSize: '18px',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '2px',
        color: '#FFFFFF',
        marginBottom: '5px',
        textAlign: 'center',
        fontFamily: '"Arial Black", "Impact", sans-serif',
        textShadow: `
            -1px -1px 0 #000,  
            1px -1px 0 #000,
            -1px 1px 0 #000,
            1px 1px 0 #000,
            0 0 15px rgba(255, 215, 0, 0.4)
        `
    };

    const getZoneConfig = (zone) => {
        switch (zone) {
            case 'PROMOTION':
                return { styleClass: styles.rowPromotion, icon: <FaArrowUp />, colorClass: styles.textGreen };
            case 'DEMOTION':
                return { styleClass: styles.rowDemotion, icon: <FaArrowDown />, colorClass: styles.textRed };
            default:
                return { styleClass: styles.rowRetention, icon: <FaShieldAlt />, colorClass: styles.textGold };
        }
    };

    // Підготовка даних користувача
    let userRowContent = null;
    if (user_position) {
        const zoneCfg = getZoneConfig(user_position.zone);
        const userLeagueKey = user?.league || 'BRONZE';
        const leagueDisplay = LEAGUE_DISPLAY_CONFIG[userLeagueKey] || LEAGUE_DISPLAY_CONFIG['BRONZE'];

        // 🔥 FIX: Ensure value is displayed, default to 0 if undefined
        const displayValue = user_position.points !== undefined ? user_position.points : 0;

        userRowContent = (
            <div className={`${styles.stickyUserRow} ${zoneCfg.styleClass}`} style={{ marginBottom: '10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
                <div className={styles.rankBadge}>#{user_position.rank}</div>
                <div className={styles.userInfo}>
                    <div className={styles.userNameRow}>
                        <div className={styles.userName} style={{fontWeight: 'bold', fontSize: '1.1em'}}>{user_position.user_name} (Ви)</div>
                    </div>
                    <div className={styles.leagueBadgeContainer} style={{ borderColor: leagueDisplay.color, background: 'rgba(0,0,0,0.3)' }}>
                        <span style={{ color: leagueDisplay.color, fontSize: '10px' }}>{leagueDisplay.icon}</span>
                        <span style={{ color: leagueDisplay.color }}>{leagueDisplay.name} ліга</span>
                    </div>
                </div>
                <div className={styles.statsRight}>
                    <div className={styles.userValueBox}>
                        <div className={`${styles.userValue} ${zoneCfg.colorClass}`}>
                            {displayValue} {/* 🔥 Shows correct points */}
                        </div>
                        <div className={styles.userUnit}>{user_position.unit || 'PTS'}</div>
                    </div>
                    <div className={`${styles.zoneIconBox} ${zoneCfg.colorClass}`}>
                        {zoneCfg.icon}
                    </div>
                </div>
            </div>
        );
    } else {
        userRowContent = (
            <div className={styles.stickyUserRow} style={{ justifyContent: 'center', opacity: 0.7, marginBottom: '0px' }}>
                <div className={styles.teamName}>Ви поки не в рейтингу</div>
            </div>
        );
    }

    return (
        <div className={styles.leaderboardSection}>

            {/* 1. Ваша позиція (Найвище) */}
            {userRowContent}

            {/* 2. Фільтри із ПРЕМІУМ заголовком */}
            <div>
                <div style={premiumHeaderStyle}>
                    Сортування рейтингу
                </div>

                <div className={styles.filterRow}>
                    <div className={`${styles.filterPill} ${filter === 'seasonal' ? styles.activePill : ''}`} onClick={() => setFilter('seasonal')}>Сезон</div>
                    <div className={`${styles.filterPill} ${filter === 'win_rate' ? styles.activePill : ''}`} onClick={() => setFilter('win_rate')}>% Перемог</div>
                    <div className={`${styles.filterPill} ${filter === 'streak' ? styles.activePill : ''}`} onClick={() => setFilter('streak')}>Серії</div>
                </div>
            </div>

            {/* 3. Подіум (Топ 3) */}
            <div className={styles.podiumContainer} style={{marginTop: '20px'}}>
                {/* 2-ге місце */}
                {secondPlace && (
                    <div className={`${styles.podiumPlace} ${styles.place2}`}>
                        <div className={styles.avatarWrapper}><div className={styles.podiumAvatar}><span style={{ color: '#C0C0C0' }}>2</span></div></div>
                        <div className={styles.podiumInfo}>
                            <div className={styles.podiumName}>{secondPlace.user_name}</div>
                            <div className={`${styles.podiumValue} ${styles.valSilver}`}>
                                {secondPlace.value !== undefined ? secondPlace.value : 0} <span style={{ fontSize: '9px' }}>{secondPlace.unit || 'PTS'}</span>
                            </div>
                        </div>
                    </div>
                )}
                {/* 1-ше місце */}
                {firstPlace && (
                    <div className={`${styles.podiumPlace} ${styles.place1}`}>
                        <div className={styles.avatarWrapper}>
                            <FaCrown className={styles.crownIcon} />
                            <div className={styles.podiumAvatar}><FaUserAstronaut style={{ color: '#FFD700' }} /></div>
                        </div>
                        <div className={styles.podiumInfo}>
                            <div className={styles.podiumName}>{firstPlace.user_name}</div>
                            <div className={`${styles.podiumValue} ${styles.valGold}`}>
                                {firstPlace.value !== undefined ? firstPlace.value : 0} <span style={{ fontSize: '9px' }}>{firstPlace.unit || 'PTS'}</span>
                            </div>
                        </div>
                    </div>
                )}
                {/* 3-тє місце */}
                {thirdPlace && (
                    <div className={`${styles.podiumPlace} ${styles.place3}`}>
                        <div className={styles.avatarWrapper}><div className={styles.podiumAvatar}><span style={{ color: '#CD7F32' }}>3</span></div></div>
                        <div className={styles.podiumInfo}>
                            <div className={styles.podiumName}>{thirdPlace.user_name}</div>
                            <div className={`${styles.podiumValue} ${styles.valBronze}`}>
                                {thirdPlace.value !== undefined ? thirdPlace.value : 0} <span style={{ fontSize: '9px' }}>{thirdPlace.unit || 'PTS'}</span>
                            </div>
                        </div>
                    </div>
                )}
                {!firstPlace && <div className={styles.placeholderText}>Ще немає лідерів</div>}
            </div>

        </div>
    );
};

export default LeagueLeaderboard;