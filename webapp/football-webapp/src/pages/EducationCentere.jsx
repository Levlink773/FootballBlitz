import React from 'react';
import {Header} from "../components/Header.jsx";
import Config from "../config.js";
import {NavigationBar} from "../components/NavigationBar.jsx";
import styles from '../css_files/Main.module.css';
import EducationCentre from "../components/education_centre/EducationCentre.jsx";

export default function EducationCard({user, setUser}) {

    const handleUserUpdate = (updatedUser) => {
        setUser(updatedUser);
    };

    return (
        <div className={styles.page}>
            <div className={styles.mainContainer} data-modal-root>
                <Header user={user}/>
                <img
                    src={Config.IMAGES.education_background}
                    alt="background"
                    className={styles.backgroundImage}
                />
                {/* Передаем всего пользователя и функцию обновления */}
                <EducationCentre user={user} onUserUpdate={handleUserUpdate}/>
                <NavigationBar/>
            </div>
        </div>
    );
}