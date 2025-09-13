import React from 'react';
import {Header} from "../components/Header.jsx";
import Config from "../config.js";
import {NavigationBar} from "../components/NavigationBar.jsx";
import styles from '../css_files/Main.module.css';

export default function MatchCard({mockUser}) {
    return (
        <div className={styles.mainContainer}>
            <Header user={mockUser} />
            <img
                src={Config.IMAGES.match_background}
                alt="background"
                className={styles.backgroundImage}
            />
            <NavigationBar />
        </div>
    );
}