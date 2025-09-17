// RatingCard.jsx

import React, { useState } from 'react'; // <-- Імпортуємо useState
import { Header } from "../components/Header.jsx";
import Config from "../config.js";
import { NavigationBar } from "../components/NavigationBar.jsx";
import styles from '../css_files/Main.module.css';
import Rating from '../components/rating/Rating.jsx';
import RatingInfo from "../components/rating/RatingInfo.jsx";

export default function RatingCard({ user }) {
    // Стан для перемикання між екранами 'rating' та 'info'
    const [currentView, setCurrentView] = useState('rating');

    // Функції для зміни стану
    const showInfo = () => setCurrentView('info');
    const showRating = () => setCurrentView('rating');

    return (
        <div className={styles.mainContainer} data-modal-root>
            <Header user={user} />

            {/* Background Image */}
            <img
                src={Config.IMAGES.rating_background}
                alt="background"
                className={styles.backgroundImage}
            />

            {/* Головний контент:
                Рендеримо компонент в залежності від стану currentView.
                Передаємо відповідні функції як пропси.
            */}
            {currentView === 'rating' ? (
                <Rating onShowInfo={showInfo} />
            ) : (
                <RatingInfo onBack={showRating} />
            )}

            {/* Navigation Bar at the bottom */}
            <NavigationBar />
        </div>
    );
}