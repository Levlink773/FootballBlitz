import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Confetti from 'react-confetti';
import { FaFutbol, FaStar, FaQuestion } from 'react-icons/fa'; // Нові іконки
import styles from '../../css_files/register/GetFirstCharacterModal.module.css';
import {claimFirstCharacter, claimFirstTeam} from '../../api';
import { CharacterRevealCard } from './CharacterRevealCard.jsx';
import {TeamSummaryCard} from "./TeamSummaryCard.jsx";

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
    const [status, setStatus] = useState('initial'); // 'initial' | 'revealing' | 'team_summary'
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Дані
    const [fullUpdatedUser, setFullUpdatedUser] = useState(null);
    const [teamCharacters, setTeamCharacters] = useState([]);

    // Індекс поточного персонажа (0..10)
    const [currentIndex, setCurrentIndex] = useState(0);

    const [showConfetti, setShowConfetti] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 1. Відкриття паку (запит на сервер)
    const handleOpenPack = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500)); // Саспенс
            const updatedUser = await claimFirstTeam(user.user_id);

            if (updatedUser && updatedUser.characters && updatedUser.characters.length > 0) {
                setFullUpdatedUser(updatedUser);
                setTeamCharacters(updatedUser.characters);
                setStatus('revealing'); // Переходимо до показу гравців
            } else {
                throw new Error("Не вдалося отримати склад команди.");
            }
        } catch (err) {
            setError(err.message || 'Щось пішло не так.');
        } finally {
            setIsLoading(false);
        }
    };

    // 2. Кнопка "Наступний гравець"
    const handleNextCharacter = () => {
        if (currentIndex < teamCharacters.length - 1) {
            // Показуємо наступного
            setCurrentIndex(prev => prev + 1);
        } else {
            // Всі гравці показані, переходимо до зведення
            setStatus('team_summary');
            setShowConfetti(true); // Конфетті запускаємо тут
        }
    };

    // 3. Фінальна кнопка "Підписати контракт"
    const handleFinish = () => {
        onCharacterClaimed(fullUpdatedUser);
    };

    // Визначаємо текст кнопки для CharacterRevealCard
    const getButtonText = () => {
        if (currentIndex === teamCharacters.length - 1) return "ПОКАЗАТИ КОМАНДУ";
        return "НАСТУПНИЙ ГРАВЕЦЬ";
    };

    return (
        <div className={styles.modalOverlay}>
            {showConfetti && (
                <Confetti
                    width={windowSize.width}
                    height={windowSize.height}
                    recycle={false}
                    numberOfPieces={800}
                    gravity={0.15}
                    colors={['#FFD700', '#FFFFFF', '#000000', '#00FF00']}
                    onConfettiComplete={() => setShowConfetti(false)}
                />
            )}

            <AnimatePresence mode="wait">
                {/* СЦЕНА 1: ЗАКРИТИЙ ПАК */}
                {status === 'initial' && (
                    <motion.div
                        key="pack"
                        className={styles.modalContent}
                        // ... ваші варіанти анімації
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2, filter: "blur(10px)" }}
                    >
                        <div className={styles.starIconContainer}>
                            <FaStar className={styles.starIcon} />
                        </div>
                        <h2 className={styles.title}>Стартовий Набір</h2>
                        <div className={styles.mysteryScene}>
                            <motion.div className={styles.mysteryCard} animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                                <span style={{fontSize: "3rem", fontWeight: "bold", color: "#ffd700"}}>11</span>
                                <span style={{fontSize: "1rem", color: "white"}}>ГРАВЦІВ</span>
                            </motion.div>
                        </div>
                        <p className={styles.description}>
                            Твоя команда готова до старту.<br/>
                            Відкрий пак, щоб познайомитися зі складом!
                        </p>
                        <motion.button
                            className={styles.claimButton}
                            onClick={handleOpenPack}
                            disabled={isLoading}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {isLoading ? 'ГЕНЕРАЦІЯ СКЛАДУ...' : 'ВІДКРИТИ ПАК'}
                        </motion.button>
                        {error && <p className={styles.errorText}>{error}</p>}
                    </motion.div>
                )}

                {/* СЦЕНА 2: ВІДКРИТТЯ ГРАВЦІВ ПО ОДНОМУ */}
                {status === 'revealing' && teamCharacters.length > 0 && (
                    <div className={styles.revealWrapper} key={`char-${currentIndex}`}>
                        <CharacterRevealCard
                            // Використовуємо key, щоб при зміні індексу компонент перемонтовувався і програвав анімацію появи
                            key={currentIndex}
                            character={teamCharacters[currentIndex]}
                            onContinue={handleNextCharacter}
                            // Можна прокинути кастомний текст кнопки
                            customButtonText={getButtonText()}
                            // Можна додати лічильник "1/11"
                            counter={`${currentIndex + 1} / 11`}
                        />
                    </div>
                )}

                {/* СЦЕНА 3: ВСЯ КОМАНДА */}
                {status === 'team_summary' && (
                    <div className={styles.revealWrapper} key="summary">

                        <TeamSummaryCard
                            teamName={fullUpdatedUser.team_name}
                            characters={teamCharacters}
                            onSignContract={handleFinish}
                        />
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};