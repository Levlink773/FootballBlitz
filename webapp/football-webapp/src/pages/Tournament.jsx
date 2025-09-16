import React from 'react';
import { Header } from "../components/Header.jsx";
import Config from "../config.js";
import { NavigationBar } from "../components/NavigationBar.jsx";
import styles from '../css_files/Main.module.css';
import BlitzSchedule from "../components/tournament/BlitzSchedule.jsx";
import {EventCard} from "../components/main_components/EventCard.jsx";
import {InfoPanel} from "../components/tournament/InfoPanel.jsx";

export default function TournamentCard({ mockUser }) {
    return (
        <div className={styles.mainContainer}>
            <Header user={mockUser} />
            <img
                src={Config.IMAGES.blitz_background}
                alt="background"
                className={styles.backgroundImage}
            />

            <h1 className={styles.pageTitle}>
                РОЗКЛАД БЛІЦ ТУРНІРІВ
            </h1>

            <div className={styles.eventCardWrapper}>
                <BlitzSchedule />
            </div>

            <InfoPanel/>
            <div className={styles.eventCardWrapperEvent}>
                <EventCard />
            </div>
            <NavigationBar />
        </div>
    );
}