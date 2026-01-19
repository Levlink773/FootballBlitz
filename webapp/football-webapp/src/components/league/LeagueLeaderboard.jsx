import React, { useState, useEffect } from 'react';
import styles from '../../css_files/league/League.module.css';
import { API_BASE_URL } from "../../api.js";
import { FaCrown, FaUserAstronaut, FaTrophy, FaFire } from 'react-icons/fa';

const LeagueLeaderboard = ({ user }) => {
    const [filter, setFilter] = useState('seasonal'); // seasonal, win_rate, streak
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Запит до твого нового ендпоінту
                const res = await fetch(`${API_BASE_URL}/users/leaderboard?user_id=${user.user_id}&sort_by=${filter}`);
                if (res.ok) {
                    const jsonData = await res.json();
                    setData(jsonData);
                }
            } catch (e) {
                console.error("Leaderboard error:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filter, user.user_id]);

    if (loading) return <div className={styles.placeholderText}>Завантаження топу...</div>;
    if (!data) return <div className={styles.placeholderText}>Дані відсутні</div>;

    const { top_three, user_position } = data;

    // Сортуємо топ-3, щоб правильно розставити по місцях (хоча бекенд вже сортує, але для надійності)
    // Нам треба знайти хто 1-й, 2-й, 3-й
    const firstPlace = top_three.find(u => u.rank === 1);
    const secondPlace = top_three.find(u => u.rank === 2);
    const thirdPlace = top_three.find(u => u.rank === 3);

    return (
        <div className={styles.leaderboardSection}>

            {/* 1. Фільтри */}
            <div className={styles.filterRow}>
                <div
                    className={`${styles.filterPill} ${filter === 'seasonal' ? styles.activePill : ''}`}
                    onClick={() => setFilter('seasonal')}
                >
                    Сезон
                </div>
                <div
                    className={`${styles.filterPill} ${filter === 'win_rate' ? styles.activePill : ''}`}
                    onClick={() => setFilter('win_rate')}
                >
                    % Перемог
                </div>
                <div
                    className={`${styles.filterPill} ${filter === 'streak' ? styles.activePill : ''}`}
                    onClick={() => setFilter('streak')}
                >
                    Серії
                </div>
            </div>

            {/* 2. Подіум (Топ 3) */}
            <div className={styles.podiumContainer}>

                {/* 2-ге місце (Срібло) */}
                {secondPlace && (
                    <div className={`${styles.podiumPlace} ${styles.place2}`}>
                        <div className={styles.avatarWrapper}>
                            <div className={styles.podiumAvatar}>
                                <span style={{color: '#C0C0C0'}}>2</span>
                            </div>
                        </div>
                        <div className={styles.podiumInfo}>
                            <div className={styles.podiumName}>{secondPlace.user_name}</div>
                            <div className={styles.podiumTeam}>{secondPlace.team_name}</div>
                            <div className={`${styles.podiumValue} ${styles.valSilver}`}>
                                {secondPlace.value} <span style={{fontSize: '9px'}}>{secondPlace.unit}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 1-ше місце (Золото) */}
                {firstPlace && (
                    <div className={`${styles.podiumPlace} ${styles.place1}`}>
                        <div className={styles.avatarWrapper}>
                            <FaCrown className={styles.crownIcon} />
                            <div className={styles.podiumAvatar}>
                                <FaUserAstronaut style={{color: '#FFD700'}} />
                            </div>
                        </div>
                        <div className={styles.podiumInfo}>
                            <div className={styles.podiumName}>{firstPlace.user_name}</div>
                            <div className={styles.podiumTeam}>{firstPlace.team_name}</div>
                            <div className={`${styles.podiumValue} ${styles.valGold}`}>
                                {firstPlace.value} <span style={{fontSize: '9px'}}>{firstPlace.unit}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3-тє місце (Бронза) */}
                {thirdPlace && (
                    <div className={`${styles.podiumPlace} ${styles.place3}`}>
                        <div className={styles.avatarWrapper}>
                            <div className={styles.podiumAvatar}>
                                <span style={{color: '#CD7F32'}}>3</span>
                            </div>
                        </div>
                        <div className={styles.podiumInfo}>
                            <div className={styles.podiumName}>{thirdPlace.user_name}</div>
                            <div className={styles.podiumTeam}>{thirdPlace.team_name}</div>
                            <div className={`${styles.podiumValue} ${styles.valBronze}`}>
                                {thirdPlace.value} <span style={{fontSize: '9px'}}>{thirdPlace.unit}</span>
                            </div>
                        </div>
                    </div>
                )}

                {!firstPlace && <div className={styles.placeholderText}>Ще немає лідерів</div>}
            </div>

            {/* 3. Ваша позиція (Sticky Footer) */}
            {user_position && (
                <div className={styles.stickyUserRow}>
                    <div className={styles.rankBadge}>
                        #{user_position.rank}
                    </div>
                    <div className={styles.userInfo}>
                        <div className={styles.userName}>ВИ ({user_position.user_name})</div>
                        <div className={styles.teamName}>{user_position.team_name}</div>
                    </div>
                    <div className={styles.userValueBox}>
                        <div className={styles.userValue}>{user_position.value}</div>
                        <div className={styles.userUnit}>{user_position.unit}</div>
                    </div>
                </div>
            )}

            {!user_position && (
                <div className={styles.stickyUserRow} style={{justifyContent: 'center', opacity: 0.7}}>
                    <div className={styles.teamName}>Ви поки не в рейтингу</div>
                </div>
            )}

        </div>
    );
};

export default LeagueLeaderboard;