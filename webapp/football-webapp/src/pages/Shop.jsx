import React, {useEffect, useState} from 'react';
import {Header} from "../components/Header.jsx";
import Config from "../config.js";
import {NavigationBar} from "../components/NavigationBar.jsx";
import styles from '../css_files/Main.module.css';
import Shop from "../components/shop/Shop.jsx";
// Убедитесь, что импортируете обновленный VipPromoModal
import {VipPromoModal, BuyModal, ModalRoot} from "../components/modal_components/ModalComponents.jsx";
import useWebSocket from "../../useWebsocket.js";
import {api, API_BASE_URL} from "../api.js";
import {showAlert, showInfoModal} from "../alertService.jsx";

export default function ShopCard({user, setUser}) {
    const [activeModal, setActiveModal] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const openModal = (modalType) => setActiveModal(modalType);
    const closeModal = () => setActiveModal(null);

    useEffect(() => {
        // Создаем асинхронную функцию внутри useEffect
        const updateUserStatus = async () => {
            // Проверяем, что у пользователя именно статус 'TRANSFER'
            if (user?.status_register === 'SHOPPING') {
                try {
                    console.log('Updating user status from TRANSFER to SHOPPING...');

                    // Отправляем PATCH-запрос на бэкенд для смены статуса
                    const response = await fetch(`${API_BASE_URL}/users/${user.user_id}/status`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        // В теле запроса передаем новый статус
                        body: JSON.stringify({ status: 'EDUCATION_CENTER' }),
                    });

                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }

                    // Получаем обновленные данные пользователя от сервера
                    const updatedUser = await response.json();

                    // Обновляем состояние пользователя в компоненте
                    setUser(updatedUser);
                    const msg = `
                    🔹 Тренер:
У магазині ти можеш купити енергію та монети, лутбокси з випадковими наградами, а також VIP-пас — щоб отримувати бонуси й пріоритет.
Купуй у «Магазині» і підсилюй свою команду!
Тепер йдемо до учбовового центру капітане!
                    `;
                    showInfoModal({
                        image: Config.IMAGES.shop_info, // або просто "/assets/images/success_icon.png"
                        text: msg
                    })

                    console.log('User status successfully updated!');

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

    const handlePurchase = async (productType, item) => {
        if (!user || !user.id) {
            showAlert("Помилка: користувача не знайдено. Будь ласка, перезавантажте сторінку.");
            return;
        }

        setIsLoading(true);
        closeModal();

        try {
            let response;
            const data = {userId: user.user_id};

            switch (productType) {
                case 'vip':
                    // ИЗМЕНЕНИЕ: Теперь мы используем item.type, переданный из модального окна
                    response = await api.createVipPayment({...data, price: item.price, type: item.type});
                    break;
                case 'coin':
                    response = await api.createCoinPayment({...data, pack: item});
                    break;
                case 'energy':
                    response = await api.createEnergyPayment({...data, pack: item});
                    break;
                case 'box':
                    response = await api.createBoxPayment({...data, box: item});
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

    useWebSocket(user?.user_id);

    return (
        <div className={styles.page}>
            <img className={styles.pageBackgroundBlur} src={Config.IMAGES.shop_background} alt="" />
            <div className={styles.mainContainer} data-modal-root>
                {isLoading && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                    }}>
                        <h2>Створення платежу...</h2>
                    </div>
                )}

                <Header user={user}/>
                <img src={Config.IMAGES.shop_background} alt="background" className={styles.backgroundImage}/>

                <Shop onOpenModal={openModal} onPurchase={handlePurchase}/>

                <NavigationBar/>

                {/* --- MODAL RENDERING LOGIC --- */}
                {activeModal === 'vip' && (
                    <ModalRoot>
                        <VipPromoModal
                            onClose={closeModal}
                            // ИЗМЕНЕНИЕ: Передаем весь объект (vipOption) в handlePurchase
                            onSubscribe={(vipOption) => handlePurchase('vip', vipOption)}
                        />
                    </ModalRoot>
                )}

                {activeModal === 'coin' && (
                    <ModalRoot>
                        <BuyModal
                            type="coin"
                            onClose={closeModal}
                            onDonate={(pack) => handlePurchase('coin', pack)}
                        />
                    </ModalRoot>
                )}

                {activeModal === 'energy' && (
                    <ModalRoot>
                        <BuyModal
                            type="energy"
                            onClose={closeModal}
                            onDonate={(pack) => handlePurchase('energy', pack)}
                        />
                    </ModalRoot>
                )}
            </div>
        </div>
    );
}