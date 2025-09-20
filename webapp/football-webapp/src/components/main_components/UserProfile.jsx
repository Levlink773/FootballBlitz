import React, { useState, useEffect } from 'react';
import styles from '../../css_files/main_css/UserProfile.module.css';
import Config from "../../config.js";
import {API_BASE_URL} from "../../api.js";

// --- ИЗМЕНЕНИЕ 1: SVG иконка вынесена в отдельный React компонент ---
// Это хорошая практика, так как делает код чище и позволяет легко переиспользовать иконку.
// Свойство 'className' добавлено для возможности стилизации через CSS модули.
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


// --- ИЗМЕНЕНИЕ 2: Компонент StatItem упрощен ---
// Теперь он может принимать и отображать любой JSX-элемент в качестве иконки (<img>, <svg> и т.д.),
// а не только путь к картинке.
const StatItem = ({ icon, value }) => (
    <div className={styles.stat}>
        {icon}
        <span>{value}</span>
    </div>
);


export const UserProfile = ({ user }) => {
    const [character, setCharacter] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user || !user.user_id) {
            setIsLoading(false);
            setError("Пользователь не найден.");
            return;
        }

        const fetchCharacter = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/characters/by-user-main/${user.user_id}`);
                if (!response.ok) {
                    throw new Error(`Ошибка: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                setCharacter(data);
            } catch (err) {
                setError(err.message);
                console.error("Не удалось загрузить персонажа:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCharacter();
    }, [user]);
    console.log("user: ", user);

    // --- ИЗМЕНЕНИЕ 3: Массив statsData теперь передает готовые JSX-элементы ---
    // Для иконки возраста мы используем наш новый SVG-компонент <AgeIcon />,
    // а для остальных - стандартные теги <img>.
    // Я добавил общий класс 'styles.statIcon' для统一 стилизации всех иконок.
    const statsData = [
        {
            alt: 'Age',
            value: character?.age ?? 0,
            icon: <AgeIcon className={styles.statIcon} aria-label="Age icon" />
        },
        {
            alt: 'Talent',
            value: character?.talent ?? 0,
            icon: <img src={Config.IMAGES.target} alt="Talent" className={styles.statIcon} />
        },
        {
            alt: 'Strength',
            value: Math.round(character?.power ?? 0),
            icon: <img src={Config.IMAGES.arm} alt="Strength" className={styles.statIcon} />
        },
    ];

    if (isLoading) {
        return <div className={styles.userProfile}>Загрузка профиля...</div>;
    }

    if (error) {
        return <div className={styles.userProfile}>Ошибка загрузки: {error}</div>;
    }

    if (!character) {
        return <div className={styles.userProfile}>Главный персонаж не найден.</div>;
    }

    return (
        <div className={styles.userProfile}>
            <img
                className={styles.playerImage}
                src={Config.IMAGES.face_character}
                alt={`${character.name}'s avatar`}
            />
            <div className={styles.infoBox}>
                <div className={styles.leftSection}>
                    <div className={styles.nameAge}>
                        <span className={styles.name}>{character.name}</span>
                        <span className={styles.age}>, {character.age}</span>
                    </div>
                    <div className={styles.locationGroup}>
                        <img
                            className={styles.locationIcon}
                            src={Config.IMAGES.country}
                            alt={`${character.country} flag`}
                        />
                        <span className={styles.location}>{character.country}</span>
                    </div>
                </div>
                <div className={styles.stats}>
                    {statsData.map((stat) => (
                        <StatItem key={stat.alt} icon={stat.icon} value={stat.value} />
                    ))}
                </div>
            </div>
        </div>
    );
};