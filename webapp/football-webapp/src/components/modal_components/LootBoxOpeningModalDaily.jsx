import React, { useEffect, useState, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactCanvasConfetti from 'react-canvas-confetti';
import Confetti from "react-confetti";
import Config from '../../config.js'; // Перевір шлях
import styles from '../../css_files/main_css/InventoryModal.module.css'; // Перевір шлях
import boxOpenSound from '../../assets/public/sounds/lootbox.mp3'; // Перевір шлях
import { API_BASE_URL } from '../../api.js';
import { showAlert } from '../../alertService.jsx';

// --- API Helper для звичайних боксів ---
const openLootBoxAPI = async (userId, boxType) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/open-box`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({box_type: boxType})
    });
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Не вдалося відкрити бокс.');
    }
    return response.json();
};

// --- API Helper для ЩОДЕННОГО боксу ---
const claimDailyBoxAPI = async (userId) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/daily-box/claim`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        // Body не потрібен, бо id в URL, а логіка фіксована
    });
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Не вдалося забрати щоденний бокс.');
    }
    return response.json();
};

const rewardContainerVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 15 } },
};

const rewardItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

// 👇 Додали isDaily = false
export const LootBoxOpeningModal = ({ boxType, userId, onClose, isDaily = false }) => {
    const [animationPhase, setAnimationPhase] = useState('idle');
    const [showConfettiHappy, setShowConfettiHappy] = useState(false);
    const [rewards, setRewards] = useState(null);
    const [updatedUser, setUpdatedUser] = useState(null);

    const getBoxImage = (type) => {
        switch (type) {
            case 'LARGE_BOX': return Config.IMAGES.box_premium;
            case 'MEDIUM_BOX': return Config.IMAGES.box_medium;
            case 'SMALL_BOX': default: return Config.IMAGES.box_mini;
        }
    };

    const boxImage = getBoxImage(boxType);
    const refAnimationInstance = useRef(null);

    const getInstance = useCallback((instance) => {
        refAnimationInstance.current = instance;
    }, []);

    const makeShot = useCallback((particleRatio, opts) => {
        refAnimationInstance.current && refAnimationInstance.current({
            ...opts, origin: { y: 0.6 }, particleCount: Math.floor(200 * particleRatio),
        });
    }, []);

    const fireConfetti = useCallback(() => {
        makeShot(0.25, { spread: 26, startVelocity: 55 });
        makeShot(0.2, { spread: 60 });
    }, [makeShot]);

    useEffect(() => {
        const audio = new Audio(boxOpenSound);
        audio.volume = 0.7;

        const sequence = async () => {
            await new Promise(r => setTimeout(r, 300));
            setAnimationPhase('shaking');

            try {
                // 1. Отримуємо старі дані
                const oldUserDataResponse = await fetch(`${API_BASE_URL}/users/${userId}`);
                const oldUserData = await oldUserDataResponse.json();

                let newUserState;

                // 👇 ВИБІР API ЗАЛЕЖНО ВІД ТИПУ БОКСУ
                if (isDaily) {
                    newUserState = await claimDailyBoxAPI(userId);
                } else {
                    newUserState = await openLootBoxAPI(userId, boxType);
                }

                setUpdatedUser(newUserState);

                // 3. Рахуємо різницю
                const moneyReward = (newUserState.money ?? 0) - (oldUserData.money ?? 0);
                const energyReward = (newUserState.energy ?? 0) - (oldUserData.energy ?? 0);

                setRewards({ money: moneyReward, energy: energyReward });

                audio.play().catch(() => {});
                await new Promise(r => setTimeout(r, 1500));

                setAnimationPhase('revealed');
                fireConfetti();
                setShowConfettiHappy(true);

            } catch (err) {
                console.error("Lootbox Error:", err);
                showAlert(`Помилка: ${err.message}`);
                onClose(); // Закриваємо без оновлення, якщо помилка
            }
        };

        sequence();
    }, [boxType, userId, fireConfetti, isDaily]); // Додали isDaily в залежності

    const handleCollect = () => {
        if (rewards) {
            const htmlMessage = `
                <div style="display: flex; flex-direction: column; gap: 12px; align-items: center; font-size: 16px;">
                    <div style="margin-bottom: 5px;">Ваш баланс поповнено:</div>
                    ${rewards.money > 0 ? `
                    <div style="display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.05); padding: 8px 16px; border-radius: 12px; width: 100%; justify-content: center;">
                        <img src="${Config.IMAGES.coin}" width="24" style="display:block"/> 
                        <span style="font-weight: 800; color: #333;">+${rewards.money} монет</span>
                    </div>` : ''}
                     
                    ${rewards.energy > 0 ? `
                    <div style="display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.05); padding: 8px 16px; border-radius: 12px; width: 100%; justify-content: center;">
                        <img src="${Config.IMAGES.energy}" width="24" style="display:block"/> 
                        <span style="font-weight: 800; color: #333;">+${rewards.energy} енергії</span>
                    </div>` : ''}
                </div>
            `;
            showAlert("Нагороду зараховано! ✅", { html: htmlMessage });
        }
        // Повертаємо оновленого юзера батьківському компоненту
        onClose(updatedUser);
    };

    return ReactDOM.createPortal(
        <div style={{
            position: 'fixed', inset: 0, zIndex: 2147483647, display: 'flex',
            alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(5px)'
        }}>
            <ReactCanvasConfetti refConfetti={getInstance} style={{ position: 'absolute', pointerEvents: 'none', inset: 0, zIndex: 1 }} />

            {showConfettiHappy && (
                <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={400} gravity={0.15} onConfettiComplete={() => setShowConfettiHappy(false)} style={{ zIndex: 2, pointerEvents: 'none' }} />
            )}

            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <AnimatePresence>
                    {animationPhase === 'revealed' && (
                        <motion.div className={styles.flashEffect} initial={{ opacity: 0 }} animate={{ opacity: [0, 0.8, 0] }} transition={{ duration: 0.6 }} style={{ position: 'fixed', inset: 0, background: 'white', zIndex: 5, pointerEvents: 'none' }} />
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {animationPhase !== 'revealed' && (
                        <motion.img key="box-closed" src={boxImage} alt="Box"
                                    initial={{ scale: 0, opacity: 0, y: 50 }}
                                    animate={animationPhase === 'shaking' ? { opacity: 1, scale: 1, y: 0, rotate: [0, -5, 5, -5, 5, -5, 0], transition: { rotate: { duration: 0.4, repeat: Infinity, ease: 'linear' }, scale: { duration: 0.5 }, opacity: { duration: 0.5 } } } : { opacity: 1, scale: 1, y: 0 }}
                                    exit={{ scale: 2, opacity: 0, transition: { duration: 0.3 } }}
                                    style={{ width: '70vw', maxWidth: '350px', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.3))' }}
                        />
                    )}
                </AnimatePresence>

                {animationPhase === 'revealed' && rewards && (
                    <motion.div key="rewards-panel" variants={rewardContainerVariants} initial="hidden" animate="visible"
                                style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', padding: '30px', borderRadius: '24px', width: '85vw', maxWidth: '320px', textAlign: 'center', border: '2px solid rgba(255, 215, 0, 0.3)', boxShadow: '0 0 50px rgba(0,0,0,0.8), inset 0 0 20px rgba(255, 215, 0, 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>

                        <motion.h2 variants={rewardItemVariants} style={{ color: '#FFD700', fontSize: '32px', margin: 0, textShadow: '0 2px 10px rgba(255, 215, 0, 0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Перемога!
                        </motion.h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                            {rewards.money > 0 && (
                                <motion.div variants={rewardItemVariants} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', fontSize: '24px', color: 'white', background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px' }}>
                                    <img src={Config.IMAGES.coin} alt="Money" style={{ width: '36px' }} />
                                    <span style={{fontWeight: 'bold'}}>+{rewards.money}</span>
                                </motion.div>
                            )}
                            {rewards.energy > 0 && (
                                <motion.div variants={rewardItemVariants} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', fontSize: '24px', color: 'white', background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px' }}>
                                    <img src={Config.IMAGES.energy} alt="Energy" style={{ width: '36px' }} />
                                    <span style={{fontWeight: 'bold'}}>+{rewards.energy}</span>
                                </motion.div>
                            )}
                        </div>

                        <motion.button variants={rewardItemVariants} onClick={handleCollect}
                                       style={{ width: '100%', padding: '16px 0', borderRadius: '16px', background: 'linear-gradient(90deg, #4CAF50, #8BC34A)', border: 'none', color: 'white', fontWeight: '900', fontSize: '18px', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 4px 15px rgba(76, 175, 80, 0.5)', marginTop: '10px' }}
                                       whileHover={{ scale: 1.05, brightness: 1.2 }} whileTap={{ scale: 0.95 }}>
                            ЗАБРАТИ
                        </motion.button>
                    </motion.div>
                )}
            </div>
        </div>,
        document.body
    );
};