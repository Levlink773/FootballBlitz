import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Steps } from 'intro.js-react';
import 'intro.js/introjs.css';

import Config from "../../config.js";
import { showAlert } from "../../alertService.jsx";
import { useWebSocketPro } from "../../../useWebsocket.js";
import { API_BASE_URL } from "../../api.js";
import buttonBg from '../../assets/public/vip_emblem_large.png';

// --- Стили (без изменений) ---

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
`;

const CardWrapper = styled.div`
    position: relative;
    width: 320px;
    height: 120px;
    top: 320px;
    left: 67px;
    margin: 20px auto;
    border-radius: 16px;
    overflow: visible;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);
    transition: all 0.3s ease-in-out;
    cursor: pointer;
    animation: ${fadeIn} 0.6s ease-out forwards;

    &:hover {
        transform: translateY(-5px) scale(1.02);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
        border-color: rgba(255, 255, 255, 0.3);
    }
`;

const CardBackground = styled.img`
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 15px;
    opacity: 1;
    filter: brightness(1);
    pointer-events: none;
`;

const CupIcon = styled.img`
    position: absolute;
    width: 105px;
    height: auto;
    left: -45px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    filter: drop-shadow(5px 5px 10px rgba(0, 0, 0, 0.5));
    transition: transform 0.3s ease-out;

    ${CardWrapper}:hover & {
        transform: translateY(-50%) scale(1.05);
    }
`;

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    z-index: 3;
    padding-left: 95px;
    height: 100%;
    gap: 8px;
    position: relative;
    left: -50px;
`;

const Title = styled.div`
    color: white;
    font-size: 18px;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: baseline;
    gap: 8px;

    span {
      font-weight: 500;
      font-size: 16px;
      color: #ccc;
    }
`;

const CountdownWrapper = styled.div`
    background-color: rgba(0, 0, 0, 0.04);
    border-radius: 20px;
    padding: 4px 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

const CountdownText = styled.div`
    color: #FFC93E;
    font-size: 9px;
    position: relative;
    top: 8px;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    text-shadow: 0 0 5px rgba(255, 201, 62, 0.5);
    letter-spacing: 0.5px;
`;

const RegistrationButton = styled.button`
    width: 230px;
    height: 44px;
    border-radius: 12px;
    background: url(${buttonBg}) no-repeat center center;
    box-shadow: 0 4px 10px rgba(248, 165, 39, 0.3);
    border: none;
    border-bottom: 3px solid #C47D0F;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #4D3300;
    font-size: 14px;
    font-family: 'Inter', sans-serif;
    font-weight: 800;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s ease;
    gap: 12px;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(248, 165, 39, 0.5);
    }

    &:active {
        transform: translateY(1px);
        box-shadow: 0 2px 5px rgba(248, 165, 39, 0.4);
        border-bottom-width: 2px;
    }
`;

const CostWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(0, 0, 0, 0.1);
    padding: 2px 6px;
    border-radius: 6px;
    color: white;
    font-weight: 700;
    font-size: 12px;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.4);
`;

const CurrencyIcon = styled.img`
    width: 18px;
    height: 18px;
`;

const RegistrationStatus = styled.div`
    color: #2ecc71;
    font-size: 11px;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    letter-spacing: 0.5px;
    background-color: rgba(46, 204, 113, 0.15);
    padding: 3px 10px;
    border-radius: 10px;
    border: 1px solid rgba(46, 204, 113, 0.4);
`;

const NotRegisteredMessage = styled.div`
    --max-chars-base: 20;
    --max-chars: calc(var(--max-chars-base) * 2);

    color: #f1c40f;
    font-size: 13px;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    text-align: center;
    line-height: 1.4;
    padding: 0 10px 0 80px;
    z-index: 3;
    text-shadow: 1px 1px 3px rgba(0,0,0,0.7);
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
    max-width: calc(var(--max-chars) * 1ch);
`;

