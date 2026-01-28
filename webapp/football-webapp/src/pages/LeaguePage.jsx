import React, { useState, useEffect } from 'react';
import { Header } from "../components/Header.jsx";
import { NavigationBar } from "../components/NavigationBar.jsx";
import Config from "../config.js";
import { API_BASE_URL } from "../api.js";
import styles from '../css_files/Main.module.css';
import leagueStyles from '../css_files/league/League.module.css';

// Components
import SeasonHeader from "../components/league/SeasonHeader.jsx";
import LeagueStats from "../components/league/LeagueStats.jsx";
import LeagueRegisterButton from "../components/league/LeagueRegisterButton.jsx";
import LeagueLeaderboard from "../components/league/LeagueLeaderboard.jsx";
import LeagueHierarchy from "../components/league/LeagueHierarchy.jsx";
import LeagueStatusWidget from "../components/league/LeagueStatusWidget.jsx";
import LeagueWeekly from "../components/league/LeagueWeekly.jsx";
import { SeasonPassPage } from "./SeasonPassPage.jsx"; // 🔥 Імпорт SeasonPassPage

const LeaguePage = ({ user, setUser }) => {
    const [activeTab, setActiveTab] = useState('competitions');
    const [leaderboardFilter, setLeaderboardFilter] = useState('seasonal');
    const [leaderboardData, setLeaderboardData] = useState(null);
    const [leaderboardLoading, setLeaderboardLoading] = useState(true);

    // 🔥 Стан для відкриття Season Pass
    const [isSeasonPassOpen, setIsSeasonPassOpen] = useState(false);

    useEffect(() => {
        if (activeTab !== 'competitions') return;

        const fetchData = async () => {
            setLeaderboardLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/users/leaderboard?user_id=${user.user_id}&sort_by=${leaderboardFilter}`);
                if (res.ok) {
                    const jsonData = await res.json();
                    setLeaderboardData(jsonData);
                }
            } catch (e) {
                console.error("Leaderboard error:", e);
            } finally {
                setLeaderboardLoading(false);
            }
        };
        fetchData();
    }, [leaderboardFilter, user.user_id, activeTab]);

    return (
        <div className={styles.page}>
            <img className={styles.pageBackgroundBlur} src={Config.IMAGES.rating_background} alt="" />

            <div className={styles.mainContainer}>
                {/* 1. GLOBAL HEADER */}
                <Header user={user} />

                {/* 🔥 SEASON PASS MODAL */}
                {isSeasonPassOpen && (
                    <SeasonPassPage
                        user={user}
                        setUser={setUser}
                        onClose={() => setIsSeasonPassOpen(false)}
                        // Тут можна додати логіку для відкриття VIP модалки, якщо вона потрібна
                        onOpenVip={() => console.log("Open VIP Modal")}
                    />
                )}

                <img
                    src={Config.IMAGES.rating_background}
                    alt="background"
                    className={styles.backgroundImage}
                />

                {/* 2. SEASON HEADER (Тепер клікабельний) */}
                {/* Додаємо обгортку або передаємо onClick всередину */}
                <div onClick={() => setIsSeasonPassOpen(true)} style={{ width: '100%', display: 'flex', justifyContent: 'center', zIndex: 10, cursor: 'pointer' }}>
                    <SeasonHeader user={user} />
                </div>

                {/* 3. LEAGUE CONTENT CONTAINER */}
                <div className={leagueStyles.leagueContainer}>

                    {/* Перемикач Табів */}
                    <div className={leagueStyles.tabContainer}>
                        <button
                            className={`${leagueStyles.tabButton} ${activeTab === 'competitions' ? leagueStyles.activeTab : ''}`}
                            onClick={() => setActiveTab('competitions')}
                        >
                            Змагання
                        </button>
                        <button
                            className={`${leagueStyles.tabButton} ${activeTab === 'weekly' ? leagueStyles.activeTab : ''}`}
                            onClick={() => setActiveTab('weekly')}
                        >
                            Тижневі
                        </button>
                        <button
                            className={`${leagueStyles.tabButton} ${activeTab === 'stats' ? leagueStyles.activeTab : ''}`}
                            onClick={() => setActiveTab('stats')}
                        >
                            Таблиця
                        </button>
                    </div>

                    {/* Основний Бокс */}
                    <div className={leagueStyles.contentBox}>
                        {activeTab === 'competitions' && (
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
                                <LeagueRegisterButton user={user} onUserUpdate={setUser} />
                                <LeagueLeaderboard
                                    user={user}
                                    data={leaderboardData}
                                    loading={leaderboardLoading}
                                    filter={leaderboardFilter}
                                    setFilter={setLeaderboardFilter}
                                />
                                <LeagueHierarchy user={user} />
                                {leaderboardFilter === 'seasonal' && leaderboardData?.user_position && (
                                    <div style={{ marginTop: '20px', paddingBottom: '10px' }}>
                                        <LeagueStatusWidget userPosition={leaderboardData.user_position} />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'weekly' && <LeagueWeekly />}
                        {activeTab === 'stats' && <LeagueStats />}
                    </div>
                </div>

                <NavigationBar />
            </div>
        </div>
    );
};

export default LeaguePage;