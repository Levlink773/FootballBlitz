import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, {css, keyframes} from 'styled-components';
import { Steps } from 'intro.js-react';
import 'intro.js/introjs.css';
import win_sound from "../../assets/public/sounds/winner.mp3"
import Config from "../../config.js";
import {showAlert, showInfoModal} from "../../alertService.jsx";
import { useWebSocketPro } from "../../../useWebsocket.js";
import { API_BASE_URL } from "../../api.js";
import buttonBg from '../../assets/public/vip_emblem_large.png';

// --- Анімації ---
const fadeIn = keyframes`
    from { opacity: 0; transform: translate(-50%, 20px); }
    to { opacity: 1; transform: translate(-50%, 0); }
`;

const pulseHighlight = keyframes`
  0%, 100% {
    box-shadow: 0 18px 56px rgba(0, 0, 0, 0.55), 0 0 12px rgba(255, 201, 62, 0.75);
    transform: translate(-50%, 0) scale(1.03);
  }
  50% {
    box-shadow: 0 26px 80px rgba(0, 0, 0, 0.65), 0 0 30px rgba(255, 201, 62, 1);
    transform: translate(-50%, 0) scale(1.07);
  }
`;

// --- Стилізовані компоненти ---

const CardWrapper = styled.div`
    position: absolute;
    width: 92%;
    max-width: 320px;
    height: 120px;
    top: 360px;
    left: 50%;
    transform: translateX(-50%);
    margin: 0;
    border-radius: 16px;
    overflow: visible;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);
    transition: all 0.25s ease-in-out;
    cursor: pointer;
    will-change: transform, box-shadow;
    z-index: 10;

    animation: ${props => props.isHighlighted
    ? css`${pulseHighlight} 2s infinite ease-in-out`
    : css`${fadeIn} 0.45s ease-out forwards`
};

    &:hover {
        transform: translate(-50%, -4px) scale(1.02);
        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
        border-color: rgba(255, 255, 255, 0.35);
    }
    
    &::after {
        content: "";
        position: absolute;
        inset: -6px;
        border-radius: 18px;
        pointer-events: none;
        opacity: ${props => props.isHighlighted ? 1 : 0};
        transition: opacity 0.35s ease-out;
        background: radial-gradient(circle at center, rgba(255,201,62,0.45) 0%, transparent 60%);
        filter: blur(14px);
        z-index: 0;
    }
`;

const CardBackground = styled.img`
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 15px;
    pointer-events: none;
    z-index: 1;
`;

const CupIcon = styled.img`
    position: absolute;
    width: 105px;
    height: auto;
    left: -35px; 
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
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    position: relative;
    padding-left: 50px; 
    padding-right: 10px;
`;

const Title = styled.div`
    color: white;
    font-size: 18px;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 8px;
    @media (max-width: 360px) { font-size: 16px; }

    span {
      font-weight: 500;
      font-size: 16px;
      color: #ccc;
      @media (max-width: 360px) { font-size: 14px; }
    }
`;

const CountdownWrapper = styled.div`
    background-color: rgba(0, 0, 0, 0.04);
    border-radius: 20px;
    padding: 4px 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 6px;
`;

const CountdownText = styled.div`
    color: #FFC93E;
    font-size: 9px;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    text-shadow: 0 0 5px rgba(255, 201, 62, 0.5);
    letter-spacing: 0.5px;
`;

const RegistrationButton = styled.button`
    width: 100%;
    max-width: 220px;
    height: 40px;
    border-radius: 12px;
    background: url(${buttonBg}) no-repeat center center;
    background-size: cover;
    box-shadow: 0 4px 10px rgba(248, 165, 39, 0.3);
    border: none;
    border-bottom: 3px solid #C47D0F;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #4D3300;
    font-size: 13px;
    font-family: 'Inter', sans-serif;
    font-weight: 800;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0 10px;
    white-space: nowrap;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(248, 165, 39, 0.5);
    }
    &:active {
        transform: translateY(1px);
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
`;

const CurrencyIcon = styled.img`
    width: 16px;
    height: 16px;
`;

const RegistrationStatus = styled.div`
    color: #2ecc71;
    font-size: 11px;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    background-color: rgba(46, 204, 113, 0.15);
    padding: 3px 10px;
    border-radius: 10px;
    border: 1px solid rgba(46, 204, 113, 0.4);
`;

const NotRegisteredMessage = styled.div`
    color: #f1c40f;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
    line-height: 1.3;
    text-shadow: 1px 1px 3px rgba(0,0,0,0.7);
`;

