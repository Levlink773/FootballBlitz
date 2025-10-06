import React, {useEffect, useState} from 'react';
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
        // Создаем асинхронную функцию внутри useEffect
        const updateUserStatus = async () => {
            // Проверяем, что у пользователя именно статус 'TRANSFER'
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

        // Вызываем функцию
        updateUserStatus();

        // Хук будет срабатывать при изменении объекта user,
        // но внутреннее условие if не даст ему зациклиться.
    }, [user]);
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