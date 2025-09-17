import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
// Убедитесь, что путь к вашему файлу конфигурации (с изображениями) указан верно
import Config from "../../config.js";
import {showAlert} from "../../alertService.jsx";

// --- Анимации (Keyframes) ---

const fadeIn = keyframes`
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

const pulsate = keyframes`
    0% {
        transform: scale(1);
        opacity: 0.9;
    }
    50% {
        transform: scale(1.02);
        opacity: 1;
    }
    100% {
        transform: scale(1);
        opacity: 0.9;
    }
`;

// --- Стилизованные компоненты (Styled Components) ---

const CardWrapper = styled.div`
    position: relative;
    width: 329px;
    height: 111px;
    margin: 340px auto; /* Эти значения вы можете настроить под свою страницу */
    left: 40px;
    border-radius: 15px;
    overflow: visible;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #1f1f3a 0%, #2f2f55 100%);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(100, 100, 200, 0.3);
    transition: all 0.3s ease-in-out;
    cursor: pointer;
    transform: translateZ(0);
    animation: ${fadeIn} 0.6s ease-out forwards;

    &::before {
        content: '';
        position: absolute;
        top: -2px; left: -2px; right: -2px; bottom: -2px;
        border-radius: 17px;
        background: linear-gradient(45deg, #8a2be2, #4169e1, #00ced1);
        z-index: -1;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
        filter: blur(8px);
    }

    &:hover {
        transform: translateY(-5px) scale(1.02);
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(100, 100, 255, 0.5);
        &::before {
            opacity: 0.7;
        }
    }
`;

const CardBackground = styled.img`
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 15px;
    opacity: 0.15;
    filter: brightness(0.8);
    pointer-events: none;
`;

const CupIcon = styled.img`
    position: absolute;
    width: 94px;
    height: 115px;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    filter: drop-shadow(3px 3px 8px rgba(0, 0, 0, 0.6));
    transition: transform 0.3s ease-out, filter 0.3s ease;

    .card-wrapper:hover & {
        transform: translateY(-55%) translateX(-5px) rotate(-5deg) scale(1.05);
        filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.7));
    }
`;

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    z-index: 3;
    padding-left: 80px; /* Отступ, чтобы текст не налезал на кубок */
`;

const Title = styled.div`
    color: white;
    font-size: 20px;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.7);
    margin-bottom: 5px;
`;

const Countdown = styled.div`
    color: #ffda79;
    font-size: 11px;
    font-family: 'Inter', sans-serif;
    font-weight: 800;
    text-shadow: 0 0 5px rgba(255, 215, 0, 0.7);
    letter-spacing: 1px;
    animation: ${pulsate} 2s infinite ease-in-out;
`;

// Отдельный стиль для кнопки "Войти в матч"
const EnterButton = styled.div`
    position: absolute;
    width: 200px;
    height: 40px;
    bottom: 35px; /* Расположение по вашему дизайну */
    left: 55%;   /* Скорректировано для центрирования */
    transform: translateX(-50%);
    border-radius: 8px;
    background: linear-gradient(90deg, #16a085 0%, #27ae60 100%);
    box-shadow: 0 4px 15px rgba(39, 174, 96, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    transition: all 0.3s ease;
    z-index: 4;

    &:hover {
        transform: translateX(-50%) scale(1.05);
        box-shadow: 0 6px 20px rgba(39, 174, 96, 0.6);
    }
`;


// --- Основной компонент EventCard ---

