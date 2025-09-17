import React, { useState } from 'react';
import { Header } from "../components/Header.jsx";
import Config from "../config.js";
import { NavigationBar } from "../components/NavigationBar.jsx";
import styles from '../css_files/Main.module.css';
import Shop from "../components/shop/Shop.jsx";
// Assuming your modals are exported from this file
import {VipPromoModal, BuyModal, ModalRoot} from "../components/modal_components/ModalComponents.jsx";

export default function ShopCard({ mockUser }) {
    // State to manage which modal is currently open
    const [activeModal, setActiveModal] = useState(null);

    // Function to open a modal by its type ('vip', 'coin', 'energy')
    const openModal = (modalType) => setActiveModal(modalType);

    // Function to close any active modal
    const closeModal = () => setActiveModal(null);

    return (
        <div className={styles.mainContainer} data-modal-root>
            <Header user={mockUser} />
            <img
                src={Config.IMAGES.shop_background}
                alt="background"
                className={styles.backgroundImage}
            />

            {/* Main Shop Content */}
            {/* Pass the 'openModal' handler to the Shop component */}
            <Shop onOpenModal={openModal} />

            <NavigationBar />

            {/* --- MODAL RENDERING LOGIC --- */}
            {/* Conditionally render the correct modal based on the activeModal state */}

            {activeModal === 'vip' && (
                <ModalRoot>
                    <VipPromoModal
                        onClose={closeModal}
                        onSubscribe={() => {
                            console.log("VIP Subscription initiated!");
                            closeModal();
                        }}
                    />
                </ModalRoot>
            )}

            {activeModal === 'coin' && (
                <ModalRoot>
                    <BuyModal
                        type="coin"
                        onClose={closeModal}
                        onDonate={(pack) => {
                            console.log("Buying coins:", pack);
                            closeModal();
                        }}
                    />
                </ModalRoot>
            )}

            {activeModal === 'energy' && (
                <ModalRoot>
                    <BuyModal
                        type="energy"
                        onClose={closeModal}
                        onDonate={(pack) => {
                            console.log("Buying energy:", pack);
                            closeModal();
                        }}
                    />
                </ModalRoot>
            )}
        </div>
    );
}