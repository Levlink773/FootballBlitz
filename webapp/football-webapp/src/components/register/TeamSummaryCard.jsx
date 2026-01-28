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
    const totalPower = characters.reduce((acc, c) => acc + c.power, 0);

    // --- Rarity Logic ---
    const determineRarity = (char) => {
        if (char.rarity) return char.rarity.toUpperCase();
        const { talent, age } = char;
        if (talent >= 9 && age <= 30) return 'EXCLUSIVE';
        if ((talent >= 7 && talent <= 8) || (talent >= 9 && age > 30)) return 'RARE';
        return 'STANDARD';
    };

    const getRarityStyle = (rarity) => {
        switch (rarity) {
            case 'EXCLUSIVE': // Purple Gradient
                return {
                    background: 'linear-gradient(180deg, #ea80fc 0%, #d500f9 40%, #aa00ff 100%)',
                    shadow: 'drop-shadow(0 0 10px rgba(213, 0, 249, 0.6))',
                    scale: 1.05
                };
            case 'RARE': // Orange Gradient
                return {
                    background: 'linear-gradient(180deg, #ffd180 0%, #ff9100 40%, #ff6d00 100%)',
                    shadow: 'drop-shadow(0 0 8px rgba(255, 145, 0, 0.6))',
                    scale: 1
                };
            default: // Standard Gold
                // Use default CSS class style, or explicit gold
                return {
                    // background: 'linear-gradient(180deg, #F8E79C 0%, #D4AF37 40%, #8B6C18 100%)', // Default in CSS
                    shadow: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))',
                    scale: 1
                };
        }
    };

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
                    <span className={styles.powerValue}>{totalPower}</span>
                    <span className={styles.powerLabel}>OVR</span>
                </div>
                <h2 className={styles.teamName}>{teamName || "ULTIMATE XI"}</h2>
            </div>

            {/* --- SQUAD GRID --- */}
            <div className={styles.squadGrid}>
                {sortedChars.map((char) => {
                    const isCaptain = char.id === captain.id;
                    const rarity = determineRarity(char);
                    const styleConfig = getRarityStyle(rarity);

                    return (
                        <motion.div
                            key={char.id}
                            className={`${styles.playerSlot} ${isCaptain ? styles.captainSlot : ''}`}
                            variants={cardVariants}
                            style={!isCaptain ? { // Don't override captain style completely, or merge logic
                                background: styleConfig.background,
                                filter: styleConfig.shadow
                            } : {}}
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