import React, { useState, useEffect, useMemo } from 'react';
import styles from '../css_files/pages_css/SeasonPassPage.module.css';
import Config from "../config.js";
import { api, API_BASE_URL } from "../api.js";
import { showInfoModal, showAlert } from "../alertService.jsx";

// Icons
import { FaBoxOpen, FaTrophy, FaStar, FaClock, FaCheck, FaLock } from "react-icons/fa";
import { GiCrown, GiBrain } from "react-icons/gi";

// --- HELPERS ---

// Helper function to get Image URL and Text for the Modal
const getRewardModalData = (rewardStr) => {
    if (!rewardStr) return { text: 'Нагороду', image: Config.IMAGES.trophy };

    const parts = rewardStr.split('_');

    // --- MONEY ---
    if (rewardStr.startsWith('money')) {
        const amount = parseInt(parts[1], 10) || 0;
        let img = Config.IMAGES.coin_mini;
        if (amount >= 7000) img = Config.IMAGES.coin_large;
        else if (amount >= 3000) img = Config.IMAGES.coin_medium;

        return { text: `${amount} монет`, image: img };
    }

    // --- ENERGY ---
    if (rewardStr.startsWith('energy')) {
        const amount = parseInt(parts[1], 10) || 0;
        let img = Config.IMAGES.energy_mini;
        if (amount >= 300) img = Config.IMAGES.energy_large;
        else if (amount >= 200) img = Config.IMAGES.energy_medium;

        return { text: `${amount} енергії`, image: img };
    }

    // --- BOXES ---
    if (rewardStr.startsWith('box')) {
        let img = Config.IMAGES.box_mini;
        let name = "Маленький бокс, ви можете його відкрити в профілі";

        if (rewardStr.includes('medium')) {
            img = Config.IMAGES.box_medium;
            name = "Середню Скриню, ви можете його відкрити в профілі";
        } else if (rewardStr.includes('big') || rewardStr.includes('premium')) {
            img = Config.IMAGES.box_premium;
            name = "Преміум Скриню, ви можете його відкрити в профілі";
        }

        return { text: name, image: img };
    }

    // --- BOOSTS ---
    if (rewardStr.startsWith('boost')) {
        const type = parts[1];
        let img = Config.IMAGES.trophy;
        let name = "Буст";

        if (type === 'training') { img = Config.IMAGES.boost_training; name = "Буст Тренування, дівіться в профілі"; }
        if (type === 'team') { img = Config.IMAGES.boost_team; name = "Буст Команди, дівіться в профілі"; }
        if (type === 'strength') { img = Config.IMAGES.boost_strength; name = "Буст Сили, дівіться в профілі"; }

        return { text: name, image: img };
    }

    // --- SKILL ---
    if (rewardStr.startsWith('skill')) {
        // Тепер використовуємо GiBrain замість трофея
        // Ми стилізуємо його під велику іконку для модального вікна
        return {
            text: `${parts[1]} очок навику`,
            image: <GiBrain style={{ fontSize: '80px', color: '#ff9ff3', filter: 'drop-shadow(0 0 15px #ff9ff3)' }} />
        };
    }

    return { text: 'Нагороду', image: Config.IMAGES.trophy };
};

