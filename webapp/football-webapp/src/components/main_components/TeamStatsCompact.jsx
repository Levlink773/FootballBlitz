import React, { useEffect, useState } from 'react';
import styles from '../../css_files/main_css/TeamStatsCompact.module.css';
import { FaShieldAlt, FaBolt, FaTrophy, FaUserClock, FaStar } from "react-icons/fa"; // Додали FaStar
import { GiMoneyStack } from "react-icons/gi";
import { API_BASE_URL } from "../../api.js";

export const TeamStatsCompact = ({ user }) => {
    const [rank, setRank] = useState("-");

    useEffect(() => {
        if (!user?.user_id) return;
        const fetchRank = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/users/leaderboard?user_id=${user.user_id}&sort_by=seasonal`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.user_position && data.user_position.rank) {
                        setRank(data.user_position.rank);
                    } else {
                        setRank("-");
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchRank();
    }, [user]);

    if (!user) return null;

    const teamName = user.team_name || "My Team";
    const teamPower = user.team_power || 0;
    const avgAge = user.avg_age || "23.5";
    const avgTalent = user.avg_talent || "0"; // Талант

    // Вартість
    const rawValue = (teamPower * 15000) + (user.money || 0);
    const formatValue = (val) => {
        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
        return `$${val}`;
    };
    const clubValue = formatValue(rawValue);

    return (
        <div className={styles.wrapper}>
            <div className={styles.bgLines}></div>

            {/* ЛІВА ЧАСТИНА */}
            <div className={styles.identitySection}>
                <div className={styles.emblemContainer}>
                    <FaShieldAlt className={styles.emblemIcon} />
                    <div className={styles.emblemGloss}></div>
                </div>
                <div className={styles.infoBlock}>
                    <div className={styles.label}>КЛУБ</div>
                    <h3 className={styles.teamName}>{teamName}</h3>
                    <div className={styles.valueRow}>
                        <GiMoneyStack className={styles.moneyIcon} />
                        <span className={styles.clubValue}>{clubValue}</span>
                    </div>
                </div>
            </div>

            {/* ПРАВА ЧАСТИНА */}
            <div className={styles.statsGrid}>

                {/* OVR (Сила) */}
                <div className={`${styles.statBox} ${styles.powerBox}`}>
                    <div className={styles.statLabel}>OVR</div>
                    <div className={styles.statValueBig}>
                        <FaBolt className={styles.boltIcon} />
                        {teamPower}
                    </div>
                </div>

                {/* КОЛОНКА: Ранг, Талант, Вік */}
                <div className={styles.secondaryStats}>

                    {/* Ранг */}
                    <div className={styles.statRow}>
                        <div className={styles.iconCircle} style={{borderColor: '#FFD700', background: 'rgba(255, 215, 0, 0.15)'}}>
                            <FaTrophy style={{color: '#FFD700', fontSize: '9px'}} />
                        </div>
                        <div className={styles.statTextCol}>
                            <span className={styles.miniLabel} style={{color:'#FFE082'}}>РАНГ</span>
                            <span className={styles.rankValue}>#{rank}</span>
                        </div>
                    </div>

                    {/* Талант (НОВЕ) */}
                    <div className={styles.statRow}>
                        <div className={styles.iconCircle} style={{borderColor: '#E040FB', background: 'rgba(224, 64, 251, 0.15)'}}>
                            <FaStar style={{color: '#E040FB', fontSize: '9px'}} />
                        </div>
                        <div className={styles.statTextCol}>
                            <span className={styles.miniLabel} style={{color:'#EA80FC'}}>ТАЛАНТ</span>
                            <span className={styles.talentValue}>{avgTalent}</span>
                        </div>
                    </div>

                    {/* Вік */}
                    <div className={styles.statRow}>
                        <div className={styles.iconCircle} style={{borderColor: '#00E5FF', background: 'rgba(0, 229, 255, 0.15)'}}>
                            <FaUserClock style={{color: '#00E5FF', fontSize: '9px'}} />
                        </div>
                        <div className={styles.statTextCol}>
                            <span className={styles.miniLabel} style={{color:'#81D4FA'}}>ВІК</span>
                            <span className={styles.ageValue}>{avgAge}</span>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
export default TeamStatsCompact;