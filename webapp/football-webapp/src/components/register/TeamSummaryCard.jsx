import React from 'react';
import { motion } from 'framer-motion';
import { FaShieldAlt } from 'react-icons/fa';
import styles from '../../css_files/register/TeamSummaryCard.module.css';
import Config from "../../config.js";

// Анімація появи контейнера (зум + прозорість)
const containerVariants = {
    hidden: { opacity: 0, scale: 0.8, rotateX: 10 },
    visible: {
        opacity: 1,
        scale: 1,
        rotateX: 0,
        transition: {
            duration: 0.6,
            ease: "easeOut",
            staggerChildren: 0.05 // Швидка поява карток одна за одною
        }
    }
};

// Анімація окремої картки (вилітає знизу)
const cardVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 200, damping: 12 }
    }
};

export const TeamSummaryCard = ({ teamName, characters, onSignContract }) => {
    // Сортуємо: Капітан (найсильніший) перший
    const sortedChars = [...characters].sort((a, b) => b.power - a.power);
    const captain = sortedChars[0];

    // Розрахунок середнього рейтингу команди
    const squadRating = Math.round(characters.reduce((acc, c) => acc + c.power, 0) / characters.length);

    return (
        <motion.div
            className={styles.summaryContainer}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* --- HEADER --- */}
            <div className={styles.header}>
                <div className={styles.ovrBadge}>
                    <span className={styles.powerValue}>{squadRating}</span>
                    <span className={styles.powerLabel}>OVR</span>
                </div>
                <h2 className={styles.teamName}>{teamName || "ULTIMATE XI"}</h2>
            </div>

            {/* --- SQUAD GRID --- */}
            <div className={styles.squadGrid}>
                {sortedChars.map((char) => {
                    const isCaptain = char.id === captain.id;

                    return (
                        <motion.div
                            key={char.id}
                            className={`${styles.playerSlot} ${isCaptain ? styles.captainSlot : ''}`}
                            variants={cardVariants}
                            whileHover={{ y: -5, scale: 1.05, zIndex: 10 }} // Ефект при наведенні
                        >
                            {isCaptain && (
                                <div className={styles.captainBadge}>C</div>
                            )}

                            <div className={styles.cardInner}>
                                <div className={styles.avatarFrame}>
                                    <img src={Config.IMAGES.avatar_uk} alt={char.name} />
                                </div>
                                <span className={styles.playerName}>{char.name}</span>
                                <span className={styles.playerOvr}>{char.power}</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* --- BUTTON --- */}
            <motion.button
                className={styles.signButton}
                onClick={onSignContract}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 1 } }} // Кнопка з'являється трохи пізніше
            >
                ПІДПИСАТИ КОНТРАКТ
            </motion.button>
        </motion.div>
    );
};