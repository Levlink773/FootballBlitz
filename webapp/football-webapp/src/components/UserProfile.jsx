import React from 'react';
import styles from '../css_files/UserProfile.module.css';

export const UserProfile = ({ user }) => {
    return (
        <>
            <img className={styles.playerImage} src="../assets/img9.png" alt="player character"/>
            <div className={styles.infoBox}>
                <div className={styles.nameContainer}>
                    <span className={styles.name}>{user.name}</span>
                    <span className={styles.age}>, 32</span>
                </div>
                <div className={styles.location}>Portugal</div>
                <img className={styles.locationIcon} src="../assets/img13.png" alt="flag"/>
                <div className={styles.divider}></div>

                {/* Stats */}
                <div className={styles.stat1_value}>53</div>
                <img className={styles.stat1_icon} src="../assets/img10.png" alt="stat icon 1"/>

                <div className={styles.stat2_value}>11</div>
                <img className={styles.stat2_icon} src="../assets/img11.png" alt="stat icon 2"/>

                <div className={styles.stat3_value}>1150</div>
                <img className={styles.stat3_icon} src="../assets/img12.png" alt="stat icon 3"/>
            </div>
        </>
    );
};