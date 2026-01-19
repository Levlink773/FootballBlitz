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

// --- NEW COMPONENT: Compact Team Stats ---
// --- NEW COMPONENT: Compact Team Stats ---
const TeamStatsCompact = ({ user }) => {
    if (!user) return null;

    const teamName = user.team_name || "My Team";
    const teamPower = user.team_power || 0;
    const avgAge = user.avg_age || 0;
    const avgTalent = user.avg_talent || 0;

    return (
        <div className={styles.teamStatsCompactWrapper}>
            {/* LEFT: Identity (Icon + Name) */}
            <div className={styles.tscHeader}>
                <div className={styles.tscAvatarContainer}>
                    {/* Використовуємо іконку команди замість картинки */}
                    <FaUsers />
                </div>
                <div className={styles.tscNameContainer}>
                    <span className={styles.tscLabel}>TEAM</span>
                    <h3 className={styles.tscTeamName}>{teamName}</h3>
                </div>
            </div>

            {/* RIGHT: Stats Grid */}
            <div className={styles.tscGrid}>
                {/* Power */}
                <div className={styles.tscStatBox}>
                    <div className={styles.tscIconBox} style={{ color: '#FFD700' }}>
                        <FaBolt />
                    </div>
                    <span className={styles.tscStatValue}>{teamPower}</span>
                    <span className={styles.tscStatLabel}>PWR</span>
                </div>

                {/* Talent */}
                <div className={styles.tscStatBox}>
                    <div className={styles.tscIconBox} style={{ color: '#00F2FF' }}>
                        <FaStar />
                    </div>
                    <span className={styles.tscStatValue}>{avgTalent}</span>
                    <span className={styles.tscStatLabel}>TLN</span>
                </div>

                {/* Age */}
                <div className={styles.tscStatBox}>
                    <div className={styles.tscIconBox} style={{ color: '#FF00FF' }}>
                        <FaBirthdayCake />
                    </div>
                    <span className={styles.tscStatValue}>{avgAge}</span>
                    <span className={styles.tscStatLabel}>AGE</span>
                </div>
            </div>
        </div>
    );
};

