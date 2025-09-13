import React from "react";
import styles from '../css_files/Main.module.css';
import {Header} from "../components/Header.jsx";
import {VipBanner} from "../components/main_components/VipBanner.jsx";
import {UserProfile} from "../components/main_components/UserProfile.jsx";
import {DailyTasks} from "../components/main_components/DailyTasks.jsx";
import {EventCard} from "../components/main_components/EventCard.jsx";
import {StatsPanel} from "../components/main_components/StatsPanel.jsx";
import {NavigationBar} from "../components/NavigationBar.jsx";
import Config from "../config.js";
// Припустимо, що об'єкт user має таку структуру
const mockUser = {
    name: "Ronaldo",
    avatarUrl: "../assets/avatar.png"
};

export const Main = () => {
    return (
        <div className={styles.mainContainer}>
            <img className={styles.backgroundImage} src={Config.IMAGES.background} alt="background"/>

            <Header user={mockUser} />
            <VipBanner />
            <UserProfile user={mockUser} />
            <DailyTasks />
            <EventCard />
            <StatsPanel />
            <NavigationBar />
        </div>
    );
};