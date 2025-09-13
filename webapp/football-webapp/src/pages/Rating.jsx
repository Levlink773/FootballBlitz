// RatingCard.jsx

import React from 'react';
import { Header } from "../components/Header.jsx";
import Config from "../config.js";
import { NavigationBar } from "../components/NavigationBar.jsx";
import styles from '../css_files/Main.module.css';
import Rating from '../components/rating/Rating.jsx';
import RatingInfo from "../components/rating/RatingInfo.jsx"; // <-- IMPORT THE NEW COMPONENT

export default function RatingCard({ mockUser }) {
    return (
        <div className={styles.mainContainer}>
            <Header user={mockUser} />

            {/* Background Image */}
            <img
                src={Config.IMAGES.rating_background}
                alt="background"
                className={styles.backgroundImage}
            />

            {/* Main Content */}
            <RatingInfo /> {/* <-- USE THE COMPONENT HERE */}

            {/* Navigation Bar at the bottom */}
            <NavigationBar />
        </div>
    );
}