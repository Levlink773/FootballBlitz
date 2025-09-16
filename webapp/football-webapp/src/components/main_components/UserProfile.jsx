import React, { useState, useEffect } from 'react';
import styles from '../../css_files/main_css/UserProfile.module.css';
import Config from "../../config.js";

// Вспомогательный компонент для отображения статистики, без изменений
const StatItem = ({ icon, alt, value }) => (
    <div className={styles.stat}>
        <img src={icon} alt={alt} aria-label={alt} />
        <span>{value}</span>
    </div>
);

export const UserProfile = ({ user }) => {
    // Состояние для хранения данных загруженного персонажа
    const [character, setCharacter] = useState(null);
    // Состояние для отслеживания процесса загрузки
    const [isLoading, setIsLoading] = useState(true);
    // Состояние для хранения возможной ошибки
    const [error, setError] = useState(null);

    // Хук для выполнения запроса к API при монтировании компонента или изменении user
    useEffect(() => {
        // Проверяем, есть ли у нас пользователь и его ID
        if (!user || !user.user_id) {
            setIsLoading(false);
            setError("Пользователь не найден.");
            return;
        }

        const fetchCharacter = async () => {
            try {
                // Выполняем запрос к вашему API, чтобы получить главного персонажа пользователя
                const response = await fetch(`http://localhost:8123/characters/by-user-main/${user.user_id}`);

                if (!response.ok) {
                    throw new Error(`Ошибка: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                setCharacter(data); // Сохраняем данные персонажа в состояние
            } catch (err) {
                setError(err.message); // Сохраняем ошибку в состояние
                console.error("Не удалось загрузить персонажа:", err);
            } finally {
                setIsLoading(false); // Завершаем загрузку в любом случае
            }
        };

        fetchCharacter();
    }, [user]); // Эффект будет перезапускаться, если объект user изменится

    // Данные для статистики формируются из двух источников:
    // - user (для монет)
    // - character (для таланта и силы)
    const statsData = [
        // Монеты берем из объекта user
        { icon: Config.IMAGES.coin, alt: 'Coins', value: user?.money ?? 0 },
        // Для "Goals" (Цели) используем поле "talent" персонажа
        { icon: Config.IMAGES.target, alt: 'Talent', value: character?.talent ?? 0 },
        // Для "Strength" (Сила) используем поле "power"
        { icon: Config.IMAGES.arm, alt: 'Strength', value: Math.round(character?.power ?? 0) },
    ];

    // --- Логика отображения ---
    if (isLoading) {
        return <div className={styles.userProfile}>Загрузка профиля...</div>;
    }

    if (error) {
        return <div className={styles.userProfile}>Ошибка загрузки: {error}</div>;
    }

    // Если персонаж не найден после загрузки
    if (!character) {
        return <div className={styles.userProfile}>Главный персонаж не найден.</div>;
    }

    return (
        <div className={styles.userProfile}>
            {/* Аватар персонажа (пока используется статичное изображение) */}
            <img
                className={styles.playerImage}
                src={Config.IMAGES.face_character} // В будущем можно заменить на character.avatar_url, если такое поле появится в API
                alt={`${character.name}'s avatar`}
            />

            <div className={styles.infoBox}>
                {/* Левая часть: имя, возраст, страна */}
                <div className={styles.leftSection}>
                    <div className={styles.nameAge}>
                        <span className={styles.name}>{character.name}</span>
                        <span className={styles.age}>, {character.age}</span>
                    </div>

                    <div className={styles.locationGroup}>
                        <img
                            className={styles.locationIcon}
                            src={Config.IMAGES.country} // Иконку можно сделать динамической в зависимости от character.country
                            alt={`${character.country} flag`}
                        />
                        <span className={styles.location}>{character.country}</span>
                    </div>
                </div>

                {/* Правая часть: статистика */}
                <div className={styles.stats}>
                    {statsData.map((stat) => (
                        <StatItem key={stat.alt} {...stat} />
                    ))}
                </div>
            </div>
        </div>
    );
};