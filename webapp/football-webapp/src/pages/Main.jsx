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
import {GetFirstCharacterModal} from "../components/register/GetFirstCharacterModal.jsx";
import {showAlert, showInfoModal} from "../alertService.jsx";
import {VipBannerActive} from "../components/main_components/VipBannerActive.jsx";

const HighlightArrow = () => {
    return (
        <div className={styles.highlightOverlay}>
            <div className={styles.arrowContainer}>
                <img
                    src={Config.IMAGES.chest_inventory}
                    alt="Inventory"
                    className={styles.inventoryHintIcon}
                />
            </div>
        </div>
    );
};

export const Main = ({ user, setUser }) => {
    console.log("User: ", user);
    const vip_pass_status = user?.vip_pass_is_active;

    const showHighlightArrow = user && user.status_register === "END_REGISTER";

    const handleTeamCreated = (updatedUser) => { setUser(updatedUser); };
    const handleCharacterClaimed = (updatedUserWithNewStatus) => { setUser(updatedUserWithNewStatus); };

    const showCreateTeamModal = user && user.status_register === "CREATE_TEAM";
    const showGetCharacterModal = user && user.status_register === "GET_FIRST_CHARACTER";

    useEffect(() => {
        const updateUserStatus = async () => {
            if (user?.status_register === 'FIRST_TRAINING') {
                try {
                    const msg = `🔹 Тренер:\nТи в Головному меню. Тут видно характеристики гравця, VIP-статус, статистику та інші важливі дані.\nА зараз — час на перше тренування. Тисни Ок -> «Тренування» і починаємо!`;
                    showInfoModal({ image: Config.IMAGES.main_info, text: msg });
                } catch (error) {
                    console.error("Failed to update user status:", error);
                    showAlert("Не вдалося оновити ваш статус. Спробуйте перезавантажити сторінку.");
                }
            }
        };
        updateUserStatus();
    }, [user]);

    const date = new Date(user.vip_pass_expiration_date);
    const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

    return (
        <div className={styles.page}>
            {/* ✨ ДОДАНО: Розмитий фон для заповнення "чорного простору" */}
            <img className={styles.pageBackgroundBlur} src={Config.IMAGES.background} alt="" />

            <div className={styles.mainContainer} data-modal-root>
                {/* --- REGISTRATION MODALS --- */}
                {showCreateTeamModal && <CreateTeamModal user={user} onTeamCreated={handleTeamCreated} />}
                {showGetCharacterModal && <GetFirstCharacterModal user={user} onCharacterClaimed={handleCharacterClaimed} />}

                {/* --- ✨ ПІДКАЗКА --- */}
                {showHighlightArrow && <HighlightArrow />}

                {/* Main page content */}
                <img className={styles.backgroundImage} src={Config.IMAGES.background} alt="background" />
                <Header user={user} />
                {vip_pass_status ? (
                    <VipBannerActive expiryDate={formattedDate} />
                ) : (
                    <VipBanner />
                )}
                <UserProfile user={user} onUserUpdate={setUser} />
                <DailyTasks />
                <div className={styles.eventCardWrapperEventMain}>
                    <EventCard user={user} onUserUpdate={setUser} />
                </div>
                <StatsPanel user={user} />
                <NavigationBar />
            </div>
        </div>
    );
};