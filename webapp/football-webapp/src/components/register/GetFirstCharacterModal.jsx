import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { FaFutbol, FaStar, FaQuestion } from 'react-icons/fa'; // Нові іконки
import styles from '../../css_files/register/GetFirstCharacterModal.module.css';
import { claimFirstCharacter } from '../../api';
import { CharacterRevealCard } from './CharacterRevealCard.jsx';

// Анімація появи модалки
const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: "spring", stiffness: 200, damping: 20 }
    },
    exit: { opacity: 0, scale: 0.5, transition: { duration: 0.3 } }
};

// Анімація "дихання" для таємної картки
const cardFloatVariants = {
    animate: {
        y: [0, -10, 0],
        rotate: [0, 2, -2, 0],
        filter: [
            "drop-shadow(0 0 15px rgba(255, 215, 0, 0.3))",
            "drop-shadow(0 0 30px rgba(255, 215, 0, 0.6))",
            "drop-shadow(0 0 15px rgba(255, 215, 0, 0.3))"
        ],
        transition: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
};

export const GetFirstCharacterModal = ({ user, onCharacterClaimed }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [revealedCharacter, setRevealedCharacter] = useState(null);
    const [fullUpdatedUser, setFullUpdatedUser] = useState(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleGetCharacterClick = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Ефект напруги перед відкриттям
            await new Promise(resolve => setTimeout(resolve, 2000));

            const updatedUser = await claimFirstCharacter(user.user_id);

            if (updatedUser && updatedUser.main_character) {
                setFullUpdatedUser(updatedUser);
                setRevealedCharacter(updatedUser.main_character);
                setShowConfetti(true);
            } else {
                throw new Error("Сервер не відповів. Спробуй ще раз!");
            }
        } catch (err) {
            setError(err.message || 'Щось пішло не так.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            {showConfetti && (
                <Confetti
                    width={windowSize.width}
                    height={windowSize.height}
                    recycle={false}
                    numberOfPieces={500}
                    gravity={0.15}
                    colors={['#FFD700', '#FFFFFF', '#000000']} // Золоті конфетті
                    onConfettiComplete={() => setShowConfetti(false)}
                />
            )}

            <AnimatePresence mode="wait">
                {!revealedCharacter ? (
                    <motion.div
                        key="prompt"
                        className={styles.modalContent}
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Декоративна зірка зверху */}
                        <div className={styles.starIconContainer}>
                            <FaStar className={styles.starIcon} />
                        </div>

                        <h2 className={styles.title}>Твій Капітан</h2>

                        {/* ВІЗУАЛІЗАЦІЯ "ТАЄМНОГО ПАКУ" */}
                        <div className={styles.mysteryScene}>
                            <motion.div
                                className={styles.mysteryCard}
                                variants={cardFloatVariants}
                                animate="animate"
                            >
                                <FaQuestion className={styles.questionMark} />
                            </motion.div>
                            <div className={styles.mysteryGlow}></div>
                        </div>

                        <p className={styles.description}>
                            Хто поведе твою команду до перемоги?<br/>
                            Відкрий пак, щоб дізнатися!
                        </p>

                        <motion.button
                            className={styles.claimButton}
                            onClick={handleGetCharacterClick}
                            disabled={isLoading}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {isLoading ? (
                                <div className={styles.loaderWrapper}>
                                    <FaFutbol className={styles.spinningBall} />
                                    <span>ВІДКРИВАЄМО...</span>
                                </div>
                            ) : (
                                'ВІДКРИТИ ПАК'
                            )}
                        </motion.button>

                        <AnimatePresence>
                            {error && (
                                <motion.p
                                    className={styles.errorText}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                >
                                    ⚠️ {error}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    // Передаємо стиль обгортки, щоб картка не була прозорою
                    <div className={styles.revealWrapper}>
                        <CharacterRevealCard
                            key="reveal"
                            character={revealedCharacter}
                            onContinue={() => onCharacterClaimed(fullUpdatedUser)}
                        />
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};