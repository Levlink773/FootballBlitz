import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocketPro } from "../../../useWebsocket.js"; // Перевір шлях імпорту
import { API_BASE_URL } from "../../api.js";
import { showAlert } from "../../alertService.jsx";
import styles from '../../css_files/league/LeagueRegisterButton.module.css'; // Нові стилі
import { FaClock, FaBolt, FaCheckCircle, FaGamepad } from 'react-icons/fa';
import win_sound from "../../assets/public/sounds/winner.mp3"; // Перевір шлях

const LeagueRegisterButton = ({ user, onUserUpdate }) => {
    // --- STATE LOGIC (Copy-paste from EventCard with minor cleanups) ---
    const [isBlitzActive, setIsBlitzActive] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState(null);
    const [blitzInfo, setBlitzInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);

    const navigate = useNavigate();

    // 1. Fetch Blitz Status
    const fetchBlitzStatus = useCallback(async () => {
        if (!user?.user_id) return;
        try {
            const activeResponse = await fetch(`${API_BASE_URL}/blitz/active`);
            if (!activeResponse.ok) throw new Error('Failed');
            const activeData = await activeResponse.json();

            if (activeData.active === true) {
                setIsBlitzActive(true);
                setSecondsRemaining(null);
                setBlitzInfo({ info: { title: 'БЛІЦ АКТИВНИЙ' } });
                // Check registration
                try {
                    const regRes = await fetch(`${API_BASE_URL}/blitz/user/${user.user_id}/match_state`);
                    setIsRegistered(regRes.ok);
                } catch (e) { setIsRegistered(false); }
                return;
            }

            setIsBlitzActive(false);
            const nextResponse = await fetch(`${API_BASE_URL}/blitz/next`);
            if (!nextResponse.ok) throw new Error('Failed');
            const nextData = await nextResponse.json();

            if (nextData && nextData.blitz_id && nextData.seconds_remaining > 0) {
                setSecondsRemaining(nextData.seconds_remaining);
                setBlitzInfo(nextData);
                // Check registration
                try {
                    const regRes = await fetch(`${API_BASE_URL}/blitz/is_registered/${user.user_id}`);
                    if (regRes.ok) {
                        const regData = await regRes.json();
                        setIsRegistered(regData.registered);
                    } else setIsRegistered(false);
                } catch (e) { setIsRegistered(false); }
            } else {
                setSecondsRemaining(null);
                setBlitzInfo(null);
                setIsRegistered(false);
            }
        } catch (error) {
            console.error("Error:", error);
            setIsRegistered(false);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // 2. WebSocket
    const handleWebSocketMessage = useCallback((data) => {
        if(data.type === 'show_alert' && data.payload) {
            if (data.payload.message === "Бліц турнір почався!") {
                showAlert(data.payload.message, { html: data.payload.html, sound: win_sound });
            } else {
                showAlert(data.payload.message, { html: data.payload.html });
            }
            fetchBlitzStatus();
        } else if (data.type === 'update_max_participants' && data.payload) {
            setBlitzInfo(prev => prev ? { ...prev, info: { ...prev.info, participants_count: data.payload.max_participants } } : prev);
        }
    }, [fetchBlitzStatus]);

    useWebSocketPro(user?.user_id, handleWebSocketMessage);
    useEffect(() => { fetchBlitzStatus(); }, [fetchBlitzStatus]);

    // 3. Timer
    useEffect(() => {
        if (isBlitzActive || secondsRemaining === null || secondsRemaining <= 0) return;
        const timerId = setInterval(() => {
            setSecondsRemaining(prev => {
                const newSeconds = prev - 1;
                if (newSeconds < 1) {
                    clearInterval(timerId);
                    setTimeout(fetchBlitzStatus, 1000);
                }
                return newSeconds;
            });
        }, 1000);
        return () => clearInterval(timerId);
    }, [isBlitzActive, secondsRemaining, fetchBlitzStatus]);

    // 4. Time formatter
    const formatTime = (totalSeconds) => {
        if (totalSeconds < 0) totalSeconds = 0;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    };

    // 5. Handle Click
    const handleRegisterClick = async () => {
        if (isBlitzActive) {
            if (isRegistered) navigate('/match');
            else showAlert("Ви не зареєстровані на цей бліц. Дочекайтесь наступного.");
            return;
        }
        if (isRegistered) { showAlert("Ви вже зареєстровані на цей бліц."); return; }

        // Logic check (VIP/Time)
        const isVip = user.vip_pass_is_active;
        const registrationWindow = isVip ? 30 * 60 : 20 * 60;

        // If it's NOT a tutorial user, check time
        if (user.status_register !== 'FIRST_BLITZ') {
            if (secondsRemaining > registrationWindow) {
                const minutesLeft = Math.ceil((secondsRemaining - registrationWindow) / 60);
                showAlert(`Реєстрація ще не відкрита. Зачекайте ${minutesLeft} хв.`);
                return;
            }
        }

        try {
            const response = await fetch(`${API_BASE_URL}/blitz/${blitzInfo.blitz_id}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.user_id }),
            });
            const result = await response.json();

            showAlert(result.message);

            if (response.ok && result.ok) {
                fetchBlitzStatus();
                // Update User logic if needed (e.g. money spent)
                if (onUserUpdate) {
                    const res = await fetch(`${API_BASE_URL}/users/${user.user_id}`);
                    if (res.ok) onUserUpdate(await res.json());
                }
            }
        } catch (error) {
            console.error("Registration failed:", error);
            showAlert("Помилка реєстрації.");
        }
    };


    // --- RENDER LOGIC ---
    if (isLoading) return <div className={styles.loadingText}>Завантаження...</div>;

    const blitzTime = blitzInfo?.info?.blitz_time || "15:00";
    const playersRegistered = blitzInfo?.info?.participants_count || 0;
    const maxPlayers = blitzInfo?.info?.max_participants || 16;
    const registrationCost = blitzInfo?.info?.cost || 30;

    let status = 'WAITING';
    if (isBlitzActive) {
        status = isRegistered ? 'ACTIVE_REG' : 'ACTIVE_NOT_REG';
    } else if (isRegistered) {
        status = 'REGISTERED';
    } else if (secondsRemaining && secondsRemaining > 0) {
        status = 'WAITING';
    } else {
        status = 'CLOSED';
    }

    // Визначаємо додатковий клас для контейнера, якщо гра активна
    const containerClass = (status === 'ACTIVE_REG')
        ? `${styles.registerContainer} ${styles.registerContainerActive}`
        : styles.registerContainer;

    return (
        <div className={containerClass} onClick={handleRegisterClick}>

            {/* Ліва частина */}
            <div className={styles.infoSection}>
                <div className={styles.statusLabel}>
                    {status === 'ACTIVE_REG' && (
                        <span className={styles.statusLive}>
                            <span className={styles.liveDot}></span> БЛІЦ ТРИВАЄ!
                        </span>
                    )}
                    {status === 'ACTIVE_NOT_REG' && <span style={{color: '#FF4444'}}>ТРИВАЄ (Ви не у грі)</span>}
                    {status === 'REGISTERED' && <span style={{color: '#00F2FF'}}>ВИ ЗАРЕЄСТРОВАНІ</span>}
                    {status === 'WAITING' && <span style={{color: '#FFD700'}}>РЕЄСТРАЦІЯ ВІДКРИТА</span>}
                    {status === 'CLOSED' && <span style={{color: '#888'}}>НЕМАЄ ТУРНІРІВ</span>}
                </div>

                {/* Показуємо таймер і гравців, якщо чекаємо або граємо */}
                {(status === 'WAITING' || status === 'REGISTERED' || status === 'ACTIVE_REG') ? (
                    <div className={styles.detailsRow} style={status === 'ACTIVE_REG' ? {borderColor: '#00FF88', background: 'rgba(0, 255, 136, 0.1)'} : {}}>
                        <div className={styles.timeBox}>
                            <FaClock className={styles.iconSmall} style={status === 'ACTIVE_REG' ? {color: '#00FF88'} : {}} />
                            {/* Якщо активний, можна писати "LIVE" або час */}
                            {status === 'ACTIVE_REG' || status === 'ACTIVE_NOT_REG' ? "LIVE" : formatTime(secondsRemaining)}
                        </div>
                        <div className={styles.playersBox}>
                            <FaBolt className={styles.iconSmall} style={status === 'ACTIVE_REG' ? {color: '#00FF88'} : {}} />
                            {playersRegistered}/{maxPlayers}
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Права частина */}
            <div className={styles.actionSection}>
                {status === 'ACTIVE_REG' && (
                    // 🔥 ТУТ ВИКОРИСТОВУЄМО НОВИЙ КЛАС .btnPlay
                    <div className={`${styles.actionButton} ${styles.btnPlay}`}>
                        <FaGamepad /> ГРАТИ
                    </div>
                )}

                {status === 'WAITING' && (
                    <div className={`${styles.actionButton} ${styles.btnRegister}`}>
                        <span>ВСТУПИТИ</span>
                        <div className={styles.costBadge}>
                            -{registrationCost} <FaBolt style={{fontSize: '10px'}}/>
                        </div>
                    </div>
                )}

                {status === 'REGISTERED' && (
                    <div className={`${styles.actionButton} ${styles.btnDone}`}>
                        <FaCheckCircle /> ГОТОВО
                    </div>
                )}

                {(status === 'CLOSED' || status === 'ACTIVE_NOT_REG') && (
                    <div className={`${styles.actionButton} ${styles.btnLocked}`}>
                        ЗАКРИТО
                    </div>
                )}
            </div>

            <div className={styles.sheen}></div>
        </div>
    );
};

export default LeagueRegisterButton;