import React from 'react';
import { Header } from "../components/Header.jsx";
import Config from "../config.js";
import { NavigationBar } from "../components/NavigationBar.jsx";
import styles from '../css_files/Main.module.css';
import BlitzSchedule from "../components/tournament/BlitzSchedule.jsx";
import {EventCard} from "../components/main_components/EventCard.jsx";

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

            {/* --- ОБНОВЛЕННЫЙ КОНТЕЙНЕР С ИКОНКАМИ И ТЕКСТОМ --- */}
            <div className={styles.infoContainer}>
                {/* Блок с кубком */}
                <div className={styles.infoBlock}>
                    <img
                        src={Config.IMAGES.trophy}
                        alt="trophy"
                        className={styles.infoIcon}
                    />
                    <p>
                        Участь у бліц-турнірах дає енергію, монети та кубки.
                    </p>
                </div>
                {/* Блок с короной */}
                <div className={styles.infoBlock}>
                    <img
                        src={Config.IMAGES.crown}
                        alt="crown"
                        className={styles.infoIcon}
                    />
                    <p>
                        Преміум турніри та інші функції для VIP-користувачів.
                    </p>
                </div>
            </div>
            <div className={styles.eventCardWrapperEvent}>
                <EventCard />
            </div>
            <NavigationBar />
        </div>
    );
}