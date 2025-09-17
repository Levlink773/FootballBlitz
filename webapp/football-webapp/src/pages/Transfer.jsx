// Файл TransferCard.jsx

import React, {useState} from 'react';
import {Header} from "../components/Header.jsx";
import Config from "../config.js";
import {NavigationBar} from "../components/NavigationBar.jsx";
import styles from '../css_files/Main.module.css';
import TransferOption from "../components/transfer/Transfer.jsx";

export default function TransferCard({initialUserFromServer}) {
    const [user, setUser] = useState(initialUserFromServer);
    return (
        <div className={styles.mainContainer} data-modal-root>
            <Header user={user} />
            <img
                src={Config.IMAGES.transfer_background}
                alt="background"
                className={styles.backgroundImage}
            />
            <div className={styles.contentWrapper}>

                <TransferOption user={user} onUserUpdate={setUser}/>
            </div>
            <NavigationBar />
        </div>
    );
}