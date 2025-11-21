import React, {useEffect} from 'react';
import {Header} from "../components/Header.jsx";
import Config from "../config.js";
import {NavigationBar} from "../components/NavigationBar.jsx";
import styles from '../css_files/Main.module.css';
import BlitzSchedule from "../components/tournament/BlitzSchedule.jsx";
import EventCard from "../components/main_components/EventCard.jsx";
import {InfoPanel} from "../components/tournament/InfoPanel.jsx";
import BlitzRegistrationInfo from "../components/tournament/BlitzRegistrationInfo.jsx";
import {showAlert, showInfoModal} from "../alertService.jsx";

export default function TournamentCard({user, setUser}) {
    useEffect(() => {
        const updateUserStatus = async () => {
            if (user?.status_register === 'FIRST_BLITZ') {
                try {
                    const msg = `
🔹 Тренер:
Ласкаво просимо на арену блиц-турнірів! Зареєструйся на найближчий бліц і дивись розклад на день.
Грай у турнірах, вигравай і отримуй нагороди та рейтинг-очки!
             `;
                    showInfoModal({
                        image: Config.IMAGES.blitz_info,
                        text: msg
                    });
                } catch (error) {
                    console.error("Failed to update user status:", error);
                    showAlert("Не вдалося оновити ваш статус. Спробуйте перезавантажити сторінку.");
                }
            }
        };
        updateUserStatus();
    }, [user]);

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

                    {/* 3. EventCard (Центр) */}
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