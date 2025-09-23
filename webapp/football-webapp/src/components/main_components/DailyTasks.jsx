import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../css_files/main_css/DailyTasks.module.css';
import Config from "../../config.js";

export const DailyTasks = () => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate("/education_centre");
    };

    return (
        <div onClick={handleClick} className={styles.dailyTasksWrapper}>
            <img
                className={styles.tasksIcon}
                src={Config.IMAGES.daily_task_main}
                alt="background"
            />
            <div className={styles.tasksLabel}>
                ЩОДЕННІ <br/> ЗАВДАННЯ
            </div>
        </div>
    );
};
