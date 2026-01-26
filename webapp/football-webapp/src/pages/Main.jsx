import React, { useEffect, useState } from "react";
import styles from '../css_files/Main.module.css';
import { Header } from "../components/Header.jsx";
import { NavigationBar } from "../components/NavigationBar.jsx";
import Config from "../config.js";
import EventCard from "../components/main_components/EventCard.jsx";
import { StatsPanel } from "../components/main_components/StatsPanel.jsx";
import { VipBannerActive } from "../components/main_components/VipBannerActive.jsx"; // Якщо використовується десь всередині

// Registation/Modal components
import { CreateTeamModal } from "../components/register/CreateModalTeamName.jsx";
import { GetFirstCharacterModal } from "../components/register/GetFirstCharacterModal.jsx";
import { showAlert, showInfoModal } from "../alertService.jsx";
import { InventoryModal } from "../components/main_components/InventoryModal.jsx";
import { API_BASE_URL, api } from "../api.js";
import { ModalRoot, VipPromoModalWithTitle } from "../components/modal_components/ModalComponents.jsx";
import { SeasonPassBanner } from "../components/main_components/SeasonPassBanner.jsx";
import { SeasonPassPage } from "./SeasonPassPage.jsx";

// Icons
import {FaBolt, FaStar, FaBirthdayCake, FaShieldAlt, FaUsers, FaCheckCircle, FaDumbbell} from "react-icons/fa";
import TrainingBlock from "../components/main_components/TrainingBlock.jsx";
import TeamStatsCompact from "../components/main_components/TeamStatsCompact.jsx";
import DailyGoalSection from "../components/main_components/DailyGoalSection.jsx";
import LeaguePreviewBlock from "../components/main_components/LeaguePreviewBlock.jsx";

// --- NEW COMPONENT: Compact Team Stats ---
// --- NEW COMPONENT: Compact Team Stats ---

// --- NEW COMPONENT: Daily Goals (Box + Task) ---
export const Main = ({ user, setUser }) => {
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);
    const [isVipPromoOpen, setIsVipPromoOpen] = useState(false);
    const [vipModalContent, setVipModalContent] = useState({ title: null, subtitle: null });
    const [isLoading, setIsLoading] = useState(false);

    // Стани модалок
    const showCreateTeamModal = user && user.status_register === "CREATE_TEAM";
    const showGetCharacterModal = user && user.status_register === "GET_FIRST_CHARACTER";
    const [isSeasonPassOpen, setIsSeasonPassOpen] = useState(false);

    const handleTeamCreated = (updatedUser) => { setUser(updatedUser); };
    const handleCharacterClaimed = (updatedUserWithNewStatus) => { setUser(updatedUserWithNewStatus); };

    const openVipModal = (title = null, subtitle = null) => {
        setVipModalContent({ title, subtitle });
        setIsVipPromoOpen(true);
    };

    const handlePurchase = async (productType, item) => {
        if (!user || !user.user_id) {
            showAlert("Помилка: користувача не знайдено. Будь ласка, перезавантажте сторінку.");
            return;
        }
        setIsLoading(true);
        setIsVipPromoOpen(false);
        try {
            let response;
            const data = { userId: user.user_id };

            switch (productType) {
                case 'vip':
                    response = await api.createVipPayment({ ...data, price: item.price, type: item.type });
                    break;
                default:
                    throw new Error("Unknown product type");
            }

            if (response && response.page_url) {
                window.location.href = response.page_url;
            } else {
                throw new Error("Не вдалося отримати посилання на оплату.");
            }
        } catch (error) {
            console.error("Payment failed:", error);
            showAlert(`Помилка під час створення платежу: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const openInventory = () => setIsInventoryOpen(true);
    const closeInventory = () => setIsInventoryOpen(false);

    // Логіка завершення реєстрації
    useEffect(() => {
        if (user && user.status_register === 'FIRST_TRAINING') {
            const finishRegistration = async () => {
                const msg = `
🔹 Тренер:
Навчання завершено — чудова робота! 🎉
Тепер ти повноцінний менеджер. Прокачуй команду, змагайся в турнірах та піднімайся в рейтингу!
`;
                await showInfoModal({
                    image: Config.IMAGES.training_info,
                    text: msg
                });

                try {
                    const res = await fetch(`${API_BASE_URL}/users/${user.user_id}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'END_REGISTER' })
                    });

                    if (res.ok) {
                        const updatedUser = await res.json();
                        setUser(updatedUser);
                    }
                } catch (e) {
                    console.error("Error finishing registration:", e);
                }
            };
            finishRegistration();
        }
    }, [user, setUser]);

    return (
        <div className={styles.page}>
            <img className={styles.pageBackgroundBlur} src={Config.IMAGES.background} alt="" />

            <div className={styles.mainContainer} data-modal-root>
                {/* Global Modals */}
                {showCreateTeamModal && <CreateTeamModal user={user} onTeamCreated={handleTeamCreated} />}
                {showGetCharacterModal && <GetFirstCharacterModal user={user} onCharacterClaimed={handleCharacterClaimed} />}

                {isInventoryOpen && (
                    <InventoryModal user={user} onClose={closeInventory} onUserUpdate={setUser} />
                )}

                {isVipPromoOpen && (
                    <ModalRoot>
                        <VipPromoModalWithTitle
                            onClose={() => setIsVipPromoOpen(false)}
                            onSubscribe={(option) => handlePurchase('vip', option)}
                            title={vipModalContent.title}
                            subtitle={vipModalContent.subtitle}
                        />
                    </ModalRoot>
                )}

                {isSeasonPassOpen && (
                    <SeasonPassPage
                        user={user}
                        setUser={setUser}
                        onClose={() => setIsSeasonPassOpen(false)}
                        onOpenVip={() => openVipModal("VIP Pass", "Get exclusive rewards and benefits!")}
                    />
                )}

                <img className={styles.backgroundImage} src={Config.IMAGES.background} alt="background" />

                {/* 1. Header (Resources) */}
                <Header user={user} />

                {/* SCROLLABLE CONTENT AREA */}
                <div className={styles.scrollableContent}>

                    {/* 2. Season Pass Banner */}
                    <div
                        onClick={() => setIsSeasonPassOpen(true)}
                        className={styles.bannerWrapper}
                        style={{ minHeight: '120px', marginBottom: '20px' }}
                    >
                        <SeasonPassBanner user={user} />
                    </div>

                    {/* 3. Team Stats Compact */}
                    <TeamStatsCompact user={user} />

                    {/* 4. Activity Block (Event Card) */}
                    <div className={styles.eventCardWrapperEventMain}>
                        <EventCard user={user} onUserUpdate={setUser} />
                    </div>

                    {/* 5. NEW: Daily Goal Section (Box & Task) */}
                    <DailyGoalSection user={user} onUserUpdate={setUser} />

                    {/* 🔥 НОВИЙ БЛОК ЛІГИ (Замість тренування/чату) */}
                    <LeaguePreviewBlock user={user} />

                    {/* Spacer */}
                    <div style={{ height: '100px' }}></div>
                </div>

                {/* 6. Navigation Bar */}
                <NavigationBar user={user} />
            </div>
        </div>
    );
};