import React, {useMemo} from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import styles from '../../css_files/register/CharacterRevealCard.module.css';
import Config from "../../config.js";

// Animation variants (no changes here)
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
            delayChildren: 0.5,
        },
    },
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

// --- (START) NEW UPDATED CODE ---
// Map for country names to flag emojis
const countryFlagMap = {
    'Ukraine': '🇺🇦',
    'Argentina': '🇦🇷',
    'Brazil': '🇧🇷',
    'France': '🇫🇷',
    'Germany': '🇩🇪',
    'Spain': '🇪🇸',
    'England': '🇬🇧',
    'Italy': '🇮🇹',
    'Portugal': '🇵🇹',
    'Netherlands': '🇳🇱',
    'Belgium': '🇧🇪',
    'Croatia': '🇭🇷',
    'Uruguay': '🇺🇾',
    'Mexico': '🇲🇽',
    'USA': '🇺🇸',
    'Canada': '🇨🇦',
    'Japan': '🇯🇵',
    'South Korea': '🇰🇷',
    'Morocco': '🇲🇦',
    'Senegal': '🇸🇳',
    'Nigeria': '🇳🇬',
    // Default fallback emoji
    'default': '🌍',
};


// --- (END) NEW UPDATED CODE ---

export const CharacterRevealCard = ({ character, onContinue }) => {
    if (!character) return null;

    // 3D effect logic (no changes here)
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useTransform(y, [-100, 100], [30, -30]);
    const rotateY = useTransform(x, [-100, 100], [-30, 30]);

    // Get the flag for the character's country, or the default one
    const flag = countryFlagMap[character.country] || countryFlagMap['default'];

    // === NEW: compute dynamic font size for the name ===
    // Base size (rem), decrement per char after 5, min size (rem)
    const baseSizeRem = 1.8;
    const decrementPerCharRem = 0.05;
    const minSizeRem = 0.5;

    // Use useMemo so we don't recalc on unrelated renders
    const nameFontSizeRem = useMemo(() => {
        const name = character.name || "";
        const len = name.length; // counts JS string length (suitable for typical names)
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
            <motion.h2 className={styles.congratsTitle} variants={itemVariants}>
                Вітаємо!
            </motion.h2>

            <motion.div
                style={{ x, y, rotateX, rotateY, z: 100 }}
                drag
                dragElastic={0.18}
                dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
                whileTap={{ cursor: "grabbing" }}
                className={styles.cardWrapper}
                initial={{ opacity: 0, rotateY: 180, scale: 0.5 }}
                animate={{ opacity: 1, rotateY: 0, scale: 1, transition: { duration: 0.7, ease: "easeOut" } }}
            >
                <div className={styles.card}>
                    <div className={styles.cardShine}></div>
                    <motion.div style={{ z: 50 }}>
                        <motion.img
                            src={Config.IMAGES.avatar_uk}
                            alt={character.name}
                            className={styles.characterImage}
                            variants={itemVariants}
                        />
                        <motion.h3
                            className={styles.characterName}
                            variants={itemVariants}
                            // inline style overrides CSS font-size
                            style={{ fontSize: `${nameFontSizeRem}rem` }}
                        >
                            {flag} {character.name}
                        </motion.h3>
                        <motion.div className={styles.statsGrid} variants={itemVariants}>
                            {/* Stats items (no changes) */}
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>Сила</span>
                                <span className={styles.statValue}>💪 {character.power}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>Талант</span>
                                <span className={styles.statValue}>🌟 {character.talent}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statLabel}>Вік</span>
                                <span className={styles.statValue}>🎂 {character.age}</span>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </motion.div>

            <motion.button
                className={styles.continueButton}
                onClick={onContinue}
                variants={itemVariants}
                whileHover={{ scale: 1.1, y: -5 }}
                whileTap={{ scale: 0.95 }}
            >
                Вперед до перемог!
            </motion.button>
        </motion.div>
    );
};