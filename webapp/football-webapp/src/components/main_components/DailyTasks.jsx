import React from 'react';
import styles from '../../css_files/main_css/DailyTasks.module.css';
import Config from "../../config.js";

export const DailyTasks = () => {
    return (
        <>
            <img className={styles.tasksIcon} src={Config.IMAGES.daily_task_main} alt="background"/>
            <div className={styles.tasksLabel}>ЩОДЕННІ <br/>ЗАВДАННЯ</div>
        </>
    );
};