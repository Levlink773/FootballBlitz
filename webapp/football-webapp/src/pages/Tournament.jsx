import React, {useState} from 'react';
import {Header} from "../components/Header.jsx";
import Config from "../config.js";
import {NavigationBar} from "../components/NavigationBar.jsx";
import styles from '../css_files/Main.module.css';
import BlitzSchedule from "../components/tournament/BlitzSchedule.jsx";
import EventCard from "../components/main_components/EventCard.jsx";
import {InfoPanel} from "../components/tournament/InfoPanel.jsx";
import BlitzRegistrationInfo from "../components/tournament/BlitzRegistrationInfo.jsx";

export default function TournamentCard({initialUserFromServer}) {
    const [user, setUser] = useState(initialUserFromServer);
    return (
        <div className={styles.page}>
            <div className={styles.mainContainer} data-modal-root>
                <Header user={user}/>
                <img
                    src={Config.IMAGES.blitz_background}
                    alt="background"
                    className={styles.backgroundImage}
                />

                <h3 className={styles.pageTitle}>
                    РОЗКЛАД БЛІЦ ТУРНІРІВ
                </h3>

                <div className={styles.eventCardWrapper}>
                    <BlitzSchedule/>
                </div>

                <InfoPanel/>
                <div className={styles.eventCardWrapperEvent}>
                    <EventCard user={user} onUserUpdate={setUser}/>
                </div>
                <BlitzRegistrationInfo/>
                <NavigationBar/>
            </div>
        </div>
    );
}