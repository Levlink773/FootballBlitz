import React, {useState} from 'react';
import {Header} from "../components/Header.jsx";
import Config from "../config.js";
import {NavigationBar} from "../components/NavigationBar.jsx";
import styles from '../css_files/Main.module.css';
import Shop from "../components/shop/Shop.jsx";
// Assuming your modals are exported from this file
import {VipPromoModal, BuyModal, ModalRoot} from "../components/modal_components/ModalComponents.jsx";
import useWebSocket from "../../useWebsocket.js";
import {api} from "../api.js";
import {showAlert} from "../alertService.jsx";

export default function ShopCard({user}) {
    // State to manage which modal is currently open
    const [activeModal, setActiveModal] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    // Function to open a modal by its type ('vip', 'coin', 'energy')
    const openModal = (modalType) => setActiveModal(modalType);

    // Function to close any active modal
    const closeModal = () => setActiveModal(null);

    const handlePurchase = async (productType, item) => {
        if (!user || !user.id) {
            showAlert("Помилка: користувача не знайдено. Будь ласка, перезавантажте сторінку.");
            return;
        }

        setIsLoading(true);
        closeModal(); // Close modal immediately

        try {
            let response;
            const data = {userId: user.user_id};

            switch (productType) {
                case 'vip':
                    response = await api.createVipPayment({...data, price: item.price, type: 'standard'});
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

            // If we get a valid response with a pageUrl, redirect the user
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
            <div className={styles.mainContainer} data-modal-root>
                {/* Simple loading overlay */}
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

                {/* Pass the 'handlePurchase' handler to the Shop component */}
                <Shop onOpenModal={openModal} onPurchase={handlePurchase}/>

                <NavigationBar/>

                {/* --- MODAL RENDERING LOGIC --- */}
                {activeModal === 'vip' && (
                    <ModalRoot>
                        <VipPromoModal
                            onClose={closeModal}
                            onSubscribe={() => handlePurchase('vip', {price: "389,99 грн"})} // Pass item data
                        />
                    </ModalRoot>
                )}

                {activeModal === 'coin' && (
                    <ModalRoot>
                        <BuyModal
                            type="coin"
                            onClose={closeModal}
                            onDonate={(pack) => handlePurchase('coin', pack)} // Pass the whole pack object
                        />
                    </ModalRoot>
                )}

                {activeModal === 'energy' && (
                    <ModalRoot>
                        <BuyModal
                            type="energy"
                            onClose={closeModal}
                            onDonate={(pack) => handlePurchase('energy', pack)} // Pass the whole pack object
                        />
                    </ModalRoot>
                )}
            </div>
        </div>
    );
}