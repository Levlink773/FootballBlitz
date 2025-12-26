import React, { useMemo } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { FaBolt, FaStar, FaBirthdayCake } from 'react-icons/fa';
import styles from '../../css_files/register/CharacterRevealCard.module.css';
import Config from "../../config.js";
import {GiGloves, GiRunningShoe, GiShield, GiSoccerBall} from "react-icons/gi";

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
const positionMap = {
    'GOALKEEPER': { label: 'GK', full: 'ВОРОТАР', icon: <GiGloves /> },
    'DEFENDER':   { label: 'DEF', full: 'ЗАХИСНИК', icon: <GiShield /> },
    'MIDFIELDER': { label: 'MID', full: 'ПІВЗАХИСНИК', icon: <GiRunningShoe /> },
    'ATTACKER':   { label: 'FWD', full: 'НАПАДНИК', icon: <GiSoccerBall /> },
    'default':    { label: 'UNK', full: 'ГРАВЕЦЬ', icon: <FaStar /> }
};

// --- ✨ ОНОВЛЕНО: приймаємо counter і customButtonText ---
export const CharacterRevealCard = ({ character, onContinue, customButtonText, counter }) => {
    if (!character) return null;

    // --- 3D Ефекти ---
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [20, -20]);
    const rotateY = useTransform(x, [-100, 100], [-20, 20]);
    const sheenX = useTransform(x, [-100, 100], [0, 100]);
    const sheenY = useTransform(y, [-100, 100], [0, 100]);

    // --- Дані ---
    const flag = countryFlagMap[character.country] || countryFlagMap['default'];
    const posData = positionMap[character.position] || positionMap['default'];
    const overallRating = character.power || 50;

    // --- Розмір шрифту імені ---
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

    return (
        <motion.div
            className={styles.revealContainer}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* 1. Лічильник (ГРАВЕЦЬ 1 / 11) */}
            {counter && (
                <motion.div className={styles.counterBadge} variants={textVariants}>
                    ГРАВЕЦЬ {counter}
                </motion.div>
            )}

            <motion.h2 className={styles.congratsTitle} variants={textVariants}>
                НОВА ЗІРКА!
            </motion.h2>

            {/* 2. Картка з 3D ефектом */}
            <motion.div
                style={{ x, y, rotateX, rotateY, z: 100 }}
                drag
                dragElastic={0.12}
                dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
                whileTap={{ cursor: "grabbing" }}
                className={styles.cardWrapper}
                variants={cardVariants}
            >
                <div className={styles.card}>
                    {/* Блік */}
                    <motion.div
                        className={styles.cardSheen}
                        style={{ backgroundPosition: `${sheenX}% ${sheenY}%` }}
                    />

                    {/* Верх: Рейтинг, Позиція, Прапор */}
                    <div className={styles.cardTopInfo}>
                        <div className={styles.ratingBox}>
                            <span className={styles.ratingNumber}>{overallRating}</span>
                            <span className={styles.ratingLabel}>GEN</span>
                        </div>

                        {/* Позиція */}
                        <div className={styles.positionBox}>
                            <span className={styles.positionIcon}>{posData.icon}</span>
                            <span className={styles.positionLabel}>{posData.label}</span>
                        </div>

                        <div className={styles.flagBox}>
                            {flag}
                        </div>
                    </div>

                    {/* Фото + Повна назва позиції */}
                    <div className={styles.imageContainer}>
                        <div className={styles.imageGlow}></div>
                        <img
                            src={Config.IMAGES.avatar_uk}
                            alt={character.name}
                            className={styles.characterImage}
                        />
                        <div className={styles.positionFullLabel}>
                            {posData.full}
                        </div>
                    </div>

                    {/* Низ: Ім'я та Стати */}
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

            {/* 3. Кнопка */}
            <motion.button
                className={styles.continueButton}
                onClick={onContinue}
                variants={textVariants}
                whileHover={{ scale: 1.05, boxShadow: "0px 0px 25px rgb(255, 215, 0)" }}
                whileTap={{ scale: 0.95 }}
            >
                {customButtonText || "ОТРИМАТИ"}
            </motion.button>
        </motion.div>
    );
};