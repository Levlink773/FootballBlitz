import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // ✨ Импортируем для анимаций
import styles from '../../css_files/main_css/UserProfile.module.css';
import Config from "../../config.js";
import { API_BASE_URL } from "../../api.js";
import { InventoryModal } from "./InventoryModal.jsx";
import { showAlert } from '../../alertService'; // ✨ Предполагаем, что у вас есть такой сервис

const AgeIcon = ({ className }) => (
    <svg
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        xmlSpace="preserve"
        width="100%" // Ширина и высота задаются через CSS для гибкости
        height="100%"
        style={{ shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision', imageRendering: 'optimizeQuality', fillRule: 'evenodd', clipRule: 'evenodd' }}
        viewBox="0 0 6.827 6.827"
    >
        <defs><style>{`.fil2{fill:#b38e85}.fil3{fill:#e7e9ee}.fil0{fill:#333;fill-rule:nonzero}`}</style></defs>
        <g id="Layer_x0020_1">
            <g id="_625017608">
                <path id="_625017968" className="fil0" d="M1.596 3.364H5.23a.397.397 0 0 1 .398.398v1.41a.08.08 0 0 1-.08.08H1.278a.08.08 0 0 1-.08-.08v-1.41a.397.397 0 0 1 .398-.398zm3.635.16H1.596a.237.237 0 0 0-.238.238v1.33h4.11v-1.33a.237.237 0 0 0-.237-.238z" />
                <path id="_625017632" className="fil0" d="M1.013 5.441h4.8v-.189h-4.8v.189zm4.88.16H.933a.08.08 0 0 1-.08-.08v-.349a.08.08 0 0 1 .08-.08h4.96a.08.08 0 0 1 .08.08v.349a.08.08 0 0 1-.08-.08z" />
                <path id="_625018160" className="fil0" d="M2.052 2.005h2.723a.395.395 0 0 1 .396.397v1.042a.08.08 0 0 1-.08.08H1.735a.08.08 0 0 1-.08-.08V2.402a.395.395 0 0 1 .397-.397zm2.723.16H2.052a.236.236 0 0 0-.237.237v.962h3.196v-.962a.236.236 0 0 0-.236-.237z" />
                <path id="_625018112" className="fil0" d="M1.198 4.233a.08.08 0 0 0 .16 0v-.041a.224.224 0 0 1 .225-.225.225.225 0 0 1 .225.225v.081a.384.384 0 0 0 .657.272.384.384 0 0 0 .113-.272v-.081a.224.224 0 0 1 .225-.225.225.225 0 0 1 .225.225v.081a.384.384 0 0 0 .385.385.384.384 0 0 0 .385-.385v-.081a.224.224 0 0 1 .225-.225.225.225 0 0 1 .226.225v.081a.384.384 0 0 0 .385.385.384.384 0 0 0 .385-.385v-.081a.224.224 0 0 1 .225-.225.225.225 0 0 1 .225.225v.081a.08.08 0 0 0 .16 0v-.081a.384.384 0 0 0-.657-.272.384.384 0 0 0-.113.272v.081a.224.224 0 0 1-.225.225.225.225 0 0 1-.225-.225v-.081a.384.384 0 0 0-.386-.385.384.384 0 0 0-.385.385v.081a.224.224 0 0 1-.225.225.225.225 0 0 1-.225-.225v-.081a.384.384 0 0 0-.385-.385.384.384 0 0 0-.385.385v.081a.224.224 0 0 1-.225.225.225.225 0 0 1-.225-.225v-.081a.384.384 0 0 0-.657-.272.384.384 0 0 0-.113.272v.04z" />
                <path id="_625017560" className="fil0" d="M1.655 2.733a.08.08 0 0 0 .16 0v-.032a.16.16 0 0 1 .16-.16.159.159 0 0 1 .16.16v.064a.32.32 0 0 0 .32.32.319.319 0 0 0 .32-.32v-.064a.16.16 0 0 1 .159-.16.159.159 0 0 1 .16.16v.064a.319.319 0 0 0 .32.32.319.319 0 0 0 .319-.32v-.064a.16.16 0 0 1 .16-.16.159.159 0 0 1 .16.16v.064a.32.32 0 0 0 .639 0v-.064a.16.16 0 1 1 .32 0v.064a.08.08 0 0 0 .16 0v-.064a.32.32 0 0 0-.64 0v.064a.16.16 0 1 1-.32 0v-.064a.32.32 0 0 0-.32-.32.319.319 0 0 0-.319.32v.064a.16.16 0 0 1-.16.16.159.159 0 0 1-.16-.16v-.064a.32.32 0 0 0-.32-.32.319.319 0 0 0-.319.32v.064a.16.16 0 0 1-.16.16.159.159 0 0 1-.16-.16v-.064a.32.32 0 0 0-.319-.32.319.319 0 0 0-.32.32v.032z" />
                <path id="_625017728" className="fil0" d="M3.8 1.403a.512.512 0 0 1-.022.563.496.496 0 0 1-.307.192.437.437 0 0 1-.343-.079.438.438 0 0 1-.172-.307.495.495 0 0 1 .623-.529.08.08 0 0 1 .057.066c.005.025.01.041.02.048.01.007.03.01.065.005a.08.08 0 0 1 .08.041zm-.087.279a.365.365 0 0 0-.029-.158.209.209 0 0 1-.124-.04.197.197 0 0 1-.068-.096.335.335 0 0 0-.377.368.279.279 0 0 0 .109.196.28.28 0 0 0 .219.049.332.332 0 0 0 .27-.32z" />
            </g>
            <path d="M3.713 1.682a.365.365 0 0 0-.029-.158.209.209 0 0 1-.124-.04.197.197 0 0 1-.068-.096.335.335 0 0 0-.377.368.272.272 0 0 0 .26.25h.028a.336.336 0 0 0 .248-.135.332.332 0 0 0 .062-.19z" style={{ fill: '#f45a52' }} />
            <path className="fil2" d="M4.775 2.165H2.052a.236.236 0 0 0-.237.237v.023a.316.316 0 0 1 .386.05.32.32 0 0 1 .094.226v.064a.16.16 0 1 0 .32 0v-.064a.32.32 0 0 1 .639 0v.064a.16.16 0 1 0 .319 0v-.064a.32.32 0 0 1 .64 0v.064a.16.16 0 1 0 .319 0v-.064a.32.32 0 0 1 .48-.276v-.023a.236.236 0 0 0-.237-.237z" />
            <path className="fil3" d="M3.187 2.991a.319.319 0 0 1-.093-.226v-.064a.16.16 0 1 0-.32 0v.064a.319.319 0 0 1-.64 0v-.064a.16.16 0 0 0-.319 0v.662h3.196V2.702a.16.16 0 1 0-.32 0v.064a.32.32 0 0 1-.639 0v-.064a.16.16 0 1 0-.319 0v.064a.32.32 0 0 1-.546.226z" />
            <path className="fil2" d="M5.091 3.524H1.595a.237.237 0 0 0-.237.238v.118a.382.382 0 0 1 .497.04c.07.07.113.166.113.272v.081a.224.224 0 0 0 .225.225.225.225 0 0 0 .225-.225v-.081a.384.384 0 0 1 .657-.272c.07.07.113.166.113.272v.081a.224.224 0 0 0 .225.225.225.225 0 0 0 .225-.225v-.081a.384.384 0 0 1 .657-.272c.07.07.114.166.114.272v.081a.224.224 0 0 0 .225.225.225.225 0 0 0 .225-.225v-.081a.384.384 0 0 1 .61-.312v-.118a.237.237 0 0 0-.238-.238h-.14z" />
            <path className="fil3" d="M3.142 4.545a.384.384 0 0 1-.114-.272v-.081a.224.224 0 0 0-.225-.225.225.225 0 0 0-.225.225v.081a.384.384 0 0 1-.657.272.384.384 0 0 1-.113-.272v-.081a.224.224 0 0 0-.225-.225.225.225 0 0 0-.225.224v.901h4.11V4.192a.224.224 0 0 0-.224-.225.225.225 0 0 0-.225.225v.081a.384.384 0 0 1-.657.272.384.384 0 0 1-.113-.272v-.081a.224.224 0 0 0-.226-.225.225.225 0 0 0-.225.225v.081a.384.384 0 0 1-.656.272z" />
            <path style={{ fill: '#949494' }} d="M5.549 5.253H1.013v.188h4.8v-.188z" />
        </g>
        <path style={{ fill: 'none' }} d="M0 0h6.827v6.827H0z" />
    </svg>
);

// --- Компонент StatItem (без изменений) ---
const StatItem = ({ icon, value }) => (
    <div className={styles.stat}>
        {icon}
        <span>{value}</span>
    </div>
);

// ✨ --- Новые API-хелперы для чистоты кода ---
const fetchAllCharactersAPI = (userId) => {
    return fetch(`${API_BASE_URL}/users/${userId}/all`);
};

const setMainCharacterAPI = (userId, characterId) => {
    return fetch(`${API_BASE_URL}/users/${userId}/set-main`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character_id: characterId }),
    });
};


