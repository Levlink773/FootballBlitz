// RatingCard.jsx

import React, { useEffect, useState } from 'react';
import { Header } from "../components/Header.jsx";
import Config from "../config.js";
import { NavigationBar } from "../components/NavigationBar.jsx";
import styles from '../css_files/Main.module.css';
import Rating from '../components/rating/Rating.jsx';
import RatingInfo from "../components/rating/RatingInfo.jsx";
import RatingHub from "../components/rating/RatingHub.jsx"; // <-- 1. Import the new Hub component
import { showAlert, showInfoModal } from "../alertService.jsx";
import { API_BASE_URL } from "../api.js";

export default function RatingCard({ user, setUser }) {
    // 2. Manage the overall view ('hub', 'rating', 'info')
    const [currentView, setCurrentView] = useState('hub');
    // 3. Keep track of the selected rating type ('seasonal' or 'win_rate')
    const [activeRatingType, setActiveRatingType] = useState(null);

    // Handlers to switch between views
    const showRatingList = (type) => {
        setActiveRatingType(type);
        setCurrentView('rating');
    };

    const showInfo = () => {
        setCurrentView('info');
    };

    const showHub = () => {
        setCurrentView('hub');
        setActiveRatingType(null);
    };

    // This useEffect for updating user registration status remains unchanged.
    useEffect(() => {
        const updateUserStatus = async () => {
            if (user?.status_register === 'RATING') {
                try {
                    console.log('Updating user status from RATING to END_REGISTER...');
                    const response = await fetch(`${API_BASE_URL}/users/${user.user_id}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'END_REGISTER' }),
                    });

                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }

                    const updatedUser = await response.json();
                    setUser(updatedUser);

                    const msg1 = `
🔹 Тренер:
Вітаю! 🎉 Ти успішно завершив навчання — відмінна робота!
Тепер чекай турніру, прокачуй команду, повертайся на поле і показуй, чого навчився. ⚽🔥
                    `;
                    showInfoModal({
                        image: Config.IMAGES.end_info,
                        text: msg1
                    });

                    const msg = `
🔹 Тренер:
Це сторінка з рейтингами. Грай у турнірах — отримуй очки й піднімайся в рейтингу! В кінці сезону найсильніші отримують цінні винагороди.
Є також окремий рейтинг за кількістю перемог — стань лідером!
                    `;
                    showInfoModal({
                        image: Config.IMAGES.rating_info,
                        text: msg
                    });

                    console.log('User status successfully updated!');
                } catch (error) {
                    console.error("Failed to update user status:", error);
                    showAlert("Не вдалося оновити ваш статус. Спробуйте перезавантажити сторінку.");
                }
            }
        };

        updateUserStatus();
    }, [user, setUser]);

    // 4. Render component based on the current view state
    const renderContent = () => {
        switch (currentView) {
            case 'rating':
                return <Rating type={activeRatingType} onShowInfo={showInfo} onBack={showHub} />;
            case 'info':
                // Pass the 'showRatingList' function with the correct type for the back button
                return <RatingInfo type={activeRatingType} onBack={() => showRatingList(activeRatingType)} />;
            case 'hub':
            default:
                return <RatingHub onSelectRating={showRatingList} />;
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.mainContainer} data-modal-root>
                <Header user={user} />
                <img
                    src={Config.IMAGES.rating_background}
                    alt="background"
                    className={styles.backgroundImage}
                />

                {renderContent()}

                <NavigationBar />
            </div>
        </div>
    );
}