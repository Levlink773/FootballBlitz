import React, {useState} from 'react';
import {Header} from "../components/Header.jsx";
import Config from "../config.js";
import {NavigationBar} from "../components/NavigationBar.jsx";
import styles from '../css_files/Main.module.css';
import EducationCentre from "../components/education_centre/EducationCentre.jsx";

export default function EducationCard({initialUserFromServer}) {
    const [user, setUser] = useState(initialUserFromServer);
    return (
        <div className={styles.mainContainer} data-modal-root>
            <Header user={user} />
            <img
                src={Config.IMAGES.education_background}
                alt="background"
                className={styles.backgroundImage}
            />
            <EducationCentre userId={user.user_id} onUserUpdate={setUser}/>
            <NavigationBar />
        </div>
    );
}