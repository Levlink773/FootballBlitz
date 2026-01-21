import React, { useState, useEffect } from 'react';
import { Header } from "../components/Header.jsx";
import { NavigationBar } from "../components/NavigationBar.jsx";
import Config from "../config.js";
import { API_BASE_URL } from "../api.js";
import styles from '../css_files/Main.module.css';
import profileStyles from '../css_files/profile/Profile.module.css';

// Icons
import {
    FaGamepad, FaTrophy, FaPercentage, FaGlobeAmericas,
    FaCrown, FaBrain, FaMedal, FaArrowUp, FaArrowDown, FaShieldAlt, FaListOl, FaUserFriends
} from 'react-icons/fa';

import { LootBoxOpeningModal } from "../components/modal_components/LootBoxOpeningModal.jsx";
import { ModalRoot, VipPromoModalWithTitle } from "../components/modal_components/ModalComponents.jsx";

const ProfilePage = ({ user, setUser }) => {
    // --- STATE ---
    const [referralCount, setReferralCount] = useState(0);
    const [isCopied, setIsCopied] = useState(false);
    const [openingBoxType, setOpeningBoxType] = useState(null);
    const [isVipPromoOpen, setIsVipPromoOpen] = useState(false);

    // 🔥 State for Weekly/Seasonal Rank
    const [userRank, setUserRank] = useState(null);
    const [totalUsers, setTotalUsers] = useState(0); // Useful for "Top X% calculations" if needed later
    const [rankLoading, setRankLoading] = useState(true);

    // --- EFFECTS ---
    useEffect(() => {
        if (user?.user_id) {
            // 1. Load Referrals
            fetch(`${API_BASE_URL}/users/${user.user_id}/count_of_ref`)
                .then(res => res.json())
                .then(data => setReferralCount(data.count || 0))
                .catch(err => console.error("Ref load error:", err));

            // 🔥 2. Load Leaderboard Position (Updated to use your Python endpoint)
            // Endpoint: /ranking/my-position?user_id=...&rating_type=seasonal
            fetch(`${API_BASE_URL}/users/ranking/my-position?user_id=${user.user_id}&rating_type=seasonal`)
                .then(res => {
                    if (!res.ok) throw new Error("Rank fetch failed");
                    return res.json();
                })
                .then(data => {
                    // Python backend returns: { position: int, total_users: int, ... }
                    setUserRank(data.position);
                    setTotalUsers(data.total_users);
                })
                .catch(err => {
                    console.error("Rank error:", err);
                    setUserRank(null);
                })
                .finally(() => setRankLoading(false));
        }
    }, [user?.user_id]);

    // --- HANDLERS ---
    const handleCopyLink = () => {
        const link = `https://t.me/football_blitz_bot?start=ref_${user?.user_id}`;
        navigator.clipboard.writeText(link).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const handleBoxClick = (type) => {
        setOpeningBoxType(type);
    };

    const handleBoxClose = (updatedUserData) => {
        setOpeningBoxType(null);
        if (updatedUserData && setUser) {
            setUser(updatedUserData);
        }
    };

    const handleVipClick = () => setIsVipPromoOpen(true);
    const handlePurchase = (type, option) => {
        console.log("Buying VIP:", type, option);
        setIsVipPromoOpen(false);
    };

    // --- HELPERS ---

    // Zone Icon Helper (Optional: Keep if you still use zones, otherwise user defaults)
    const getZoneInfo = (rank) => {
        // Simple logic: Top 3 are promotion, rest are retention for now
        if (rank && rank <= 3) return { icon: <FaArrowUp />, color: '#00ff88', label: 'Лідери' };
        return { icon: <FaShieldAlt />, color: '#a0a0a0', label: 'Ліга' };
    };

    const zoneData = getZoneInfo(userRank);

    // 🔥 UPDATED LOGIC FOR WEEKLY TROPHIES
    const getWeeklyTrophyContent = (rank) => {
        if (rankLoading) return { icon: "...", style: "", title: "Завантаження...", desc: "Оновлення даних" };

        // No Rank or Error
        if (!rank) return {
            icon: <FaMedal />,
            style: profileStyles.medalBox,
            title: "Новачок",
            desc: "Зіграйте матч, щоб потрапити в рейтинг!"
        };

        // 1st Place - Gold
        if (rank === 1) return {
            icon: <FaTrophy />,
            style: profileStyles.goldBox,
            title: "Тижневий Чемпіон",
            desc: "Ви на вершині лідерборду! Так тримати!"
        };

        // 2nd Place - Silver
        if (rank === 2) return {
            icon: <FaTrophy />,
            style: profileStyles.silverBox,
            title: "Срібний Призер",
            desc: "Лише один крок до першого місця."
        };

        // 3rd Place - Bronze
        if (rank === 3) return {
            icon: <FaTrophy />,
            style: profileStyles.bronzeBox,
            title: "Бронзовий Призер",
            desc: "Ви в еліті! Чудовий результат."
        };

        // 4th Place and below - Medal + Motivation
        return {
            icon: <FaMedal />,
            style: profileStyles.medalBox,
            title: `Місце #${rank}`,
            desc: "Продовжуйте перемагати, щоб увійти в Топ-3!"
        };
    };

    const trophyData = getWeeklyTrophyContent(userRank);

    // --- DATA ---
    const lootBoxes = [
        { type: 'SMALL_BOX', count: user.count_of_small_box || 0, image: Config.IMAGES.box_mini },
        { type: 'MEDIUM_BOX', count: user.count_of_medium_box || 0, image: Config.IMAGES.box_medium },
        { type: 'LARGE_BOX', count: user.count_of_big_box || 0, image: Config.IMAGES.box_premium }
    ].filter(box => box.count > 0);

    // Stats Object
    const stats = {
        matches: user.final_count_of_matches || 0,
        winRate: user.precent_winner_matches ? `${user.precent_winner_matches}%` : '0%',
        tournaments: user.count_rich_final_winner_blitz || 0,
        league: user.league || 'Bronze',
        rank: userRank ? `#${userRank}` : '-',
        zone: zoneData
    };

    const vipModalContent = {
        title: user.vip_pass_is_active ? "Ваш VIP Статус" : "Отримай VIP Статус",
        subtitle: user.vip_pass_is_active ? `Активний до: ${new Date(user.vip_pass_expiration_date).toLocaleDateString()}` : "Максимальні бонуси для твоєї кар'єри"
    };

    return (
        <div className={styles.page}>
            <img className={styles.pageBackgroundBlur} src={Config.IMAGES.rating_background} alt="" />

            {/* Modals */}
            {openingBoxType && (
                <LootBoxOpeningModal boxType={openingBoxType} userId={user.user_id} onClose={handleBoxClose} />
            )}
            {isVipPromoOpen && (
                <ModalRoot onClose={() => setIsVipPromoOpen(false)}>
                    <VipPromoModalWithTitle
                        onClose={() => setIsVipPromoOpen(false)}
                        onSubscribe={(option) => handlePurchase('vip', option)}
                        title={vipModalContent.title}
                        subtitle={vipModalContent.subtitle}
                    />
                </ModalRoot>
            )}

            <div className={styles.mainContainer}>
                <Header user={user} />
                <img src={Config.IMAGES.training_background} alt="bg" className={styles.backgroundImage} />

                <div className={profileStyles.profileContainer}>

                    {/* 1. HEADER */}
                    <div className={profileStyles.profileHeader}>
                        <div className={profileStyles.avatarWrapper}>
                            <img src={Config.IMAGES.avatar_uk} alt="Avatar" className={`${profileStyles.avatarImage} ${user.vip_pass_is_active ? profileStyles.vipBorder : ''}`} />
                        </div>
                        <div className={profileStyles.userInfo}>
                            <div className={profileStyles.userName}>{user.team_name_user || user.user_name}</div>
                            <div className={profileStyles.badgesRow}>
                                <div className={`${profileStyles.vipBadgeBtn} ${user.vip_pass_is_active ? profileStyles.vipActive : profileStyles.vipInactive}`} onClick={handleVipClick}>
                                    {user.vip_pass_is_active ? <><FaCrown size={10} /> VIP CLUB</> : <><FaCrown size={10} style={{ opacity: 0.7, position: "relative", left: -5 }} /> <span>GET VIP</span></>}
                                </div>
                                <div className={profileStyles.brainBadge}>
                                    <FaBrain size={10} /> {user.skill_points || 0}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. STATISTICS */}
                    <div className={profileStyles.card}>
                        <div className={profileStyles.sectionTitle}>Статистика</div>
                        <div className={profileStyles.statsGrid}>
                            <div className={profileStyles.statItem}>
                                <FaGamepad color="#ccc" />
                                <div className={profileStyles.statTextWrapper}>
                                    <span className={profileStyles.statValue}>{stats.matches}</span>
                                    <span className={profileStyles.statLabel}>Матчів</span>
                                </div>
                            </div>
                            <div className={profileStyles.statItem}>
                                <FaPercentage color="#00ff88" />
                                <div className={profileStyles.statTextWrapper}>
                                    <span className={`${profileStyles.statValue} ${profileStyles.accentGreen}`}>{stats.winRate}</span>
                                    <span className={profileStyles.statLabel}>Перемог</span>
                                </div>
                            </div>
                            <div className={profileStyles.statItem}>
                                <FaTrophy color="#FFD700" />
                                <div className={profileStyles.statTextWrapper}>
                                    <span className={`${profileStyles.statValue} ${profileStyles.accentGold}`}>{stats.tournaments}</span>
                                    <span className={profileStyles.statLabel}>Турнірів</span>
                                </div>
                            </div>
                            <div className={profileStyles.statItem}>
                                <FaGlobeAmericas color="#00F2FF" />
                                <div className={profileStyles.statTextWrapper}>
                                    <span className={`${profileStyles.statValue} ${profileStyles.accentBlue}`}>{stats.league}</span>
                                    <span className={profileStyles.statLabel}>Ліга</span>
                                </div>
                            </div>
                            {/* Rank Stat */}
                            <div className={profileStyles.statItem}>
                                <FaListOl color="#fff" />
                                <div className={profileStyles.statTextWrapper}>
                                    <span className={profileStyles.statValue}>{stats.rank}</span>
                                    <span className={profileStyles.statLabel}>Місце</span>
                                </div>
                            </div>
                            {/* Zone Stat (Visual only now) */}
                            <div className={profileStyles.statItem} style={{ borderColor: stats.zone.color, borderWidth: '1px', borderStyle: 'solid', background: `${stats.zone.color}15` }}>
                                <span style={{ color: stats.zone.color, fontSize: '10px' }}>{stats.zone.icon}</span>
                                <div className={profileStyles.statTextWrapper}>
                                    <span className={profileStyles.statValue} style={{ color: stats.zone.color, fontSize: '10px' }}>
                                        {stats.zone.label}
                                    </span>
                                    <span className={profileStyles.statLabel}>Статус</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. INVENTORY */}
                    <div className={profileStyles.card}>
                        <div className={profileStyles.sectionTitle}>Інвентар</div>
                        <div className={profileStyles.inventoryGrid}>
                            {lootBoxes.map((box, idx) => (
                                <div key={idx} className={profileStyles.inventorySlot} onClick={() => handleBoxClick(box.type)}>
                                    <img src={box.image} alt={box.type} className={profileStyles.itemImage} />
                                    <span className={profileStyles.itemCount}>x{box.count}</span>
                                </div>
                            ))}
                            {Array.from({ length: Math.max(0, 7 - lootBoxes.length) }).map((_, i) => (
                                <div key={`empty-${i}`} className={profileStyles.emptySlot}></div>
                            ))}
                        </div>
                    </div>

                    {/* 🔥 4. WEEKLY RANKING (UPDATED) */}
                    <div className={profileStyles.card}>
                        <div className={profileStyles.sectionTitle}>
                            <FaTrophy style={{ marginRight: 6, color: '#FFD700' }} /> Тижневий Рейтинг
                        </div>

                        <div className={profileStyles.trophyContainer}>
                            {/* Icon Box (Gold/Silver/Bronze/Medal) */}
                            <div className={`${profileStyles.trophyIconBox} ${trophyData.style}`}>
                                {trophyData.icon}
                            </div>

                            {/* Text Info */}
                            <div className={profileStyles.trophyInfo}>
                                <div className={profileStyles.trophyTitle}>
                                    {trophyData.title}
                                </div>
                                <div className={profileStyles.trophyDesc}>
                                    {trophyData.desc}
                                </div>
                                {/* Optional: Show Rank Number if not top 3 */}
                                {userRank > 3 && (
                                    <div className={profileStyles.rankBadge}>
                                        RANK: #{userRank} / {totalUsers}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 5. REFERRAL */}
                    <div className={profileStyles.card}>
                        <div className={profileStyles.sectionTitle}>
                            <FaUserFriends style={{ marginRight: 6 }} /> Запроси друга
                        </div>
                        <div className={profileStyles.refContainer}>
                            <div className={profileStyles.refInfo}>
                                +300 <span style={{ color: '#FFD700' }}>монет</span> та енергії. Друзів: <span style={{ color: '#00ff88', fontWeight: 'bold' }}>{referralCount}</span>
                            </div>
                            <div className={profileStyles.refLinkBox}>
                                https://t.me/football_blitz_bot?start=ref_{user.user_id}
                            </div>
                            <button className={profileStyles.copyButton} onClick={handleCopyLink}>
                                {isCopied ? "Скопійовано! ✅" : "Копіювати посилання"}
                            </button>
                        </div>
                    </div>

                </div>
                <NavigationBar />
            </div>
        </div>
    );
};

export default ProfilePage;