// Стиль для тексту "Турнір пропущено"
const MissedTutorialText = styled.div`
    color: #fff;
    font-size: 10px;
    font-weight: 500;
    line-height: 1.3;
    text-align: center;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
    background: rgba(0, 0, 0, 0.4);
    padding: 5px 10px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

// --- Основний компонент ---
export const EventCard = ({ user, onUserUpdate }) => {
    const [isBlitzActive, setIsBlitzActive] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState(null);
    const [blitzInfo, setBlitzInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [notificationShown, setNotificationShown] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [isTutorialEnabled, setTutorialEnabled] = useState(false);
    const [isHighlighted, setIsHighlighted] = useState(false);

    // Стан для відображення картки "Пропущено"
    const [tutorialMissed, setTutorialMissed] = useState(false);
    // Щоб модалка не показувалась двічі
    const hasShownTutorialModal = useRef(false);

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
        } catch (e) { console.error("fetchUser error", e); }
    };

    const formatTime = (totalSeconds) => {
        if (totalSeconds < 0) totalSeconds = 0;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        if (hours > 0) return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    // --- Функція для завершення навчання (оновлює бекенд) ---
    const completeTutorialStatus = useCallback(async () => {
        if (!user?.user_id) return;
        try {
            // 🔥 ЗМІНЕНО: END_REGISTER -> HOME
            const response = await fetch(`${API_BASE_URL}/users/${user.user_id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'HOME' }), // Переводимо в статус HOME
            });
            if (response.ok) {
                console.log("Tutorial status auto-updated to HOME");
                fetchUser(); // Це оновить юзера -> App.jsx побачить HOME -> перекине на Main
            }
        } catch (error) {
            console.error("Failed to auto-update tutorial status:", error);
        }
    }, [user?.user_id]);

    const fetchBlitzStatus = useCallback(async () => {
        if (!user?.user_id) return;
        setNotificationShown(false);
        try {
            const activeResponse = await fetch(`${API_BASE_URL}/blitz/active`);
            if (!activeResponse.ok) throw new Error('Failed');
            const activeData = await activeResponse.json();

            if (activeData.active === true) {
                setIsBlitzActive(true);
                setSecondsRemaining(null);
                setBlitzInfo({ info: { title: 'БЛІЦ АКТИВНИЙ' } });
                try {
                    const regResponse = await fetch(`${API_BASE_URL}/blitz/user/${user.user_id}/match_state`);
                    setIsRegistered(regResponse.ok);
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
                try {
                    const regResponse = await fetch(`${API_BASE_URL}/blitz/is_registered/${user.user_id}`);
                    if (regResponse.ok) {
                        const regData = await regResponse.json();
                        setIsRegistered(regData.registered);
                    } else { setIsRegistered(false); }
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

    const handleWebSocketMessage = useCallback((data) => {
        if(data.type === 'show_alert' && data.payload) {
            if (data.payload.message === "Бліц турнір почався!") {
                showAlert(data.payload.message, { html: data.payload.html, sound: win_sound, });
            } else {
                showAlert(data.payload.message, { html: data.payload.html });
            }
            fetchBlitzStatus();
        } else if (data.type === 'update_max_participants' && data.payload) {
            setBlitzInfo(prev => prev ? { ...prev, info: { ...prev.info, participants_count: data.payload.max_participants } } : prev);
        }
    }, [fetchBlitzStatus]);

    useWebSocketPro(user.user_id, handleWebSocketMessage);

    useEffect(() => { fetchBlitzStatus(); }, [fetchBlitzStatus]);

    // --- ГОЛОВНА ЛОГІКА ТУТОРІАЛУ (ВІТАННЯ vs ПРОПУСК) ---
    useEffect(() => {
        // Чекаємо завантаження даних
        if (isLoading || !user || !blitzInfo && !isBlitzActive && secondsRemaining !== null) return;

        // Виконуємо тільки якщо користувач новачок (FIRST_BLITZ) і ми ще не показували модалку
        if (user.status_register === 'FIRST_BLITZ' && !hasShownTutorialModal.current) {

            // Визначаємо, чи доступна реєстрація:
            // 1. Бліц не активний зараз
            // 2. Є таймер (тобто є майбутній бліц)
            const canRegister = !isBlitzActive && secondsRemaining > 0;

            if (canRegister) {
                // СЦЕНАРІЙ 1: Все добре, можна реєструватись
                const msg = `
Вітаю на Бліц-арені – Натискай «Зареєструватися», для реєстрації в найближчий бліц.
Грай, перемагай та отримуй нагороди й рейтинг!
`;
                showInfoModal({
                    image: Config.IMAGES.blitz_info,
                    text: msg
                });
                hasShownTutorialModal.current = true; // Запам'ятовуємо, що показали

            } else {
                // СЦЕНАРІЙ 2: Бліц вже йде або його немає (пропустив)
                const msg = `
Це арена бліц турніру. Зараз на даний момент йде бліц і реєстрація не доступна, але не засмучуйся, скоро буде наступний турнір і ти зможеш на нього встигнути!
`;
                showInfoModal({
                    image: Config.IMAGES.blitz_info,
                    text: msg
                });
                hasShownTutorialModal.current = true;

                // ОДРАЗУ змінюємо статус, щоб користувач не застряг
                completeTutorialStatus();
                setTutorialMissed(true);
            }
        }
    }, [user, isLoading, isBlitzActive, secondsRemaining, blitzInfo, completeTutorialStatus]);


    // --- ПІДСВІТКА КАРТКИ ---
    useEffect(() => {
        // Підсвічуємо, тільки якщо реєстрація ДОСТУПНА і ми НЕ пропустили туторіал
        const shouldShowTutorial = !isLoading && blitzInfo && !isBlitzActive && secondsRemaining > 5 && user?.status_register === 'FIRST_BLITZ' && !isRegistered && !tutorialMissed;

        setIsHighlighted(shouldShowTutorial);
        if (shouldShowTutorial) {
            const timer = setTimeout(() => setTutorialEnabled(true), 500);
            return () => clearTimeout(timer);
        } else { setTutorialEnabled(false); }
    }, [isLoading, blitzInfo, user, isRegistered, isBlitzActive, secondsRemaining, tutorialMissed]);

    // Таймер зворотного відліку
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
        // Якщо туторіал "пропущено", клік по картці нічого не робить (бо там просто текст)
        if (tutorialMissed) return;

        if (isBlitzActive) {
            if (isRegistered) navigate('/match');
            else showAlert("Ви не зареєстровані на цей бліц. Дочекайтесь наступного.");
            return;
        }
        if (isRegistered) { showAlert("Ви вже зареєстровані на цей бліц."); return; }

        // Перевірка статусів
        const allowedStatuses = ['FIRST_BLITZ', 'END_REGISTER'];
        if (!user?.status_register || !allowedStatuses.includes(user.status_register)) {
            showAlert("Реєстрація на бліц-турнір наразі недоступна. Пройдіть навчання!");
            return;
        }

        // Логіка часу реєстрації (для звичайних користувачів, не новачків у туторіалі)
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

            // Если не туториал - показываем обычный алерт
            if (!result.is_tutorial) {
                showAlert(result.message);
            }

            if (response.ok && result.ok) {
                setNotificationShown(true);
                fetchBlitzStatus();

                // 🔥 ВАЖНОЕ ИСПРАВЛЕНИЕ 🔥
                // Если это туториал, мы должны ЯВНО перевести пользователя в статус HOME.
                // Это заставит App.jsx увидеть новый статус и сделать редирект на главную.
                if (result.is_tutorial) {
                    try {
                        await fetch(`${API_BASE_URL}/users/${user.user_id}/status`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'HOME' }) // <-- Ставим статус HOME
                        });
                        console.log("Status updated to HOME locally after registration");
                    } catch (err) {
                        console.error("Failed to set HOME status", err);
                    }
                }

                // Теперь обновляем глобального юзера.
                // App.jsx увидит статус HOME и автоматически перекинет на Main.jsx
                await fetchUser();
            }

        } catch (error) {
            console.error("Registration failed:", error);
            showAlert("Сталася помилка під час реєстрації. Спробуйте пізніше.");
        }
    };

    if (isLoading || (!isBlitzActive && !secondsRemaining && !tutorialMissed)) return null;

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
                options={{ doneLabel: 'Зрозуміло', nextLabel: 'Далі', prevLabel: 'Назад', hidePrev: true, skipLabel: 'Пропустити', showBullets: false }}
            />
            <CardWrapper onClick={handleRegisterClick} data-tutorial="blitz-register" isHighlighted={isHighlighted}>
                <CardBackground src={Config.IMAGES.football_goal} alt="event background"/>
                <CupIcon src={Config.IMAGES.cup} alt="tournament cup"/>

                {/* Вміст картки залежить від станів */}
                <ContentWrapper>
                    {tutorialMissed ? (
                        // --- ВАРІАНТ 1: ТУТОРІАЛ ПРОПУЩЕНО ---
                        <MissedTutorialText>
                            Це арена бліц турніру. Зараз на даний момент йде бліц і реєстрація не доступна,
                            але не засмучуйся, скоро буде наступний турнір і ти зможеш на нього встигнути!
                        </MissedTutorialText>
                    ) : isBlitzActive ? (
                        // --- ВАРІАНТ 2: БЛІЦ АКТИВНИЙ (але це не туторіал) ---
                        isRegistered ? (
                            <RegistrationButton>Увійти в матч</RegistrationButton>
                        ) : (
                            <NotRegisteredMessage>Ви не зареєстровані. <br/> Чекайте на наступний.</NotRegisteredMessage>
                        )
                    ) : (
                        // --- ВАРІАНТ 3: ОЧІКУВАННЯ (Звичайний стан або Туторіал) ---
                        secondsRemaining > 0 && blitzInfo?.info && (
                            <>
                                <Title>БЛІЦ ({maxPlayers}) <span>{blitzTime} {playersRegistered}/{maxPlayers}</span></Title>
                                <CountdownWrapper>
                                    <CountdownText>ДО СТАРТУ {formatTime(secondsRemaining)}</CountdownText>
                                </CountdownWrapper>
                                {isRegistered ? (
                                    <RegistrationStatus>ВИ ЗАРЕЄСТРОВАНІ</RegistrationStatus>
                                ) : (
                                    <RegistrationButton type="button">
                                        Зареєструватись
                                        <CostWrapper>- {registrationCost}<CurrencyIcon src={Config.IMAGES.energy}/></CostWrapper>
                                    </RegistrationButton>
                                )}
                            </>
                        )
                    )}
                </ContentWrapper>
            </CardWrapper>
        </>
    );
};

export default EventCard;