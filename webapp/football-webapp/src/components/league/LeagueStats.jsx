import React, { useEffect, useState } from 'react';
import styles from '../../css_files/league/League.module.css';
import { API_BASE_URL } from "../../api.js";
import { FaBolt, FaUserAstronaut, FaGem } from 'react-icons/fa';

const LeagueStats = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Используем наш новый эндпоинт
                const res = await fetch(`${API_BASE_URL}/users/general-stats`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (e) {
                console.error("Failed to load league stats", e);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return <div className={styles.placeholderText}>Завантаження статистики...</div>;
    }

    if (!stats) {
        return <div className={styles.placeholderText}>Дані відсутні</div>;
    }

    return (
        <div className={styles.statsContainer}>

            {/* 1. STRONGEST TEAM */}
            <div className={`${styles.statCard} ${styles.cardPower}`}>
                <div className={styles.statInfo}>
                    <div className={styles.statIconBox} style={{ color: '#FFD700' }}>
                        <FaBolt />
                    </div>
                    <div className={styles.statTexts}>
                        <div className={styles.statLabel}>НАЙСИЛЬНІША КОМАНДА</div>
                        <div className={styles.statMainName}>{stats.strongest_team.team_name}</div>
                        <div className={styles.statSubName}>{stats.strongest_team.user_name}</div>
                    </div>
                </div>
                <div className={styles.statValueBox}>
                    <div className={`${styles.statValue} ${styles.valPower}`}>
                        {stats.strongest_team.value}
                    </div>
                    <div className={styles.statUnit}>PWR</div>
                </div>
            </div>

            {/* 2. STRONGEST PLAYER */}
            <div className={`${styles.statCard} ${styles.cardPlayer}`}>
                <div className={styles.statInfo}>
                    <div className={styles.statIconBox} style={{ color: '#00F2FF' }}>
                        <FaUserAstronaut />
                    </div>
                    <div className={styles.statTexts}>
                        <div className={styles.statLabel}>НАЙСИЛЬНІШИЙ ГРАВЕЦЬ</div>
                        <div className={styles.statMainName}>{stats.strongest_player.character_name}</div>
                        <div className={styles.statSubName}>{stats.strongest_player.team_name}</div>
                    </div>
                </div>
                <div className={styles.statValueBox}>
                    <div className={`${styles.statValue} ${styles.valPlayer}`}>
                        {stats.strongest_player.value}
                    </div>
                    <div className={styles.statUnit}>RATING</div>
                </div>
            </div>

            {/* 3. MOST EXPENSIVE TEAM */}
            <div className={`${styles.statCard} ${styles.cardRich}`}>
                <div className={styles.statInfo}>
                    <div className={styles.statIconBox} style={{ color: '#F700FF' }}>
                        <FaGem />
                    </div>
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

        </div>
    );
};

export default LeagueStats;