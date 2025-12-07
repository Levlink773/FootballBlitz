import React from 'react'; // Прибрали useEffect, він тут більше не потрібен
import {Header} from "../components/Header.jsx";
import Config from "../config.js";
import {NavigationBar} from "../components/NavigationBar.jsx";
import styles from '../css_files/Main.module.css';
import BlitzSchedule from "../components/tournament/BlitzSchedule.jsx";
import EventCard from "../components/main_components/EventCard.jsx";
import {InfoPanel} from "../components/tournament/InfoPanel.jsx";
import BlitzRegistrationInfo from "../components/tournament/BlitzRegistrationInfo.jsx";
// import {showAlert, showInfoModal} from "../alertService.jsx"; // Тут більше не використовуються

export default function TournamentCard({user, setUser}) {
    // Логіку модальних вікон перенесено в EventCard,
    // щоб вона залежала від реального стану турніру (активний/не активний)

    return (
        <div className={styles.page}>
            <img className={styles.pageBackgroundBlur} src={Config.IMAGES.blitz_background} alt="" />
            <div className={styles.mainContainer} data-modal-root>
                <Header user={user}/>
                <img
                    src={Config.IMAGES.blitz_background}
                    alt="background"
                    className={styles.backgroundImage}
                />

                {/* КОНТЕЙНЕР */}
                <div className={styles.tournamentFlexContent}>

                    {/* 1. Розклад */}
                    <div className={styles.scheduleBox}>
                        <BlitzSchedule/>
                    </div>

                    {/* 2. InfoPanel (Трохи вище картки) */}
                    <div className={styles.infoTextUpper}>
                        <InfoPanel/>
                    </div>

                    {/* 3. EventCard (Центр) - Вся логіка туторіалу тепер всередині */}
                    <div className={styles.cardBox}>
                        <EventCard user={user} onUserUpdate={setUser}/>
                    </div>

                    {/* 4. RegistrationInfo (Трохи нижче картки) */}
                    <div className={styles.infoTextLower}>
                        <BlitzRegistrationInfo/>
                    </div>

                </div>

                <NavigationBar/>
            </div>
        </div>
    );
}