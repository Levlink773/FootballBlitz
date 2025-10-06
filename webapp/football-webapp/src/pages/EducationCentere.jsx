import React, {useEffect} from 'react';
import {Header} from "../components/Header.jsx";
import Config from "../config.js";
import {NavigationBar} from "../components/NavigationBar.jsx";
import styles from '../css_files/Main.module.css';
import EducationCentre from "../components/education_centre/EducationCentre.jsx";
import {API_BASE_URL} from "../api.js";
import {showAlert, showInfoModal} from "../alertService.jsx";

export default function EducationCard({user, setUser}) {

    const handleUserUpdate = (updatedUser) => {
        setUser(updatedUser);
    };
    useEffect(() => {
        // Создаем асинхронную функцию внутри useEffect
        const updateUserStatus = async () => {
            // Проверяем, что у пользователя именно статус 'TRANSFER'
            if (user?.status_register === 'EDUCATION_CENTER') {
                try {
                    const msg = `
🔹 Тренер:
Ласкаво просимо в Учбовий центр! Тут ти можеш отримувати щоденну нагороду кожні 12 годин і виконувати щоденні завдання, щоб заробляти монети та енергію.
Заглядай в «Учбовий центр» і забери свої бонуси!
Натискай Ок і забери свою нагороду та йдемо далі до арени бліц турніру! 🔥
                    `;
                    showInfoModal({
                        image: Config.IMAGES.learning_info, // або просто "/assets/images/success_icon.png"
                        text: msg
                    });

                } catch (error) {
                    console.error("Failed to update user status:", error);
                    showAlert("Не вдалося оновити ваш статус. Спробуйте перезавантажити сторінку.");
                }
            }
        };

        // Вызываем функцию
        updateUserStatus();

        // Хук будет срабатывать при изменении объекта user,
        // но внутреннее условие if не даст ему зациклиться.
    }, [user]);

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