export const EventCard = ({ user, onUserUpdate }) => { // Теперь компонент принимает 'user'
    const [isBlitzActive, setIsBlitzActive] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState(null);
    const [blitzInfo, setBlitzInfo] = useState(null); // Будет хранить весь объект { blitz_id, info, ... }
    const [isLoading, setIsLoading] = useState(true);
    const fetchUser = async () => {
        try {
            const res = await fetch(`http://localhost:8123/users/${userId}`);
            if (!res.ok) return;
            const userData = await res.json();
            if (onUserUpdate) onUserUpdate(userData);
        } catch (e) {
            console.error("fetchUser error", e);
        }
    };
    // НОВОЕ: Состояние для отслеживания, было ли показано уведомление об открытии регистрации
    const [notificationShown, setNotificationShown] = useState(false);

    // Функция форматирования времени (без изменений)
    const formatTime = (totalSeconds) => {
        if (totalSeconds < 0) totalSeconds = 0;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        if (hours > 0) return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    // Обновленная функция запроса статуса
    const fetchBlitzStatus = useCallback(async () => {
        setNotificationShown(false); // Сбрасываем флаг уведомления при каждом обновлении
        try {
            const activeResponse = await fetch('http://localhost:8123/blitz/active');
            if (!activeResponse.ok) throw new Error('Failed to fetch active status');
            const activeData = await activeResponse.json();

            if (activeData.active === true) {
                setIsBlitzActive(true);
                setSecondsRemaining(null);
                setBlitzInfo({ info: { title: 'БЛІЦ АКТИВНИЙ' } });
                return;
            }

            setIsBlitzActive(false);
            const nextResponse = await fetch('http://localhost:8123/blitz/next');
            if (!nextResponse.ok) throw new Error('Failed to fetch next blitz');
            const nextData = await nextResponse.json();

            if (nextData && nextData.seconds_remaining > 0) {
                setSecondsRemaining(nextData.seconds_remaining);
                setBlitzInfo(nextData); // Сохраняем весь объект, включая blitz_id
            } else {
                setSecondsRemaining(null);
                setBlitzInfo(null);
            }
        } catch (error) {
            console.error("Error fetching blitz status:", error);
            // ... остальная обработка ошибок
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Эффект для первоначальной загрузки (без изменений)
    useEffect(() => {
        fetchBlitzStatus();
    }, [fetchBlitzStatus]);

    // НОВЫЙ ЭФФЕКТ: Для единоразового уведомления об открытии регистрации
    useEffect(() => {
        if (!user || notificationShown || secondsRemaining === null || isBlitzActive) {
            return;
        }

        const isVip = user.vip_pass_is_active; // Предполагаем, что у юзера есть это поле
        const registrationThreshold = isVip ? 30 * 60 : 20 * 60; // 30 или 20 минут в секундах

        if (secondsRemaining <= registrationThreshold) {
            showAlert('Реєстрація на бліц відкрита! Натисніть на картку, щоб приєднатися.');
            setNotificationShown(true); // Устанавливаем флаг, чтобы не показывать снова
        }
    }, [secondsRemaining, user, notificationShown, isBlitzActive]);


    // Эффект для таймера обратного отсчета (без изменений)
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


    // НОВАЯ ФУНКЦИЯ: Обработчик клика для регистрации
    const handleRegisterClick = async () => {
        if (isBlitzActive) {
            showAlert("Матч вже активний! Вхід у розробці.");
            return;
        }
        if (!blitzInfo?.blitz_id || !user?.user_id) {
            showAlert("Не вдалося отримати інформацію про турнір або користувача.");
            return;
        }

        // Проверка времени на фронтенде для быстрого ответа
        const isVip = user.vip_pass_is_active;
        const registrationWindow = isVip ? 30 * 60 : 20 * 60; // 30 или 20 минут в секундах
        if (secondsRemaining > registrationWindow) {
            const minutesLeft = Math.ceil((secondsRemaining - registrationWindow) / 60);
            showAlert(`Реєстрація ще не відкрита. Зачекайте приблизно ${minutesLeft} хв.`);
            return;
        }

        // Если проверка пройдена, отправляем запрос на сервер
        try {
            const response = await fetch(`http://localhost:8123/blitz/${blitzInfo.blitz_id}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.user_id }),
            });
            const result = await response.json();

            // Показываем пользователю сообщение от бэкенда
            showAlert(result.message);

            // Если регистрация успешна, обновляем данные о блице
            if (response.ok && result.ok) {
                fetchBlitzStatus();
                await fetchUser()
            }
        } catch (error) {
            console.error("Registration failed:", error);
            showAlert("Сталася помилка під час реєстрації. Спробуйте пізніше.");
        }
    };


    // Рендеринг компонента
    if (isLoading || (!isBlitzActive && !secondsRemaining)) {
        return null;
    }

    return (
        <CardWrapper className="card-wrapper" onClick={handleRegisterClick}>
            <CardBackground src={Config.IMAGES.football_goal} alt="event background"/>
            <CupIcon className="cup-icon" src={Config.IMAGES.cup} alt="tournament cup"/>

            {isBlitzActive ? (
                <EnterButton>Увійти в матч</EnterButton>
            ) : (
                secondsRemaining > 0 && blitzInfo?.info && (
                    <ContentWrapper>
                        <Title>{blitzInfo.info.title || 'БЛІЦ ТУРНІР'}</Title>
                        <Countdown>ДО СТАРТУ: {formatTime(secondsRemaining)}</Countdown>
                    </ContentWrapper>
                )
            )}
        </CardWrapper>
    );
};

export default EventCard; // Экспорт по умолчанию, если это основной экспорт файла