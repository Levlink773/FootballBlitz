import React from "react";
import styles from './Main.module.css';
import {Header} from "../components/Header.jsx";
import {VipBanner} from "../components/VipBanner.jsx";
import {UserProfile} from "../components/UserProfile.jsx";
import {DailyTasks} from "../components/DailyTasks.jsx";
import {EventCard} from "../components/EventCard.jsx";
import {StatsPanel} from "../components/StatsPanel.jsx";
import {NavigationBar} from "../components/NavigationBar.jsx";

// Припустимо, що об'єкт user має таку структуру
const mockUser = {
    name: "Ronaldo",
    avatarUrl: "../assets/img26.png"
};

export const Main = () => {
    return (
        <div className={styles.mainContainer}>
            <img className={styles.backgroundImage} src="../assets/img1.png" alt="background"/>

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