import React, { useState } from 'react';
import styles from '../css_files/Header.module.css';
import Config from "../config.js";
import { useNavigate } from "react-router-dom";
// --- ИМПОРТЫ ДЛЯ МОДАЛЬНЫХ ОКОН И API ---
import { api } from "../api.js";
import { showAlert } from "../alertService.jsx";
import {BuyModal, ModalRoot} from "./modal_components/ModalComponents.jsx";

// --- Кастомная иконка Уведомлений (SVG) (без изменений) ---
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

// --- Золотая кнопка магазина (без изменений) ---
const ShopButton = () => {
    const navigate = useNavigate();
    const handleGoToShop = () => {
        navigate('/shop');
    };
    return (
        <button className={styles.shopButton} aria-label="Shop" onClick={handleGoToShop}>
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

// --- Компонент валюты (теперь с кнопкой "+") ---
const CurrencyGroup = ({ icon, alt, amount, onAddClick }) => (
    <div className={styles.currencyGroup}>
        <img className={styles.currencyIcon} src={icon} alt={alt} aria-label={alt} />
        <span className={styles.currencyAmount}>{amount ?? 0}</span>
        {/* Вот и наша новая кнопка! */}
        <button
            className={styles.addButton}
            onClick={onAddClick}
            aria-label={`Add ${alt}`}
        >
            +
        </button>
    </div>
);

// --- Основной компонент хедера (с логикой модальных окон) ---
export const Header = ({ user }) => {

    // --- ЛОГИКА УПРАВЛЕНИЯ МОДАЛЬНЫМИ ОКНАМИ ---
    const [activeModal, setActiveModal] = useState(null); // 'coin', 'energy' или null
    const [isLoading, setIsLoading] = useState(false);

    const openModal = (modalType) => setActiveModal(modalType);
    const closeModal = () => setActiveModal(null);

    // Функция для обработки покупки, скопированная из вашего примера
    const handlePurchase = async (productType, item) => {
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
    // --- КОНЕЦ ЛОГИКИ УПРАВЛЕНИЯ ---

    const avatarUrl = user?.avatar_url || Config.IMAGES.avatar;

    // Оборачиваем все в React.Fragment (<>), чтобы рендерить и хедер, и модальные окна
    return (
        <>
            {/* Оверлей загрузки при создании платежа */}
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
                {/* Левый блок (без изменений) */}
                <div className={styles.leftSection}>
                    <button className={styles.iconButton} aria-label="Notifications">
                        <NotificationIcon hasNotification={false} />
                    </button>
                    <div className={styles.avatarContainer}>
                        <img className={styles.avatar} src={avatarUrl} alt="User avatar" />
                        <span className={styles.avatarGlow}></span>
                    </div>
                </div>

                {/* Средний блок (обновлен для передачи обработчика клика) */}
                <div className={styles.middleSection}>
                    <CurrencyGroup
                        icon={Config.IMAGES.coin}
                        alt="Coins"
                        amount={user?.money}
                        onAddClick={() => openModal('coin')}
                    />
                    <CurrencyGroup
                        icon={Config.IMAGES.energy}
                        alt="Energy"
                        amount={user?.energy}
                        onAddClick={() => openModal('energy')}
                    />
                </div>

                {/* Правый блок (без изменений) */}
                <div className={styles.rightSection}>
                    <ShopButton />
                </div>
            </header>

            {/* --- ЛОГИКА РЕНДЕРИНГА МОДАЛЬНЫХ ОКОН --- */}
            {/* Рендерим одно общее окно, передавая ему тип ('coin' или 'energy') */}
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