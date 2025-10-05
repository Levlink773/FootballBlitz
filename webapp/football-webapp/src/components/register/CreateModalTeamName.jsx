import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaShieldAlt } from 'react-icons/fa';
import styles from '../../css_files/register/CreateTeamModal.module.css';
import { API_BASE_URL } from "../../api.js";

// --- Анімаційні варіанти для Framer Motion ---

// Для появи фону
const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

// Для появи модального вікна (ефект "випригування")
const modalVariants = {
    hidden: { opacity: 0, y: "-50%", scale: 0.8 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 200, damping: 20, staggerChildren: 0.1 }
    },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
};

// Для послідовної появи елементів всередині
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export const CreateTeamModal = ({ user, onTeamCreated }) => {
    const [teamName, setTeamName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!teamName.trim()) {
            setError('Назва команди не може бути порожньою.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            // Імітація затримки для демонстрації завантажувача
            await new Promise(resolve => setTimeout(resolve, 1000));

            const teamRes = await fetch(`${API_BASE_URL}/users/${user.user_id}/team`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ team_name: teamName }),
            });
            if (!teamRes.ok) {
                const errorData = await teamRes.json();
                throw new Error(errorData.detail || 'Не вдалося оновити назву команди.');
            }

            const statusRes = await fetch(`${API_BASE_URL}/users/${user.user_id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'GET_FIRST_CHARACTER' }),
            });
            if (!statusRes.ok) {
                const errorData = await statusRes.json();
                throw new Error(errorData.detail || 'Не вдалося оновити статус користувача.');
            }

            const updatedUser = await statusRes.json();
            onTeamCreated(updatedUser);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            className={styles.modalOverlay}
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
        >
            <motion.div
                className={styles.modalContent}
                variants={modalVariants}
            >
                <motion.h2 variants={itemVariants}>Створи свою Легенду</motion.h2>
                <motion.p variants={itemVariants}>
                    Придумай унікальну назву для своєї команди, щоб розпочати шлях до слави!
                </motion.p>
                <motion.form onSubmit={handleSubmit} variants={itemVariants}>
                    <div className={styles.inputWrapper}>
                        <FaShieldAlt className={styles.inputIcon} />
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="Назва твоєї команди"
                            className={styles.teamInput}
                            disabled={isLoading}
                            maxLength={24}
                        />
                    </div>
                    <motion.button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isLoading}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isLoading ? <div className={styles.loader}></div> : 'Створити команду'}
                    </motion.button>
                </motion.form>
                <AnimatePresence>
                    {error && (
                        <motion.p
                            className={styles.errorText}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {error}
                        </motion.p>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
};
