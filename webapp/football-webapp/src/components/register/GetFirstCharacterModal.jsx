import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Confetti from 'react-confetti';
import styles from '../../css_files/register/GetFirstCharacterModal.module.css';
import { claimFirstCharacter } from '../../api';
import { CharacterRevealCard } from './CharacterRevealCard.jsx';

export const GetFirstCharacterModal = ({ user, onCharacterClaimed }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [revealedCharacter, setRevealedCharacter] = useState(null);
    // ✨ 1. ДОБАВЬТЕ НОВОЕ СОСТОЯНИЕ ДЛЯ ХРАНЕНИЯ ПОЛНОГО ОБЪЕКТА ПОЛЬЗОВАТЕЛЯ
    const [fullUpdatedUser, setFullUpdatedUser] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleGetCharacterClick = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));

            const updatedUser = await claimFirstCharacter(user.user_id);

            if (updatedUser && updatedUser.main_character) {
                // ✨ 2. СОХРАНИТЕ ВЕСЬ ОБЪЕКТ
                setFullUpdatedUser(updatedUser);
                // А для отображения карточки - только персонажа
                setRevealedCharacter(updatedUser.main_character);
                setShowConfetti(true);
            } else {
                throw new Error("Не вдалося отримати дані персонажа з сервера.");
            }
        } catch (err) {
            setError(err.message || 'Сталася невідома помилка.');
        } finally {
            setIsLoading(false);
        }
    };

    const promptVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1 },
        exit: { opacity: 0, y: -50, transition: { duration: 0.3 } }
    };

    return (
        <div className={styles.modalOverlay}>
            {showConfetti && (
                <Confetti
                    width={windowSize.width}
                    height={windowSize.height}
                    recycle={false}
                    numberOfPieces={400}
                    gravity={0.1}
                    onConfettiComplete={() => setShowConfetti(false)}
                />
            )}
            <AnimatePresence mode="wait">
                {!revealedCharacter ? (
                    <motion.div
                        key="prompt"
                        className={styles.modalContent}
                        variants={promptVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <h2 className={styles.title}>✨ Перший герой ✨</h2>
                        <p className={styles.description}>
                            Кожна легенда починається з першого кроку.
                            <br />
                            Натисніть, щоб дізнатися, хто приєднається до вашої команди!
                        </p>
                        <motion.button
                            className={styles.claimButton}
                            onClick={handleGetCharacterClick}
                            disabled={isLoading}
                            whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(0, 255, 221, 0.6)' }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {isLoading ? (
                                <div className={styles.loader}></div>
                            ) : (
                                'ОТРИМАТИ ГЕРОЯ'
                            )}
                        </motion.button>
                        {error && <p className={styles.errorText}>{error}</p>}
                    </motion.div>
                ) : (
                    <CharacterRevealCard
                        key="reveal"
                        character={revealedCharacter}
                        onContinue={() => onCharacterClaimed(fullUpdatedUser)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};