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
import {API_BASE_URL, api} from "../api.js";

import {ModalRoot, VipPromoModalWithTitle} from "../components/modal_components/ModalComponents.jsx";
import {FaChartLine, FaGraduationCap} from "react-icons/fa";
import {AnalyticsModal} from "../components/modal_components/AnalyticsModal.jsx";

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
const AnalyticsButton = ({ onClick }) => {
    return (
        <div className={styles.highlightOverlay} style={{pointerEvents: 'none'}}>
            <div
                className={styles.analyticsContainer} // Використовуємо новий клас
                onClick={onClick}
                style={{pointerEvents: 'auto'}} // Вмикаємо кліки
            >
                {/* Іконка */}
                <FaChartLine className={styles.analyticsIcon} />

                {/* Текст у тому ж стилі, що й HELP */}
                <span className={styles.analyticsLabel}>CLUB STATS</span>
            </div>
        </div>
    );
};
// Компонент кнопки Туторіалу
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
    const vip_pass_status = user?.vip_pass_is_active;

    const showHighlightArrow = user && user.status_register === "END_REGISTER";
    const showTutorialBtn = user && (user.count_of_training < 3);

    const [isInventoryOpen, setIsInventoryOpen] = useState(false);

    // Стейт для VIP модалки
    const [isVipPromoOpen, setIsVipPromoOpen] = useState(false);
    // 🔥 Стейт для динамічного тексту модалки
    const [vipModalContent, setVipModalContent] = useState({ title: null, subtitle: null });

    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

    // Змінюємо умову відображення (тепер це кнопка аналітики)
    // Можна показувати завжди, або тільки після реєстрації
    const showAnalyticsBtn = user && user.status_register === "END_REGISTER";

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

    const handleTutorialClick = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/users/${user.user_id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'TRANSFER' })
            });

            if (!res.ok) throw new Error('Помилка оновлення статусу');

            const updatedUser = await res.json();
            setUser(updatedUser);
        } catch (e) {
            console.error(e);
            showAlert("Щось пішло не так при запуску навчання.");
        }
    };

    // 🔥 Функція відкриття модалки з кастомним текстом
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
            const data = {userId: user.user_id};

            switch (productType) {
                case 'vip':
                    response = await api.createVipPayment({...data, price: item.price, type: item.type});
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

    const date = new Date(user.vip_pass_expiration_date);
    const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

    const openInventory = () => setIsInventoryOpen(true);
    const closeInventory = () => setIsInventoryOpen(false);
    useEffect(() => {
        if (user && user.status_register === 'HOME') {
            const finishRegistration = async () => {
                // 1. Показуємо фінальну модалку
                const msg = `
🔹 Тренер:
Навчання завершено — чудова робота! 🎉
Тепер ти повноцінний менеджер. Прокачуй команду, змагайся в турнірах та піднімайся в рейтингу!
`;
                await showInfoModal({
                    image: Config.IMAGES.training_info,
                    text: msg
                });

                // 2. Змінюємо статус на END_REGISTER
                try {
                    const res = await fetch(`${API_BASE_URL}/users/${user.user_id}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'END_REGISTER' })
                    });

                    if (res.ok) {
                        const updatedUser = await res.json();
                        setUser(updatedUser);

                        // 👇👇👇 ДОДАНО ВИКЛИК РЕФЕРАЛЬНОЇ НАГОРОДИ 👇👇👇
                        try {
                            // Викликаємо нагороду "у фоні", не блокуючи інтерфейс, якщо станеться помилка
                            await fetch(`${API_BASE_URL}/users/${user.user_id}/trigger-referral-reward`, {
                                method: 'POST'
                            });
                            console.log("Referral reward triggered successfully");
                        } catch (refError) {
                            // Логуємо помилку, але не зупиняємо роботу додатку,
                            // бо користувач вже завершив реєстрацію
                            console.error("Failed to trigger referral reward:", refError);
                        }
                        // 👆👆👆 КІНЕЦЬ ДОДАНОГО КОДУ 👆👆👆
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
                {showCreateTeamModal && <CreateTeamModal user={user} onTeamCreated={handleTeamCreated} />}
                {showGetCharacterModal && <GetFirstCharacterModal user={user} onCharacterClaimed={handleCharacterClaimed} />}

                {/* 👇 КНОПКА АНАЛІТИКИ */}
                {showAnalyticsBtn && <AnalyticsButton onClick={() => setIsAnalyticsOpen(true)} />}

                {/* 👇 МОДАЛКА АНАЛІТИКИ */}
                {isAnalyticsOpen && (
                    <AnalyticsModal
                        user={user}
                        onClose={() => setIsAnalyticsOpen(false)}
                    />
                )}

                {showTutorialBtn && <TutorialButton onClick={handleTutorialClick} />}

                {isInventoryOpen && (
                    <InventoryModal
                        user={user}
                        onClose={closeInventory}
                        onUserUpdate={setUser}
                    />
                )}

                {/* 🔥 Модалка покупки VIP з динамічним контентом */}
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

                <img className={styles.backgroundImage} src={Config.IMAGES.background} alt="background" />
                <Header user={user} />

                {vip_pass_status ? (
                    <VipBannerActive expiryDate={formattedDate} />
                ) : (
                    <div
                        onClick={() => openVipModal()}
                        // 🔥 ВИПРАВЛЕННЯ НИЖЧЕ:
                        style={{
                            cursor: "pointer",
                            width: "100%",
                            position: "relative", // Обов'язково для роботи zIndex
                            zIndex: 10            // Піднімаємо банер над профілем
                        }}
                        title="Придбати VIP статус"
                    >
                        <VipBanner />
                    </div>
                )}

                <UserProfile
                    user={user}
                    onUserUpdate={setUser}
                    onOpenInventory={openInventory}
                    onOpenVipModal={openVipModal} // 🔥 Передаємо функцію вниз
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