export const UserProfile = ({ user, onUserUpdate }) => {
    // ✨ --- Обновленные стейты ---
    const [allCharacters, setAllCharacters] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isSwitching, setIsSwitching] = useState(false); // Для блокировки кнопки во время запроса
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // ✨ --- Обновленный useEffect для загрузки ВСЕХ персонажей ---
    useEffect(() => {
        if (!user || !user.user_id) {
            setIsLoading(false);
            return;
        }

        const loadCharacters = async () => {
            setIsLoading(true);
            try {
                const response = await fetchAllCharactersAPI(user.user_id);
                if (!response.ok) throw new Error(`Network response was not ok`);
                const data = await response.json();

                if (data && data.length > 0) {
                    setAllCharacters(data);
                    // Находим индекс текущего главного персонажа, чтобы отобразить его первым
                    const mainCharIndex = data.findIndex(c => c.id === user.main_character_id);
                    setCurrentIndex(mainCharIndex >= 0 ? mainCharIndex : 0);
                } else {
                    setAllCharacters([]);
                }
            } catch (err) {
                setError(err.message);
                console.error("Failed to load characters:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadCharacters();
    }, [user]); // Перезагружаем при смене пользователя

    // ✨ --- Новая функция для смены персонажа ---
    const handleSwitchCharacter = async (e) => {
        e.stopPropagation(); // Останавливаем всплытие, чтобы не открылось модальное окно
        if (allCharacters.length <= 1 || isSwitching) return;

        setIsSwitching(true);

        const nextIndex = (currentIndex + 1) % allCharacters.length;
        const nextCharacter = allCharacters[nextIndex];

        try {
            const response = await setMainCharacterAPI(user.user_id, nextCharacter.id);
            if (!response.ok) throw new Error('Не вдалося змінити персонажа.');

            const updatedUserData = await response.json();
            onUserUpdate(updatedUserData); // Обновляем данные пользователя в родительском компоненте
            setCurrentIndex(nextIndex); // Меняем отображаемого персонажа локально
            showAlert('Головного персонажа успішно змінено!', 'success');
        } catch (error) {
            showAlert(error.message, 'error');
            console.error(error);
        } finally {
            setIsSwitching(false);
        }
    };

    if (isLoading) return <div className={styles.userProfile}>Завантаження...</div>;
    if (error) return <div className={styles.userProfile}>Помилка завантаження профілю.</div>;
    if (allCharacters.length === 0) return <div className={styles.userProfile}>Персонажі не знайдені.</div>;

    const currentCharacter = allCharacters[currentIndex];
    const nextCharacter = allCharacters.length > 1 ? allCharacters[(currentIndex + 1) % allCharacters.length] : null;

    const statsData = [
        { alt: 'Age', value: currentCharacter?.age ?? 'N/A', icon: <AgeIcon className={styles.statIcon} /> },
        { alt: 'Talent', value: currentCharacter?.talent ?? 'N/A', icon: <img src={Config.IMAGES.target} alt="Talent" className={styles.statIcon} /> },
        { alt: 'Strength', value: Math.round(currentCharacter?.power ?? 0), icon: <img src={Config.IMAGES.arm} alt="Strength" className={styles.statIcon} /> },
    ];

    return (
        <>
            {isModalOpen && (
                <InventoryModal
                    user={user}
                    onClose={() => setIsModalOpen(false)}
                    onUserUpdate={onUserUpdate}
                />
            )}

            <div className={styles.userProfile} onClick={() => setIsModalOpen(true)} title="Відкрити інвентар">
                {/* ✨ --- Контейнер для персонажей и кнопки --- */}
                <div className={styles.characterSwitcher}>
                    <AnimatePresence>
                        {/* Задний персонаж (если есть) */}
                        {nextCharacter && (
                            <motion.img
                                key={nextCharacter.id + '_back'}
                                className={styles.playerImageBack}
                                src={Config.IMAGES.face_2}
                                alt="Next character"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 50 }}
                                transition={{ duration: 0.4 }}
                            />
                        )}

                        {/* Главный персонаж */}
                        <motion.img
                            key={currentCharacter.id}
                            className={styles.playerImage}
                            src={Config.IMAGES.face_character}
                            alt={`${currentCharacter.name}'s avatar`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, type: 'spring' }}
                        />
                    </AnimatePresence>

                    {/* Кнопка переключения (если есть кого переключать) */}
                    {allCharacters.length > 1 && (
                        <button
                            className={styles.switchButton}
                            onClick={handleSwitchCharacter}
                            disabled={isSwitching}
                            title="Змінити персонажа"
                        >
                            {isSwitching ? '...' : (
                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <defs>
                                        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#B59A52"/>
                                            <stop offset="100%" stopColor="#8B6A2A"/>
                                        </linearGradient>
                                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                                            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.15)"/>
                                        </filter>
                                    </defs>
                                    <circle cx="24" cy="24" r="22" fill="url(#goldGradient)" filter="url(#shadow)"/>
                                    <circle cx="24" cy="24" r="20" stroke="#9C8140" strokeWidth="2" fill="none"/>
                                    <path
                                        d="M32 17a10 10 0 0 0-17.32 5.66M16 31a10 10 0 0 0 17.32-5.66"
                                        stroke="#2C2C2C"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        fill="none"
                                    />
                                    <path
                                        d="M32 12v6h-6M16 36v-6h6"
                                        stroke="#2C2C2C"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        fill="none"
                                    />
                                </svg>
                            )}
                        </button>
                    )}
                </div>

                <div className={styles.infoBox}>
                    <div className={styles.leftSection}>
                        <div className={styles.nameAge}>
                            <span className={styles.name}>{currentCharacter.name}</span>
                            <span className={styles.age}>, {currentCharacter.age}</span>
                        </div>
                        <div className={styles.locationGroup}>
                            <img className={styles.locationIcon} src={Config.IMAGES.country} alt={`${currentCharacter.country} flag`} />
                            <span className={styles.location}>{currentCharacter.country}</span>
                        </div>
                    </div>
                    <div className={styles.stats}>
                        {statsData.map((stat) => <StatItem key={stat.alt} icon={stat.icon} value={stat.value} />)}
                    </div>
                </div>
            </div>
        </>
    );
};