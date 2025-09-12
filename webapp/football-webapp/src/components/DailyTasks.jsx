import React from 'react';
import styles from './DailyTasks.module.css';

export const DailyTasks = () => {
    return (
        <>
            <img className={styles.tasksIcon} src="../assets/img20.png" alt="daily tasks"/>
            <div className={styles.tasksLabel}>ЩОДЕННІ <br/>ЗАВДАННЯ</div>
        </>
    );
};