import React from 'react';
import styles from '../../css_files/league/LeagueHierarchy.module.css';
import { FaChessPawn, FaMedal, FaTrophy, FaGem, FaCrown, FaGlobeAmericas, FaAngleDoubleUp, FaAngleDoubleDown, FaMinus } from 'react-icons/fa';

const LEAGUES_CONFIG = [
    { id: 'WORLD', name: 'Світова ліга', icon: <FaGlobeAmericas />, color: '#00F2FF', shadow: '0 0 15px #00F2FF' },
    { id: 'LEGENDARY', name: 'Легендарна ліга', icon: <FaTrophy />, color: '#FFD700', shadow: '0 0 15px #FFD700' },
    { id: 'GRAND', name: 'Гранд-ліга', icon: <FaCrown />, color: '#FF4444', shadow: '0 0 10px #FF4444' },
    { id: 'MASTER', name: 'Майстер-ліга', icon: <FaCrown />, color: '#9d00ff', shadow: '0 0 10px #9d00ff' },
    { id: 'DIAMOND', name: 'Діамантова ліга', icon: <FaGem />, color: '#00BFFF', shadow: '0 0 8px #00BFFF' },
    { id: 'PLATINUM', name: 'Платинова ліга', icon: <FaGem />, color: '#E5E4E2', shadow: '0 0 5px #E5E4E2' },
    { id: 'GOLD', name: 'Золота ліга', icon: <FaMedal />, color: '#FFD700', shadow: 'none' },
    { id: 'SILVER', name: 'Срібна ліга', icon: <FaMedal />, color: '#C0C0C0', shadow: 'none' },
    { id: 'BRONZE', name: 'Бронзова ліга', icon: <FaChessPawn />, color: '#CD7F32', shadow: 'none' },
];

const LeagueHierarchy = ({ user }) => {
    // Якщо у юзера ще немає поля league, вважаємо його Бронзою
    const currentLeague = user?.league || 'BRONZE';

    return (
        <div className={styles.hierarchyWrapper}>
            <div className={styles.sectionTitle}>ІЄРАРХІЯ ДИВІЗІОНІВ</div>

            <div className={styles.leaguesList}>
                {LEAGUES_CONFIG.map((league) => {
                    const isActive = league.id === currentLeague;

                    return (
                        <div
                            key={league.id}
                            className={`${styles.leagueCard} ${isActive ? styles.activeCard : ''}`}
                            style={{
                                borderColor: isActive ? league.color : 'rgba(255,255,255,0.1)',
                                boxShadow: isActive ? league.shadow : 'none'
                            }}
                        >
                            {/* Іконка ліги */}
                            <div className={styles.iconBox} style={{ color: league.color }}>
                                {league.icon}
                            </div>

                            {/* Назва */}
                            <div className={styles.nameBox}>
                                <div className={styles.leagueName} style={{ color: isActive ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                                    {league.name}
                                </div>
                                {isActive && <div className={styles.currentBadge}>ВИ ТУТ</div>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Блок з правилами переходу */}
            <div className={styles.rulesContainer}>
                <div className={styles.ruleTitle}>ЯК ПІДНЯТИСЯ?</div>

                <div className={styles.ruleRow}>
                    <div className={styles.ruleIcon} style={{color: '#00FF88'}}><FaAngleDoubleUp /></div>
                    <div className={styles.ruleText}>
                        <span style={{color: '#00FF88'}}>ТОП 15%</span> гравців переходять вище
                    </div>
                </div>

                <div className={styles.ruleRow}>
                    <div className={styles.ruleIcon} style={{color: '#FFD700'}}><FaMinus /></div>
                    <div className={styles.ruleText}>
                        <span style={{color: '#FFD700'}}>СЕРЕДИНА</span> залишається в лізі
                    </div>
                </div>

                <div className={styles.ruleRow}>
                    <div className={styles.ruleIcon} style={{color: '#FF4444'}}><FaAngleDoubleDown /></div>
                    <div className={styles.ruleText}>
                        <span style={{color: '#FF4444'}}>НИЖНІ 15%</span> падають у лігу нижче
                    </div>
                </div>

                <div className={styles.infoNote}>
                    *Результати фіксуються в кінці сезону
                </div>
            </div>
        </div>
    );
};

export default LeagueHierarchy;