// --- NEW COMPONENT: Daily Goals (Box + Task) ---
const DailyGoalSection = ({ user, onUserUpdate }) => {
    const [timeLeft, setTimeLeft] = useState("");
    const [taskClaiming, setTaskClaiming] = useState(false);

    // 1. Logic for Daily Box Timer (Count down to 22:00)
    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const target = new Date();
            target.setHours(22, 0, 0, 0); // 22:00

            // If it's already past 22:00, target is tomorrow 22:00
            if (now > target) {
                target.setDate(target.getDate() + 1);
            }

            const diff = target - now;
            if (diff <= 0) return "00:00:00";

            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / 1000 / 60) % 60);
            const s = Math.floor((diff / 1000) % 60);

            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        setTimeLeft(calculateTimeLeft()); // Initial call

        return () => clearInterval(timer);
    }, []);

    const handleBoxClick = async () => {
        if (!user.has_free_box) {
            showInfoModal({ text: `Daily Box refresh at 22:00!\nTime left: ${timeLeft}`, image: Config.IMAGES.box_small });
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/users/${user.user_id}/daily-box/claim`, {
                method: 'POST'
            });
            if (res.ok) {
                const updatedUser = await res.json();
                onUserUpdate(updatedUser);
                showInfoModal({ text: "You opened Daily Box!", image: Config.IMAGES.box_small });
            } else {
                const err = await res.json();
                showAlert(err.detail);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // 2. Logic for Task (Conduct 3 Training)
    // Assuming backend: user.count_go_to_gym tracks progress
    const trainingsDone = user.count_go_to_gym || 0;
    const trainingTarget = 3;
    const progressPercent = Math.min((trainingsDone / trainingTarget) * 100, 100);
    // Check if reward is already claimed (check statistics array)
    const isTaskClaimed = user.statistics?.some(s => s.stat_type === "CONDUCT_3_TRAINING");
    const isTaskReady = trainingsDone >= trainingTarget && !isTaskClaimed;

    const handleTaskClick = async () => {
        if (isTaskClaimed) return; // Do nothing if done
        if (!isTaskReady) {
            // Optional: Navigate to Training screen
            showAlert("Go to Training Center to complete this task!");
            return;
        }

        setTaskClaiming(true);
        try {
            const res = await fetch(`${API_BASE_URL}/education/tasks/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.user_id,
                    stat_type: "CONDUCT_3_TRAINING"
                })
            });

            if (res.ok) {
                const data = await res.json();
                showInfoModal({ text: data.message, image: Config.IMAGES.energy_medium }); // Assuming energy reward

                // Refresh user to update statistics list
                const userRes = await fetch(`${API_BASE_URL}/users/${user.user_id}`);
                if (userRes.ok) onUserUpdate(await userRes.json());
            } else {
                showAlert("Error claiming reward");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setTaskClaiming(false);
        }
    };
    // Додаємо клас .ready, якщо бокс доступний
    const boxReadyClass = user.has_free_box ? styles.ready : '';

    return (
        <div className={styles.dailyGoalsWrapper}>
            {/* LEFT: DAILY BOX (Gold/Blue Style) */}
            <div
                className={`${styles.dailyCardBase} ${styles.dailyBoxCard} ${boxReadyClass}`}
                onClick={handleBoxClick}
            >
                <div className={styles.boxFrame}>
                    <img src={Config.IMAGES.box_mini} alt="Box" className={styles.boxImage} />
                </div>

                <div className={styles.boxTextWrapper}>
                    <div className={styles.boxLabel}>DAILY LOOT</div>
                    {user.has_free_box ? (
                        <div className={styles.claimText}>OPEN</div>
                    ) : (
                        <div className={styles.boxTimer}>{timeLeft}</div>
                    )}
                </div>
            </div>

            {/* RIGHT: MAIN TASK (Cyan/Blue Style) */}
            <div
                className={`${styles.dailyCardBase} ${styles.dailyTaskCard}`}
                onClick={handleTaskClick}
                style={{ filter: isTaskClaimed ? 'grayscale(0.6)' : 'none' }}
            >
                <div className={styles.taskHeader}>
                    {/* Використовуємо жовтий колір іконки для контрасту на синьому */}
                    <FaDumbbell className={styles.taskIcon} style={{ color: isTaskReady ? '#00FF88' : '#00F2FF'}} />
                    <div className={styles.taskTitle}>
                        {isTaskClaimed ? "MISSION COMPLETE" : "GYM CONTRACT"}
                    </div>
                </div>

                {!isTaskClaimed ? (
                    <>
                        <div className={styles.taskProgressContainer}>
                            <div className={styles.taskProgressFill} style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <div className={styles.taskFooter}>
                            <div className={styles.taskStatus}>
                                {isTaskReady ?
                                    <span style={{color:'#00FF88', textShadow: '0 0 5px #00FF88'}}>CLAIM REWARD</span> :
                                    `${trainingsDone}/${trainingTarget} TRAININGS`
                                }
                            </div>
                            <div className={styles.taskReward}>
                                +50⚡
                            </div>
                        </div>
                    </>
                ) : (
                    // Стан виконаного завдання
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <FaCheckCircle style={{ color: '#00FF88', fontSize: '16px' }} />
                        <span style={{ fontFamily: 'Exo 2', fontWeight: 800, color: '#fff', fontSize: '12px' }}>DONE</span>
                    </div>
                )}
            </div>
        </div>
    );
};

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

    useEffect(() => {
        const updateUserStatus = async () => {
            if (user?.status_register === 'FIRST_TRAINING') {
                try {
                    const msg = `🔹 Тренер:\nЦе головне меню. Але час не чекає! Тисни Ок -> «Тренування» і починаємо!`;
                    showInfoModal({ image: Config.IMAGES.main_info, text: msg });
                } catch (error) {
                    console.error("Failed to update user status:", error);
                }
            }
        };
        updateUserStatus();
    }, [user]);

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
        if (user && user.status_register === 'HOME') {
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

                    {/* 6. Bottom Stats */}
                    <TrainingBlock user={user} onUserUpdate={setUser} />

                    {/* Spacer */}
                    <div style={{ height: '100px' }}></div>
                </div>

                {/* 6. Navigation Bar */}
                <NavigationBar user={user} />
            </div>
        </div>
    );
};