// Helper to extract info from reward string (FOR CARD DISPLAY)
export const parseReward = (rewardStr) => {
    // Повертаємо об'єкт із додатковим полем 'subtitle'
    if (!rewardStr) return { type: 'unknown', qty: '', subtitle: null, icon: <FaBoxOpen color="#ccc" /> };

    const parts = rewardStr.split('_');
    const fmt = (val) => val ? 'x' + val : '';

    // --- MONEY (COINS) ---
    if (rewardStr.startsWith('money')) {
        const amount = parseInt(parts[1], 10) || 0;
        let imgSrc = Config.IMAGES.coin_mini;

        if (amount >= 7000) {
            imgSrc = Config.IMAGES.coin_large;
        } else if (amount >= 3000) {
            imgSrc = Config.IMAGES.coin_medium;
        }

        return {
            type: 'money',
            qty: fmt(parts[1]),
            // Зміщено на 8px вправо
            icon: <img
                src={imgSrc}
                alt="coins"
                style={{ width: '80%', height: '80%', objectFit: 'contain', filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.5))', marginLeft: '8px' }}
            />
        };
    }

    // --- ENERGY ---
    if (rewardStr.startsWith('energy')) {
        const amount = parseInt(parts[1], 10) || 0;
        let imgSrc = Config.IMAGES.energy_mini;

        if (amount >= 300) {
            imgSrc = Config.IMAGES.energy_large;
        } else if (amount >= 200) {
            imgSrc = Config.IMAGES.energy_medium;
        }

        return {
            type: 'energy',
            qty: fmt(parts[1]),
            // Зміщено на 8px вправо
            icon: <img
                src={imgSrc}
                alt="energy"
                style={{ width: '75%', height: '75%', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(0, 250, 154, 0.4))', marginLeft: '8px' }}
            />
        };
    }

    // --- BOXES ---
    if (rewardStr.startsWith('box')) {
        let qty = '';
        if (parts.length > 2 && !isNaN(parts[2])) qty = 'x' + parts[2];

        let imgSrc = Config.IMAGES.box_mini;

        if (rewardStr.includes('medium')) {
            imgSrc = Config.IMAGES.box_medium;
        } else if (rewardStr.includes('big') || rewardStr.includes('premium')) {
            imgSrc = Config.IMAGES.box_premium;
        } else {
            imgSrc = Config.IMAGES.box_mini;
        }

        return {
            type: 'box',
            qty: qty,
            // Зміщено на 8px вправо
            icon: <img
                src={imgSrc}
                alt="box"
                style={{ width: '85%', height: '85%', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))', marginLeft: '8px' }}
            />
        };
    }

    // --- SKILL (BRAIN) ---
    if (rewardStr.startsWith('skill')) {
        return {
            type: 'skill',
            qty: fmt(parts[1]),
            icon: <img
                src={Config.IMAGES.trophy}
                alt="coins"
                style={{ width: '80%', height: '80%', objectFit: 'contain', filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.5))', marginLeft: '8px' }}
            />
        };
    }

    // --- BOOSTS ---
    if (rewardStr.startsWith('boost')) {
        const boostType = parts[1] || 'unknown';
        const value = parts[2] || '';
        const duration = parts[3] || '';

        let imgSrc = Config.IMAGES.trophy || '';
        let subtitleText = 'Boost';

        switch (boostType) {
            case 'training':
                imgSrc = Config.IMAGES.boost_training;
                subtitleText = value ? `+${value}% EXP` : 'EXP Boost';
                break;
            case 'team':
                imgSrc = Config.IMAGES.boost_team;
                subtitleText = value ? `+${value}% OVR` : 'Team Boost';
                break;
            case 'strength':
                imgSrc = Config.IMAGES.boost_strength;
                subtitleText = value ? `+${value}% POWER` : 'Strength Boost';
                break;
            default:
                subtitleText = 'Boost';
                break;
        }

        if (duration && !duration.includes('trophy')) {
            subtitleText += `, ${duration}`;
        }

        return {
            type: 'boost',
            qty: '',
            subtitle: subtitleText,
            // Зміщено на 10px вправо для кращого центрування
            icon: <img
                src={imgSrc}
                alt={boostType}
                style={{ width: '65%', height: '65%', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.6))', marginBottom: '12px', marginLeft: '10px' }}
            />
        };
    }

    return { type: 'other', qty: '', icon: <FaStar color="#ffffff" /> };
};

// Fallback Config
const FALLBACK_CONFIG = {
    standard: {
        20: 'energy_50', 40: 'money_1000', 60: 'skill_3', 80: 'energy_80', 100: 'box_small',
        120: 'money_2000', 140: 'skill_5', 160: 'energy_120', 180: 'box_small', 200: 'boost_training_50_12h',
        220: 'energy_150', 240: 'skill_7', 260: 'box_medium', 280: 'money_4000', 300: 'boost_team_10_12h',
        320: 'energy_200', 340: 'skill_10', 360: 'box_medium', 380: 'money_5000', 400: 'boost_training_time_50_12h',
        420: 'energy_250', 440: 'skill_15', 460: 'box_big', 480: 'money_7000', 500: 'boost_training_100_12h',
        520: 'energy_300', 540: 'skill_20', 560: 'box_big', 580: 'money_10000', 600: 'boost_strength_25_24h_trophy',
    },
    vip: {
        50: 'energy_900', 150: 'box_small_3', 300: 'money_7000', 450: 'skill_60', 590: 'box_big_3',
    }
};

// Format time remaining
const formatTimeLeft = (isoDate) => {
    let targetDate;
    if (isoDate && isoDate !== "Unknown") {
        targetDate = new Date(isoDate);
    } else {
        const now = new Date();
        targetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }

    const now = new Date();
    const diffMs = targetDate - now;

    if (diffMs <= 0) return "Ended";

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h Left`;
};

// --- COMPONENTS ---

const RewardItem = ({ rewardStr, status, onClick, isVipLocked }) => {
    // Отримуємо subtitle з парсера
    const { qty, icon, subtitle } = parseReward(rewardStr);

    const styledIcon = React.cloneElement(icon, {
        size: 36
    });

    let className = styles.rewardItem;
    if (status === 'available') className += ` ${styles.active}`;
    if (status === 'locked') className += ` ${styles.locked}`;
    if (status === 'claimed') className += ` ${styles.claimed}`;
    if (isVipLocked) className += ` ${styles.tierLocked}`;

    const cursorStyle = { cursor: 'pointer' };

    return (
        <div
            className={className}
            style={cursorStyle}
            onClick={() => {
                onClick();
            }}
        >
            <div className={styles.rewardIcon}>
                {styledIcon}
            </div>

            {/* ВІДОБРАЖЕННЯ ПІДПИСУ БУСТА */}
            {subtitle && (
                <div className={styles.rewardSubtitle}>
                    {subtitle}
                </div>
            )}

            {qty && <div className={styles.quantityBadge}>{qty}</div>}

            {status === 'claimed' && (
                <div className={styles.claimedOverlay}><FaCheck /></div>
            )}
            {isVipLocked && (
                <div className={styles.lockIcon}><FaLock color="#FFD700" /></div>
            )}
        </div>
    );
};

export const SeasonPassPage = ({ user, onClose, setUser, onOpenVip }) => {
    const seasonPass = user?.season_pass;
    const points = seasonPass?.points || 0;
    const collected = seasonPass?.rewards_collected || { standard: [], vip: [] };

    const backendConfig = seasonPass?.config;
    const hasConfig = backendConfig && (Object.keys(backendConfig.standard || {}).length > 0);
    const config = hasConfig ? backendConfig : FALLBACK_CONFIG;

    const endDate = seasonPass?.end_date;
    const timeDisplay = useMemo(() => formatTimeLeft(endDate), [endDate]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/users/${user.user_id}`);
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                }
            } catch (e) {
                console.error("Failed to refresh user data", e);
            }
        };

        if (!seasonPass?.config) {
            fetchUser();
        }
    }, [user.user_id, seasonPass?.config, setUser]);

    const isVipActive = user?.vip_pass_is_active;

    const roadmapRef = React.useRef(null);

    const allMilestones = useMemo(() => {
        const milestones = new Set([
            ...Object.keys(config.standard || {}).map(Number),
            ...Object.keys(config.vip || {}).map(Number)
        ]);
        // 🔥 Сортуємо як було (по зростанню), але при рендері робимо .reverse()
        // або тут зробимо reverse, якщо хочете "знизу вгору" — 
        // Логіка: 1 рівень знизу. Значить рендеримо: [30, 29, ..., 1]
        return Array.from(milestones).sort((a, b) => b - a); // b - a для сортування за спаданням (30 -> 1)
    }, [config]);

    // 🔥 АВТО-СКРОЛ до поточного рівня
    React.useLayoutEffect(() => {
        // Чекаємо трохи рендеру
        setTimeout(() => {
            if (roadmapRef.current) {
                // Знаходимо елемент поточного рівня або найближчого досягнутого
                // Ми можемо знайти по класу .reached (останній з досягнутих буде найвищим числом, але в DOM він вище)
                // Оскільки ми рендеримо зверху-вниз (30 -> 1), то найвищий рівень (наприклад 10) буде вище, ніж 1.

                // Але прогрес йде знизу вгору.
                // points = 50. milestone = 50.
                // render order: 600, ..., 50, ..., 20.

                // Спробуємо знайти елемент з Id "milestone-X"
                // Треба додати ID до row

                let targetScroll = roadmapRef.current.scrollHeight; // За замовчуванням низ (рівень 1)

                // Логіка: знайти перший не пройдений рівень (знизу вгору) або поточний.
                // Оскільки масив [600, ..., 20], то current level десь посередині.

                // Якщо 0 очок - скролимо в самий низ.
                if (points === 0) {
                    roadmapRef.current.scrollTop = roadmapRef.current.scrollHeight;
                    return;
                }

                // Знаходимо найвищий досягнутий майлстоун
                const reached = allMilestones.filter(m => points >= m);
                const currentLevel = reached.length > 0 ? reached[0] : allMilestones[allMilestones.length - 1];
                // reached[0] бо сортування 600->20. Якщо points=50, reached=[50, 40, 20]. reached[0]=50.

                const el = document.getElementById(`milestone-${currentLevel}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    // Fallback to bottom
                    roadmapRef.current.scrollTop = roadmapRef.current.scrollHeight;
                }
            }
        }, 100);
    }, [allMilestones, points]);

    // 3. Розраховуємо точний відсоток прогресу (ПЛАВНА ЛІНІЯ)
    const progressPercentage = useMemo(() => {
        if (allMilestones.length === 0) return 0;
        const maxPoints = allMilestones[allMilestones.length - 1];
        if (maxPoints === 0) return 0;
        let percentage = (points / maxPoints) * 100;
        return Math.min(100, Math.max(0, percentage));
    }, [points, allMilestones]);

    const handleClaim = async (milestone, tier) => {
        try {
            const payload = {
                points_milestone: Number(milestone),
                tier: String(tier)
            };

            const res = await fetch(`${API_BASE_URL}/users/${user.user_id}/season-pass/claim`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.detail || 'Failed to claim');
            }

            const updatedUser = await res.json();
            setUser(updatedUser);

            // --- НОВА ЛОГІКА МОДАЛЬНОГО ВІКНА ---
            // Знаходимо рядок нагороди з конфігу (наприклад, "energy_300")
            const rewardStr = config[tier][milestone];
            // Отримуємо гарний текст і картинку
            const modalData = getRewardModalData(rewardStr);

            showInfoModal({
                text: `Вітаємо, ви отримали ${modalData.text}!`,
                image: modalData.image
            });

        } catch (e) {
            console.error(e);
            showAlert(e.message);
        }
    };

    const handleRewardClick = (tier, rewardStr, milestone, status, isTierActive) => {
        // 1. Отримуємо дані для модалки/відображення
        const modalData = getRewardModalData(rewardStr);

        // 2. Якщо нагорода доступна для отримання - пробуємо забрати (або купити VIP)
        if (status === 'available') {
            handleClaim(milestone, tier);
            return;
        }

        // 3. Якщо це VIP і він заблокований (користувач на Free) -> пропонуємо купити
        if (!isTierActive && tier === 'vip' && status !== 'claimed') {
            // Можна показати інфо про нагороду АБО зразу відкрити покупку.
            // Логічніше відкрити покупку, але користувач просив "що це таке".
            // Давайте покажемо інфо, але з кнопкою "Купити VIP" в модалці?
            // Поки що просто інфо, а покупка - через кнопку зверху.
            // АБО: якщо user клікає на замок в VIP рядку - відкриваємо VIP
            onOpenVip();
            return;
        }

        // 4. В інших випадках (Locked, Claimed, TierLocked) - показуємо INFO
        showInfoModal({
            title: status === 'locked' ? 'Нагорода заблокована' :
                status === 'claimed' ? 'Вже отримано' : 'Інформація',
            text: `Це ${modalData.text}. \n${status === 'locked' ? 'Досягніть необхідного рівня, щоб отримати.' : ''}`,
            image: modalData.image
        });
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modalContainer}>

                {/* HEADER */}
                <div className={styles.header}>
                    <div className={styles.headerTitle}>SEASON PASS</div>
                    <button className={styles.closeButton} onClick={onClose}>&times;</button>
                </div>

                {/* INFO BAR */}
                <div className={styles.seasonInfoBar}>
                    <div className={styles.seasonTime}>
                        <FaClock /> {timeDisplay}
                    </div>
                    <div className={styles.userPoints}>
                        <span style={{ marginRight: '6px', color: '#ccc', fontSize: '12px' }}>POINTS:</span>
                        <span style={{ fontSize: '16px', color: '#fff' }}>{points}</span>
                        <FaTrophy color="#FFD700" style={{ marginLeft: '6px' }} />
                    </div>
                </div>

                {/* TABS */}
                <div className={styles.labelsHeader}>
                    <div className={styles.labelVip} onClick={onOpenVip}>
                        <div>
                            <GiCrown style={{ marginBottom: '-2px', marginRight: '5px', color: '#FFD700' }} />
                            <span>VIP PASS</span>
                        </div>
                    </div>
                    <div className={styles.labelFree}>
                        <div>
                            FREE PASS
                        </div>
                    </div>
                </div>

                {/* SCROLLABLE TRACK */}
                <div
                    className={styles.roadmapContainer}
                    ref={roadmapRef}
                >
                    <div className={styles.roadmapContent}>

                        <div className={styles.trackBackground}>
                            <div
                                className={styles.trackLine}
                                style={{ '--progress-height': `${progressPercentage}%` }}
                            ></div>
                        </div>

                        {allMilestones.length === 0 ? (
                            <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>
                                Loading...
                            </div>
                        ) : (
                            allMilestones.map((milestone) => {
                                const standardReward = config.standard && config.standard[milestone];
                                const vipReward = config.vip && config.vip[milestone];
                                const isReached = points >= milestone;

                                const getStatus = (tier, reward, isTierActive) => {
                                    if (!reward) return 'none';
                                    const isClaimed = collected[tier] && collected[tier].includes(milestone);
                                    if (isClaimed) return 'claimed';
                                    if (isReached) {
                                        if (isTierActive) return 'available';
                                        return 'tier-locked';
                                    }
                                    return 'locked';
                                };

                                const standardStatus = getStatus('standard', standardReward, true);
                                const vipStatus = getStatus('vip', vipReward, isVipActive);

                                return (
                                    <div key={milestone} id={`milestone-${milestone}`} className={styles.milestoneRow}>
                                        {/* LEFT: VIP */}
                                        <div className={styles.sideColumn}>
                                            {vipReward && (
                                                <>
                                                    <div className={styles.connectorLeft}></div>
                                                    <RewardItem
                                                        rewardStr={vipReward}
                                                        status={vipStatus}
                                                        isVipLocked={!isVipActive && vipStatus !== 'claimed'}
                                                        onClick={() => handleRewardClick('vip', vipReward, milestone, vipStatus, isVipActive)}
                                                    />
                                                </>
                                            )}
                                        </div>

                                        {/* CENTER: BADGE */}
                                        <div className={styles.centerColumn}>
                                            <div className={`${styles.pointsBadge} ${isReached ? styles.reached : ''}`}>
                                                {milestone}
                                            </div>
                                        </div>

                                        {/* RIGHT: FREE */}
                                        <div className={styles.sideColumn}>
                                            {standardReward && (
                                                <>
                                                    <div className={styles.connectorRight}></div>
                                                    <RewardItem
                                                        rewardStr={standardReward}
                                                        status={standardStatus}
                                                        onClick={() => handleRewardClick('standard', standardReward, milestone, standardStatus, true)}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};