import React, { useMemo } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { FaBolt, FaStar, FaBirthdayCake, FaShieldAlt } from 'react-icons/fa'; // Нові іконки для статів
import styles from '../../css_files/register/CharacterRevealCard.module.css';
import Config from "../../config.js";

// Анімація контейнера
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.3,
            delayChildren: 0.2,
        },
    },
};

// Ефект "випадання" картки з паку
const cardVariants = {
    hidden: { scale: 0, rotate: -20, opacity: 0 },
    visible: {
        scale: 1,
        rotate: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 260,
            damping: 20
        }
    },
};

const textVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

const countryFlagMap = {
    'Ukraine': '🇺🇦', 'Argentina': '🇦🇷', 'Brazil': '🇧🇷', 'France': '🇫🇷',
    'Germany': '🇩🇪', 'Spain': '🇪🇸', 'England': '🇬🇧', 'Italy': '🇮🇹',
    'Portugal': '🇵🇹', 'Netherlands': '🇳🇱', 'Belgium': '🇧🇪', 'Croatia': '🇭🇷',
    'Uruguay': '🇺🇾', 'Mexico': '🇲🇽', 'USA': '🇺🇸', 'Canada': '🇨🇦',
    'Japan': '🇯🇵', 'South Korea': '🇰🇷', 'Morocco': '🇲🇦', 'Senegal': '🇸🇳',
    'Nigeria': '🇳🇬', 'default': '🌍',
};

export const CharacterRevealCard = ({ character, onContinue }) => {
    if (!character) return null;

    // 3D effect logic
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [20, -20]); // Менший кут для реалізму
    const rotateY = useTransform(x, [-100, 100], [-20, 20]);

    // Блік, який рухається разом з мишкою/пальцем
    const sheenX = useTransform(x, [-100, 100], [0, 100]);
    const sheenY = useTransform(y, [-100, 100], [0, 100]);

    const flag = countryFlagMap[character.country] || countryFlagMap['default'];

    // Розрахунок розміру шрифту (залишив твою логіку)
    const baseSizeRem = 1.6;
    const decrementPerCharRem = 0.07;
    const minSizeRem = 0.8;

    const nameFontSizeRem = useMemo(() => {
        const name = character.name || "";
        const len = name.length;
        if (len <= 5) return baseSizeRem;
        const decrement = (len - 5) * decrementPerCharRem;
        return Math.max(minSizeRem, +(baseSizeRem - decrement).toFixed(3));
    }, [character.name]);

    // Використаємо "Силу" як загальний рейтинг (OVR) на картці
    const overallRating = character.power || 50;

    return (
        <motion.div
            className={styles.revealContainer}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.h2 className={styles.congratsTitle} variants={textVariants}>
                НОВА ЗІРКА!
            </motion.h2>

            <motion.div
                style={{ x, y, rotateX, rotateY, z: 100 }}
                drag
                dragElastic={0.12}
                dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
                whileTap={{ cursor: "grabbing" }}
                className={styles.cardWrapper}
                variants={cardVariants}
            >
                {/* Основна картка */}
                <div className={styles.card}>
                    {/* Динамічний блік */}
                    <motion.div
                        className={styles.cardSheen}
                        style={{ backgroundPosition: `${sheenX}% ${sheenY}%` }}
                    />

                    {/* Верхня частина: Рейтинг і Прапор */}
                    <div className={styles.cardTopInfo}>
                        <div className={styles.ratingBox}>
                            <span className={styles.ratingNumber}>{overallRating}</span>
                            <span className={styles.ratingLabel}>GEN</span>
                        </div>
                        <div className={styles.flagBox}>
                            {flag}
                        </div>
                    </div>

                    {/* Зображення */}
                    <div className={styles.imageContainer}>
                        <div className={styles.imageGlow}></div>
                        <img
                            src={Config.IMAGES.avatar_uk}
                            alt={character.name}
                            className={styles.characterImage}
                        />
                    </div>

                    {/* Інфо знизу */}
                    <div className={styles.cardBottom}>
                        <motion.h3
                            className={styles.characterName}
                            style={{ fontSize: `${nameFontSizeRem}rem` }}
                        >
                            {character.name}
                        </motion.h3>

                        <div className={styles.statsRow}>
                            <div className={styles.statItem}>
                                <FaBolt className={styles.statIcon} />
                                <span className={styles.statValue}>{character.power}</span>
                                <span className={styles.statLabel}>POW</span>
                            </div>
                            <div className={styles.statDivider}></div>
                            <div className={styles.statItem}>
                                <FaStar className={styles.statIcon} />
                                <span className={styles.statValue}>{character.talent}</span>
                                <span className={styles.statLabel}>TAL</span>
                            </div>
                            <div className={styles.statDivider}></div>
                            <div className={styles.statItem}>
                                <FaBirthdayCake className={styles.statIcon} />
                                <span className={styles.statValue}>{character.age}</span>
                                <span className={styles.statLabel}>AGE</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.button
                className={styles.continueButton}
                onClick={onContinue}
                variants={textVariants}
                whileHover={{ scale: 1.05, boxShadow: "0px 0px 25px rgb(255, 215, 0)" }}
                whileTap={{ scale: 0.95 }}
            >
                ПІДПИСАТИ КОНТРАКТ
            </motion.button>
        </motion.div>
    );
};