// --- Основной компонент EventCard ---
export const EventCard = ({ user, onUserUpdate }) => {
    const [isBlitzActive, setIsBlitzActive] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState(null);
    const [blitzInfo, setBlitzInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notificationShown, setNotificationShown] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [isTutorialEnabled, setTutorialEnabled] = useState(false);
    const navigate = useNavigate();

    const tutorialSteps = [
        {
            element: '[data-tutorial="blitz-register"]',
            intro: 'Чудово! Тепер час взяти участь у першому Бліц-турнірі. Натисніть, щоб зареєструватися!',
            position: 'bottom',
        },
    ];

    const fetchUser = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/users/${user.user_id}`);
            if (!res.ok) return;
            const userData = await res.json();
            if (onUserUpdate) onUserUpdate(userData);
        } catch (e) {
            console.error("fetchUser error", e);
        }
    };

    const formatTime = (totalSeconds) => {
        if (totalSeconds < 0) totalSeconds = 0;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        if (hours > 0) return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const fetchBlitzStatus = useCallback(async () => {
        if (!user?.user_id) return;
        setNotificationShown(false);
        try {
            const activeResponse = await fetch(`${API_BASE_URL}/blitz/active`);
            if (!activeResponse.ok) throw new Error('Failed to fetch active status');
            const activeData = await activeResponse.json();

            if (activeData.active === true) {
                setIsBlitzActive(true);
                setSecondsRemaining(null);
                setBlitzInfo({ info: { title: 'БЛІЦ АКТИВНИЙ' } });
                try {
                    const regResponse = await fetch(`${API_BASE_URL}/blitz/user/${user.user_id}/match_state`);
                    setIsRegistered(regResponse.ok);
                } catch (e) {
                    setIsRegistered(false);
                }
                return;
            }

            setIsBlitzActive(false);
            const nextResponse = await fetch(`${API_BASE_URL}/blitz/next`);
            if (!nextResponse.ok) throw new Error('Failed to fetch next blitz');
            const nextData = await nextResponse.json();

            if (nextData && nextData.blitz_id && nextData.seconds_remaining > 0) {
                setSecondsRemaining(nextData.seconds_remaining);
                setBlitzInfo(nextData);
                try {
                    const regResponse = await fetch(`${API_BASE_URL}/blitz/is_registered/${user.user_id}`);
                    if (regResponse.ok) {
                        const regData = await regResponse.json();
                        setIsRegistered(regData.registered);
                    } else {
                        setIsRegistered(false);
                    }
                } catch (e) {
                    setIsRegistered(false);
                }
            } else {
                setSecondsRemaining(null);
                setBlitzInfo(null);
                setIsRegistered(false);
            }
        } catch (error) {
            console.error("Error fetching blitz status:", error);
            setIsRegistered(false);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    const handleWebSocketMessage = useCallback((data) => {
        switch (data.type) {
            case 'show_alert':
                if (data.payload) {
                    showAlert(data.payload.message, { html: data.payload.html });
                    fetchBlitzStatus();
                }
                break;
            case 'update_max_participants':
                if (data.payload && typeof data.payload.max_participants === 'number') {
                    setBlitzInfo(prev => prev ? { ...prev, info: { ...prev.info, participants_count: data.payload.max_participants } } : prev);
                }
                break;
            default:
                console.warn(`Получен неизвестный тип WebSocket сообщения: ${data.type}`);
        }
    }, [fetchBlitzStatus]);

    useWebSocketPro(user.user_id, handleWebSocketMessage);

    useEffect(() => {
        fetchBlitzStatus();
    }, [fetchBlitzStatus]);

    useEffect(() => {
        if (!isLoading && blitzInfo && user?.status_register === 'FIRST_BLITZ' && !isRegistered) {
            const timer = setTimeout(() => setTutorialEnabled(true), 500);
            return () => clearTimeout(timer);
        }
    }, [isLoading, blitzInfo, user, isRegistered]);

    useEffect(() => {
        if (isLoading || !user || notificationShown || secondsRemaining === null || isBlitzActive || isRegistered) return;
        const registrationThreshold = user.vip_pass_is_active ? 30 * 60 : 20 * 60;
        if (secondsRemaining <= registrationThreshold) {
            showAlert('Реєстрація на бліц відкрита! Натисніть на картку, щоб приєднатися.');
            setNotificationShown(true);
        }
    }, [isLoading, secondsRemaining, user, notificationShown, isBlitzActive, isRegistered]);

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

    const handleRegisterClick = async () => {
        if (isBlitzActive) {
            if (isRegistered) {
                navigate('/match');
            } else {
                showAlert("Ви не зареєстровані на цей бліц. Дочекайтесь наступного.");
            }
            return;
        }

        if (isRegistered) {
            showAlert("Ви вже зареєстровані на цей бліц.");
            return;
        }

        if (!blitzInfo?.blitz_id || !user?.user_id) {
            showAlert("Не вдалося отримати інформацію про турнір або користувача.");
            return;
        }

        const isTutorialUser = user?.status_register === 'FIRST_BLITZ';

        if (!isTutorialUser) {
            const isVip = user.vip_pass_is_active;
            const registrationWindow = isVip ? 30 * 60 : 20 * 60;
            if (secondsRemaining > registrationWindow) {
                const minutesLeft = Math.ceil((secondsRemaining - registrationWindow) / 60);
                showAlert(`Реєстрація ще не відкрита. Зачекайте приблизно ${minutesLeft} хв.`);
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
                setNotificationShown(true);
                fetchBlitzStatus();
                await fetchUser();
            }
        } catch (error) {
            console.error("Registration failed:", error);
            showAlert("Сталася помилка під час реєстрації. Спробуйте пізніше.");
        }
    };

    if (isLoading || (!isBlitzActive && !secondsRemaining)) {
        return null;
    }

    const blitzTime = blitzInfo?.info?.blitz_time || "15:00";
    const playersRegistered = blitzInfo?.info?.participants_count;
    const maxPlayers = blitzInfo?.info?.max_participants || 16;
    const registrationCost = blitzInfo?.info?.cost || 30;

    return (
        <>
            <Steps
                enabled={isTutorialEnabled}
                steps={tutorialSteps}
                initialStep={0}
                onExit={() => setTutorialEnabled(false)}
                options={{
                    doneLabel: 'Зрозуміло',
                    nextLabel: 'Далі',
                    prevLabel: 'Назад',
                    hidePrev: true,
                    skipLabel: 'Пропустити',
                    showBullets: false,
                }}
            />
            <CardWrapper onClick={handleRegisterClick} data-tutorial="blitz-register">
                <CardBackground src={Config.IMAGES.football_goal} alt="event background"/>
                <CupIcon src={Config.IMAGES.cup} alt="tournament cup"/>
                {isBlitzActive ? (
                    <ContentWrapper>
                        {isRegistered ? (
                            <RegistrationButton>Увійти в матч</RegistrationButton>
                        ) : (
                            <NotRegisteredMessage>
                                Ви не зареєстровані. <br/> Чекайте на наступний.
                            </NotRegisteredMessage>
                        )}
                    </ContentWrapper>
                ) : (
                    secondsRemaining > 0 && blitzInfo?.info && (
                        <ContentWrapper>
                            <Title>
                                БЛІЦ ({maxPlayers}) <span>{blitzTime} {playersRegistered}/{maxPlayers}</span>
                            </Title>
                            <CountdownWrapper>
                                <CountdownText>ДО СТАРТУ {formatTime(secondsRemaining)}</CountdownText>
                            </CountdownWrapper>
                            {isRegistered ? (
                                <RegistrationStatus>ВИ ЗАРЕЄСТРОВАНІ</RegistrationStatus>
                            ) : (
                                <RegistrationButton type="button">
                                    Зареєструватись
                                    <CostWrapper>
                                        - {registrationCost}
                                        <CurrencyIcon src={Config.IMAGES.energy} alt="cost"/>
                                    </CostWrapper>
                                </RegistrationButton>
                            )}
                        </ContentWrapper>
                    )
                )}
            </CardWrapper>
        </>
    );
};

export default EventCard;