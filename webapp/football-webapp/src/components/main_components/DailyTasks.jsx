import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../../css_files/main_css/DailyTasks.module.css';
import Config from "../../config.js";

export const DailyTasks = () => {
    const navigate = useNavigate();

    const handleClick = (e) => {
        // Додаємо зупинку спливання подій, щоб не спрацьовували кліки по фону (якщо є)
        e.stopPropagation();
        navigate("/education_centre");
    };

    return (
        <div
            onClick={handleClick}
            className={styles.dailyTasksWrapper}
            title="Перейти до завдань" // Підказка при наведенні
        >
            <img
                className={styles.tasksIcon}
                src={Config.IMAGES.daily_task_main}
                alt="Daily Tasks Icon"
            />
            <div className={styles.tasksLabel}>
                ЩОДЕННІ <br/> ЗАВДАННЯ
            </div>
        </div>
    );
};