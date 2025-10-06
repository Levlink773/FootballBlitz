import React, {useEffect, useState} from "react";
import styles from '../css_files/Main.module.css';
import {Header} from "../components/Header.jsx";
import {VipBanner} from "../components/main_components/VipBanner.jsx";
import {UserProfile} from "../components/main_components/UserProfile.jsx";
import {DailyTasks} from "../components/main_components/DailyTasks.jsx";
import {StatsPanel} from "../components/main_components/StatsPanel.jsx";
import {NavigationBar} from "../components/NavigationBar.jsx";
import Config from "../config.js";
import EventCard from "../components/main_components/EventCard.jsx";
import {CreateTeamModal} from "../components/register/CreateModalTeamName.jsx";
// ✨ Import the new modal
import {GetFirstCharacterModal} from "../components/register/GetFirstCharacterModal.jsx";
import {showAlert, showInfoModal} from "../alertService.jsx";
import {VipBannerActive} from "../components/main_components/VipBannerActive.jsx";

export const Main = ({user, setUser}) => {
    console.log("USer: ", user);
    const vip_pass_status = user?.vip_pass_is_active;
    console.log("VIP status: ", vip_pass_status);

    // Callback for when the team name is successfully created
    const handleTeamCreated = (updatedUser) => {
        setUser(updatedUser); // ✨ Обновляем состояние в App.jsx
    };

    // Callback for when the character is claimed
    const handleCharacterClaimed = (updatedUserWithNewStatus) => {
        // Сервер вернул пользователя со статусом FIRST_TRAINING
        // Мы обновляем состояние на уровне всего приложения
        setUser(updatedUserWithNewStatus);
    };

    const showCreateTeamModal = user && user.status_register === "CREATE_TEAM";
    const showGetCharacterModal = user && user.status_register === "GET_FIRST_CHARACTER";
    useEffect(() => {
        // Создаем асинхронную функцию внутри useEffect
        const updateUserStatus = async () => {
            // Проверяем, что у пользователя именно статус 'TRANSFER'
            if (user?.status_register === 'FIRST_TRAINING') {
                try {
                    const msg = `
🔹 Тренер:
Ти в Головному меню. Тут видно характеристики гравця, VIP-статус, статистику та інші важливі дані.
А зараз — час на перше тренування. Тисни Ок -> «Тренування» і починаємо!
                    `;
                    showInfoModal({
                        image: Config.IMAGES.main_info, // або просто "/assets/images/success_icon.png"
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
    const date = new Date(user.vip_pass_expiration_date);
    const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

    console.log(formattedDate); // например: "2025.10.05"
    return (
        <div className={styles.page}>
            <div className={styles.mainContainer} data-modal-root>
                {/* --- REGISTRATION MODALS --- */}
                {showCreateTeamModal && (
                    <CreateTeamModal user={user} onTeamCreated={handleTeamCreated}/>
                )}
                {showGetCharacterModal && (
                    <GetFirstCharacterModal user={user} onCharacterClaimed={handleCharacterClaimed}/>
                )}
                {/* --- END REGISTRATION MODALS --- */}


                {/* Main page content */}
                <img className={styles.backgroundImage} src={Config.IMAGES.background} alt="background"/>
                <Header user={user}/>
                {vip_pass_status ? (
                    <VipBannerActive expiryDate={formattedDate}/>
                ) : (

                    <VipBanner/>
                )
                }
                <UserProfile user={user}/>
                <DailyTasks/>
                <div className={styles.eventCardWrapperEventMain}>
                    <EventCard user={user} onUserUpdate={setUser}/>
                </div>
                <StatsPanel user={user}/>
                <NavigationBar/>
            </div>
        </div>
    );
};