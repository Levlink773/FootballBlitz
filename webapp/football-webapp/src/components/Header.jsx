import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import styles from '../css_files/Header.module.css';

import Config from "../config.js";

import { api } from "../api.js";

import { showAlert } from "../alertService.jsx";

import { BuyModal, ModalRoot } from "./modal_components/ModalComponents.jsx";

import {useGuide} from "./register/context/GuideContext.jsx";

const NotificationIcon = ({ hasNotification }) => (
    <svg
        className={styles.notificationIcon}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            className={styles.notificationBell}
            d="M12 22C13.1046 22 14 21.1046 14 20H10C10 21.1046 10.8954 22 12 22ZM18 16V11C18 7.68629 15.3137 5 12 5C8.68629 5 6 7.68629 6 11V16L4 18H20L18 16Z"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        {hasNotification && <circle className={styles.notificationDot} cx="18" cy="6" r="4" />}
    </svg>
);

const ShopButton = ({ isHighlighted, guideTarget }) => {
    const navigate = useNavigate();

    const handleGoToShop = () => {
        if (guideTarget && guideTarget !== 'shop') {
            return;
        }
        navigate('/shop');
    };

    const isDisabled = guideTarget && guideTarget !== 'shop';
    const buttonClasses = `${styles.shopButton} ${isHighlighted ? styles.highlighted : ''} ${isDisabled ? styles.disabled : ''}`;

    return (
        <button className={buttonClasses} aria-label="Shop" onClick={handleGoToShop} disabled={isDisabled}>
            <svg className={styles.shopButtonSvg} viewBox="0 0 100 38" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FFECB3" />
                        <stop offset="25%" stopColor="#FFD700" />
                        <stop offset="50%" stopColor="#DAA520" />
                        <stop offset="75%" stopColor="#FFD700" />
                        <stop offset="100%" stopColor="#FFECB3" />
                    </linearGradient>
                    <radialGradient id="goldShine" cx="50%" cy="0%" r="100%" fx="50%" fy="0%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </radialGradient>
                </defs>
                <rect x="0" y="0" width="100" height="38" rx="12" ry="12" fill="url(#goldGradient)" />
                <rect x="0" y="0" width="100" height="38" rx="12" ry="12" fill="url(#goldShine)" />
            </svg>
            <img
                src={Config.IMAGES.shop_icon}
                alt="Shop Icon"
                className={styles.shopIconActual}
            />
        </button>
    );
}

// Змінений компонент CurrencyGroup
const CurrencyGroup = ({ icon, alt, amount, onAddClick, isDisabled = false }) => {
    // Створюємо динамічний список класів для кнопки
    const addButtonClasses = `${styles.addButton} ${isDisabled ? styles.disabled : ''}`;

    return (
        <div className={styles.currencyGroup}>
            <img className={styles.currencyIcon} src={icon} alt={alt} aria-label={alt} />
            <span className={styles.currencyAmount}>{amount ?? 0}</span>
            <button
                className={addButtonClasses} // Використовуємо динамічні класи
                onClick={onAddClick}
                aria-label={`Add ${alt}`}
                disabled={isDisabled} // Додаємо атрибут disabled
            >
                +
            </button>
        </div>
    );
};

// Змінений компонент Header
export const Header = ({ user }) => {
    const { guideTarget } = useGuide();
    const location = useLocation();

    const [activeModal, setActiveModal] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // --- НОВИЙ КОД: Визначаємо, чи потрібно блокувати кнопки ---
    // Кнопки заблоковані, якщо у користувача НЕМАЄ статусу 'END_REGISTER'
    const isRegistrationIncomplete = user?.status_register !== 'END_REGISTER';
    // --- КІНЕЦЬ НОВОГО КОДУ ---

    const openModal = (modalType) => {
        // Додаткова перевірка, хоча кнопка і так буде заблокована
        if (isRegistrationIncomplete) return;
        setActiveModal(modalType);
    };

    const closeModal = () => setActiveModal(null);

    const handlePurchase = async (productType, item) => {
        // ... (решта логіки без змін)
        if (!user || !user.user_id) {
            showAlert("Помилка: користувача не знайдено. Будь ласка, перезавантажте сторінку.");
            return;
        }

        setIsLoading(true);
        closeModal();

        try {
            let response;
            const data = { userId: user.user_id };

            switch (productType) {
                case 'coin':
                    response = await api.createCoinPayment({ ...data, pack: item });
                    break;
                case 'energy':
                    response = await api.createEnergyPayment({ ...data, pack: item });
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
    const avatarUrl = user?.avatar_url || Config.IMAGES.avatar;
    const isShopHighlighted = guideTarget === 'shop' && location.pathname !== '/shop';

    return (
        <>

            {isLoading && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                }}>
                    <h2>Створення платежу...</h2>
                </div>
            )}
            <header className={styles.headerContainer}>
                <div className={styles.leftSection}>
                    <button className={styles.iconButton} aria-label="Notifications">
                        <NotificationIcon hasNotification={false} />
                    </button>
                    <div className={styles.avatarContainer}>
                        <img className={styles.avatar} src={avatarUrl} alt="User avatar" />
                        <span className={styles.avatarGlow}></span>
                    </div>
                </div>

                <div className={styles.middleSection}>
                    <CurrencyGroup
                        icon={Config.IMAGES.coin}
                        alt="Coins"
                        amount={user?.money}
                        onAddClick={() => openModal('coin')}
                        isDisabled={isRegistrationIncomplete} // <-- ПЕРЕДАЄМО СТАН БЛОКУВАННЯ
                    />
                    <CurrencyGroup
                        icon={Config.IMAGES.energy}
                        alt="Energy"
                        amount={user?.energy}
                        onAddClick={() => openModal('energy')}
                        isDisabled={isRegistrationIncomplete} // <-- ПЕРЕДАЄМО СТАН БЛОКУВАННЯ
                    />
                </div>
                <div className={styles.rightSection}>
                    <ShopButton isHighlighted={isShopHighlighted} guideTarget={guideTarget} />
                </div>
            </header>

            {activeModal && (
                <ModalRoot>
                    <BuyModal
                        type={activeModal}
                        onClose={closeModal}
                        onDonate={(pack) => handlePurchase(activeModal, pack)}
                    />
                </ModalRoot>
            )}
        </>
    );
};
