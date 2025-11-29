import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFutbol, FaTrophy, FaHandPointRight, FaHandPointLeft } from 'react-icons/fa';
import styles from '../../css_files/register/CreateTeamModal.module.css';
import { API_BASE_URL } from "../../api.js";

const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: "spring", stiffness: 200, damping: 20 }
    },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

// Анімація для рук (рухаються вліво-вправо)
const pointerLeftVariants = {
    animate: { x: [0, 5, 0], transition: { duration: 0.8, repeat: Infinity } }
};
const pointerRightVariants = {
    animate: { x: [0, -5, 0], transition: { duration: 0.8, repeat: Infinity } }
};

export const CreateTeamModal = ({ user, onTeamCreated }) => {
    const [teamName, setTeamName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!teamName.trim()) {
            setError('Тренер чекає! Введи назву команди.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const teamRes = await fetch(`${API_BASE_URL}/users/${user.user_id}/team`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ team_name: teamName }),
            });
            if (!teamRes.ok) throw new Error('Не вдалося створити команду.');

            const statusRes = await fetch(`${API_BASE_URL}/users/${user.user_id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'GET_FIRST_CHARACTER' }),
            });
            if (!statusRes.ok) throw new Error('Помилка статусу.');

            onTeamCreated(await statusRes.json());
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className={styles.modalContent} variants={modalVariants} initial="hidden" animate="visible" exit="exit">

                <div className={styles.trophyIconContainer}>
                    <FaTrophy className={styles.trophyIcon} />
                </div>

                <h2 className={styles.title}>Створи Клуб Мрії</h2>
                <p className={styles.subtitle}>
                    Придумай легендарну назву для своєї команди!
                </p>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputContainer}>
                        {/* РЯДОК З РУКАМИ І ПОЛЕМ (Flexbox) */}
                        <div className={styles.inputRow}>
                            <motion.div variants={pointerLeftVariants} animate="animate" className={styles.pointerHand}>
                                <FaHandPointRight />
                            </motion.div>

                            <motion.div
                                className={`${styles.inputWrapper} ${error ? styles.inputError : ''}`}
                                whileTap={{ scale: 0.98 }}
                            >
                                <FaFutbol className={styles.inputIcon} />
                                <input
                                    type="text"
                                    value={teamName}
                                    onChange={(e) => { setTeamName(e.target.value); if(error) setError(null); }}
                                    placeholder="Назва..."
                                    className={styles.teamInput}
                                    disabled={isLoading}
                                    maxLength={20}
                                    autoFocus
                                />
                            </motion.div>

                            <motion.div variants={pointerRightVariants} animate="animate" className={styles.pointerHand}>
                                <FaHandPointLeft />
                            </motion.div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div className={styles.errorMessage} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                    ⚠️ {error}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <motion.button type="submit" className={styles.submitButton} disabled={isLoading} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        {isLoading ? <FaFutbol className={styles.spinningBall} /> : 'СТАРТ СЕЗОНУ'}
                    </motion.button>
                </form>
            </motion.div>
        </motion.div>
    );
};