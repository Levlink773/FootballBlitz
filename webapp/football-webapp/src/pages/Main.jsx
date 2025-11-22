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
// 🔥 1. Імпортуємо InventoryModal сюди
import {InventoryModal} from "../components/main_components/InventoryModal.jsx";

// ✨ Оновлений компонент підказки, який приймає onClick
const HighlightArrow = ({ onClick }) => {
    return (
        // Додаємо onClick на обгортку або саму іконку
        <div className={styles.highlightOverlay} style={{pointerEvents: 'none'}}>
            {/* pointerEvents: 'none' на оверлеї важливо, щоб кліки проходили,
                АЛЕ ми хочемо, щоб сама іконка була клікабельною */}
            <div
                className={styles.arrowContainer}
                onClick={onClick}
                style={{pointerEvents: 'auto', cursor: 'pointer'}} // Робимо контейнер активним
            >
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

    // 🔥 2. Стан для відкриття інвентарю
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);

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

    // Обробник відкриття інвентарю
    const openInventory = () => setIsInventoryOpen(true);
    const closeInventory = () => setIsInventoryOpen(false);

    return (
        <div className={styles.page}>
            <img className={styles.pageBackgroundBlur} src={Config.IMAGES.background} alt="" />

            <div className={styles.mainContainer} data-modal-root>
                {showCreateTeamModal && <CreateTeamModal user={user} onTeamCreated={handleTeamCreated} />}
                {showGetCharacterModal && <GetFirstCharacterModal user={user} onCharacterClaimed={handleCharacterClaimed} />}

                {/* --- ✨ ПІДКАЗКА (тепер відкриває інвентар) --- */}
                {showHighlightArrow && <HighlightArrow onClick={openInventory} />}

                {/* 🔥 3. Сам модальне вікно інвентарю тепер тут */}
                {isInventoryOpen && (
                    <InventoryModal
                        user={user}
                        onClose={closeInventory}
                        onUserUpdate={setUser}
                    />
                )}

                <img className={styles.backgroundImage} src={Config.IMAGES.background} alt="background" />
                <Header user={user} />

                {vip_pass_status ? (
                    <VipBannerActive expiryDate={formattedDate} />
                ) : (
                    <VipBanner />
                )}

                {/* 🔥 4. Передаємо функцію відкриття в UserProfile,
                    щоб клік по аватару теж працював
                */}
                <UserProfile
                    user={user}
                    onUserUpdate={setUser}
                    onOpenInventory={openInventory}
                />

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