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
import {InventoryModal} from "../components/main_components/InventoryModal.jsx";
import {API_BASE_URL} from "../api.js"; // 🔥 Переконайтеся, що імпортували API URL

// 🔥 1. Імпорт іконки для туторіалу
import { FaGraduationCap } from "react-icons/fa";

// Компонент підказки (Інвентар)
const HighlightArrow = ({ onClick }) => {
    return (
        <div className={styles.highlightOverlay} style={{pointerEvents: 'none'}}>
            <div
                className={styles.arrowContainer}
                onClick={onClick}
                style={{pointerEvents: 'auto', cursor: 'pointer'}}
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

// 🔥 2. Новий компонент кнопки Туторіалу
const TutorialButton = ({ onClick }) => {
    return (
        <div
            className={styles.tutorialContainer}
            onClick={onClick}
        >
            <FaGraduationCap className={styles.tutorialIcon} />
            <span className={styles.tutorialLabel}>HELP</span>
        </div>
    );
};

export const Main = ({ user, setUser }) => {
    // console.log("User: ", user);
    const vip_pass_status = user?.vip_pass_is_active;

    const showHighlightArrow = user && user.status_register === "END_REGISTER";

    // 🔥 3. Умова відображення кнопки (менше 3 тренувань)
    const showTutorialBtn = user && (user.count_of_training < 3);

    const [isInventoryOpen, setIsInventoryOpen] = useState(false);

    const handleTeamCreated = (updatedUser) => { setUser(updatedUser); };
    const handleCharacterClaimed = (updatedUserWithNewStatus) => { setUser(updatedUserWithNewStatus); };

    const showCreateTeamModal = user && user.status_register === "CREATE_TEAM";
    const showGetCharacterModal = user && user.status_register === "GET_FIRST_CHARACTER";

    useEffect(() => {
        const updateUserStatus = async () => {
            if (user?.status_register === 'FIRST_TRAINING') {
                try {
                    const msg = `🔹 Тренер:\nЦе головне меню. Але час не чекає! Тисни Ок -> «Тренування» і починаємо!`;
                    showInfoModal({ image: Config.IMAGES.main_info, text: msg });
                } catch (error) {
                    console.error("Failed to update user status:", error);
                    showAlert("Не вдалося оновити ваш статус. Спробуйте перезавантажити сторінку.");
                }
            }
        };
        updateUserStatus();
    }, [user]);

    // 🔥 4. Логіка натискання на кнопку Туторіалу
    const handleTutorialClick = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/users/${user.user_id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'TRANSFER' }) // Змінюємо статус
            });

            if (!res.ok) throw new Error('Помилка оновлення статусу');

            const updatedUser = await res.json();
            setUser(updatedUser); // Оновлюємо користувача в React, що спричинить редирект (через App.jsx)
        } catch (e) {
            console.error(e);
            showAlert("Щось пішло не так при запуску навчання.");
        }
    };

    const date = new Date(user.vip_pass_expiration_date);
    const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

    const openInventory = () => setIsInventoryOpen(true);
    const closeInventory = () => setIsInventoryOpen(false);

    return (
        <div className={styles.page}>
            <img className={styles.pageBackgroundBlur} src={Config.IMAGES.background} alt="" />

            <div className={styles.mainContainer} data-modal-root>
                {showCreateTeamModal && <CreateTeamModal user={user} onTeamCreated={handleTeamCreated} />}
                {showGetCharacterModal && <GetFirstCharacterModal user={user} onCharacterClaimed={handleCharacterClaimed} />}

                {/* Підказка на інвентар (Скриня) */}
                {showHighlightArrow && <HighlightArrow onClick={openInventory} />}

                {/* 🔥 5. Рендеримо кнопку Туторіалу, якщо виконується умова */}
                {showTutorialBtn && <TutorialButton onClick={handleTutorialClick} />}

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
                <NavigationBar user={user}/>
            </div>
        </div>
    );
};