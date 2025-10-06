// components/rating/RatingHub.jsx

import React from 'react';
import styles from '../../css_files/rating/Rating.module.css'; // Reusing styles for consistency

// The component receives a function to handle the rating type selection
const RatingHub = ({ onSelectRating }) => {
    return (
        // We use ratingContainer to keep the same positioning
        <div className={styles.ratingContainer}>
            <div className={styles.title}>РЕЙТИНГИ ГРАВЦІВ</div>
            <div className={styles.listBox} style={{ justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
                {/* Button for Seasonal Rating */}
                <button
                    className={styles.hubButton} // You might need to add this style class
                    onClick={() => onSelectRating('seasonal')}
                >
                    🏆 Рейтинг сезону
                </button>

                {/* Button for Win Rate Rating */}
                <button
                    className={styles.hubButton} // Add styles for this button as well
                    onClick={() => onSelectRating('win_rate')}
                >
                    🎯 За відсотком перемог
                </button>
            </div>
        </div>
    );
};


export default RatingHub;