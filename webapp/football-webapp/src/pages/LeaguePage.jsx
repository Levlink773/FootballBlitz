import React, { useState } from 'react';
import { Header } from "../components/Header.jsx";
import { NavigationBar } from "../components/NavigationBar.jsx";
import Config from "../config.js";
import styles from '../css_files/Main.module.css'; // Загальні стилі сторінки
import leagueStyles from '../css_files/league/League.module.css'; // Нові стилі ліги
import SeasonHeader from "../components/league/SeasonHeader.jsx";
import LeagueStats from "../components/league/LeagueStats.jsx";
import LeagueRegisterButton from "../components/league/LeagueRegisterButton.jsx";
import LeagueLeaderboard from "../components/league/LeagueLeaderboard.jsx";

const LeaguePage = ({ user, setUser }) => {
    // Стан для перемикання табів ('competitions' або 'stats')
    const [activeTab, setActiveTab] = useState('competitions');

    return (
        <div className={styles.page}>
            <img className={styles.pageBackgroundBlur} src={Config.IMAGES.rating_background} alt="" />

            <div className={styles.mainContainer}>
                {/* 1. GLOBAL HEADER */}
                <Header user={user} />

                <img
                    src={Config.IMAGES.rating_background}
                    alt="background"
                    className={styles.backgroundImage}
                />

                {/* 2. SEASON HEADER (Heavy Metal Style) */}
                {/* Він має свій власний absolute positioning або margin у своєму CSS */}
                <SeasonHeader user={user} />

                {/* 3. LEAGUE CONTENT CONTAINER (Tabs + Box) */}
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
                            className={`${leagueStyles.tabButton} ${activeTab === 'stats' ? leagueStyles.activeTab : ''}`}
                            onClick={() => setActiveTab('stats')}
                        >
                            Статистика
                        </button>
                    </div>

                    {/* Основний Бокс Контенту (З світінням) */}
                    {/* Основний Бокс Контенту */}
                    <div className={leagueStyles.contentBox}>

                        {activeTab === 'competitions' ? (
                            <div style={{width: '100%', height: '100%', display: 'flex', flexDirection: 'column'}}>
                                {/* 1. КНОПКА РЕЄСТРАЦІЇ */}
                                <LeagueRegisterButton user={user} onUserUpdate={setUser} />

                                {/* 2. ЛІДЕРБОРД (Топ 3 + Твоє місце) */}
                                <LeagueLeaderboard user={user} />
                            </div>
                        ) : (
                            <LeagueStats />
                        )}

                    </div>

                </div>

                {/* 4. NAVIGATION BAR */}
                <NavigationBar />
            </div>
        </div>
    );
};

export default LeaguePage;