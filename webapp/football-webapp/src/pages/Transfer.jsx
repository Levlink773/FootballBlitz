// Файл TransferCard.jsx

import React, {useEffect, useState} from 'react';
import {Header} from "../components/Header.jsx";
import Config from "../config.js";
import {NavigationBar} from "../components/NavigationBar.jsx";
import styles from '../css_files/Main.module.css';
import TransferOption from "../components/transfer/Transfer.jsx";
import {showAlert, showInfoModal} from "../alertService.jsx";
import {API_BASE_URL} from "../api.js";

export default function TransferCard({user, setUser}) {
    // ✨ 3. Добавляем логику для смены статуса
    useEffect(() => {
        // Создаем асинхронную функцию внутри useEffect
        const updateUserStatus = async () => {
            // Проверяем, что у пользователя именно статус 'TRANSFER'
            if (user?.status_register === 'TRANSFER') {
                try {
                    console.log('Updating user status from TRANSFER to SHOPPING...');

                    // Отправляем PATCH-запрос на бэкенд для смены статуса
                    const response = await fetch(`${API_BASE_URL}/users/${user.user_id}/status`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        // В теле запроса передаем новый статус
                        body: JSON.stringify({ status: 'SHOPPING' }),
                    });

                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }

                    // Получаем обновленные данные пользователя от сервера
                    const updatedUser = await response.json();

                    // Обновляем состояние пользователя в компоненте
                    setUser(updatedUser);
                    const msg = `
🔹 Тренер:
Трансферний ринок — місце, де ти керуєш складом і заробляєш монети. Можеш продати на ринку або придбати вільних агентів.
Порада: якщо тобі потрібні швидкі кошти продавай миттєво. Якщо хочеш виторгувати більше — виставляй на аукціон і чекай покупця.
Переходимо до магазину речей – тисни Ок -> іконку магазина в правому верхньому кутку.
                    `;
                    showInfoModal({
                        image: Config.IMAGES.transfer_info, // або просто "/assets/images/success_icon.png"
                        text: msg
                    })
                    console.log('User status successfully updated!');

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
                    src={Config.IMAGES.transfer_background}
                    alt="background"
                    className={styles.backgroundImage}
                />
                <div className={styles.contentWrapper}>

                    <TransferOption user={user} onUserUpdate={setUser}/>
                </div>
                <NavigationBar/>
            </div>
        </div>
    );
}