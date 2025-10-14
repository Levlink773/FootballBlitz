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

const HighlightArrow = () => {
    return (
        // Этот оверлей затемняет фон, чтобы выделить подсказку
        <div className={styles.highlightOverlay}>
            <div className={styles.arrowContainer}>
                <span className={styles.arrowText}>Тисни на гравця для відкриття інвентаря</span>
                <svg
                    className={styles.arrowSvg}
                    width="100"
                    height="100"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M12 17.5V4.5M12 17.5L8 13.5M12 17.5L16 13.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
        </div>
    );
};

export const Main = ({ user, setUser }) => {
    console.log("User: ", user);
    const vip_pass_status = user?.vip_pass_is_active;
    console.log("VIP status: ", vip_pass_status);

    // ✨ Определяем, нужно ли показывать стрелку
    const showHighlightArrow = user && user.status_register === "END_REGISTER";

    // Callback for when the team name is successfully created
    const handleTeamCreated = (updatedUser) => {
        setUser(updatedUser);
    };

    // Callback for when the character is claimed
    const handleCharacterClaimed = (updatedUserWithNewStatus) => {
        setUser(updatedUserWithNewStatus);
    };

    const showCreateTeamModal = user && user.status_register === "CREATE_TEAM";
    const showGetCharacterModal = user && user.status_register === "GET_FIRST_CHARACTER";

    useEffect(() => {
        const updateUserStatus = async () => {
            if (user?.status_register === 'FIRST_TRAINING') {
                try {
                    const msg = `
🔹 Тренер:
Ти в Головному меню. Тут видно характеристики гравця, VIP-статус, статистику та інші важливі дані.
А зараз — час на перше тренування. Тисни Ок -> «Тренування» і починаємо!
                    `;
                    showInfoModal({
                        image: Config.IMAGES.main_info,
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

    const date = new Date(user.vip_pass_expiration_date);
    const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

    console.log(formattedDate);

    return (
        <div className={styles.page}>
            <div className={styles.mainContainer} data-modal-root>
                {/* --- REGISTRATION MODALS --- */}
                {showCreateTeamModal && (
                    <CreateTeamModal user={user} onTeamCreated={handleTeamCreated} />
                )}
                {showGetCharacterModal && (
                    <GetFirstCharacterModal user={user} onCharacterClaimed={handleCharacterClaimed} />
                )}
                {/* --- END REGISTRATION MODALS --- */}

                {/* --- ✨ НОВЫЙ КОМПОНЕНТ-ПОДСКАЗКА --- */}
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
