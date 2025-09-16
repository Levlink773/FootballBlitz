import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
// Убедитесь, что путь к вашему файлу конфигурации (с изображениями) указан верно
import Config from "../../config.js";

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

export const EventCard = () => {
    // Состояние: активен ли блиц
    const [isBlitzActive, setIsBlitzActive] = useState(false);
    // Состояние: сколько секунд осталось до начала
    const [secondsRemaining, setSecondsRemaining] = useState(null);
    // Состояние: информация о блице (название и т.д.)
    const [blitzInfo, setBlitzInfo] = useState(null);
    // Состояние: идет ли первоначальная загрузка данных
    const [isLoading, setIsLoading] = useState(true);

    // Функция форматирования времени
    const formatTime = (totalSeconds) => {
        if (totalSeconds < 0) totalSeconds = 0;
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    // Функция для запроса статуса с сервера
    const fetchBlitzStatus = useCallback(async () => {
        try {
            // 1. Проверяем активный матч
            const activeResponse = await fetch('http://localhost:8123/blitz/active');
            if (!activeResponse.ok) throw new Error('Failed to fetch active status');
            const activeData = await activeResponse.json();

            if (activeData.active === true) {
                setIsBlitzActive(true);
                setSecondsRemaining(null);
                setBlitzInfo(activeData.info || { title: 'БЛІЦ АКТИВНИЙ' });
                return;
            }

            // 2. Если активного нет, проверяем следующий
            // ВАЖНО: Ваш API должен по этому адресу возвращать объект:
            // { "seconds_remaining": 3600, "info": { "title": "БЛІЦ (8) 15:00 2/8" } }
            setIsBlitzActive(false);
            const nextResponse = await fetch('http://localhost:8123/blitz/next');
            if (!nextResponse.ok) throw new Error('Failed to fetch next blitz');
            const nextData = await nextResponse.json();

            if (nextData && nextData.seconds_remaining > 0) {
                setSecondsRemaining(nextData.seconds_remaining);
                setBlitzInfo(nextData.info);
            } else {
                setSecondsRemaining(null);
                setBlitzInfo(null);
            }
        } catch (error) {
            console.error("Error fetching blitz status:", error);
            setIsBlitzActive(false);
            setSecondsRemaining(null);
            setBlitzInfo(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Эффект для первоначальной загрузки данных
    useEffect(() => {
        fetchBlitzStatus();
    }, [fetchBlitzStatus]);

    // Эффект для таймера обратного отсчета
    useEffect(() => {
        if (isBlitzActive || secondsRemaining === null || secondsRemaining <= 0) {
            return;
        }
        const timerId = setInterval(() => {
            setSecondsRemaining(prev => {
                const newSeconds = prev - 1;
                if (newSeconds < 1) {
                    clearInterval(timerId);
                    setTimeout(fetchBlitzStatus, 1000); // Перезапрашиваем статус, когда таймер закончился
                }
                return newSeconds;
            });
        }, 1000);
        return () => clearInterval(timerId);
    }, [isBlitzActive, secondsRemaining, fetchBlitzStatus]);


    // --- Рендеринг компонента ---

    // Ничего не показываем, пока идет загрузка или если нет блицев
    if (isLoading || (!isBlitzActive && !secondsRemaining)) {
        return null;
    }

    return (
        <CardWrapper className="card-wrapper">
            <CardBackground src={Config.IMAGES.football_goal} alt="event background"/>
            <CupIcon className="cup-icon" src={Config.IMAGES.cup} alt="tournament cup"/>

            {/* Условный рендеринг: показываем либо кнопку, либо таймер */}
            {isBlitzActive ? (
                <EnterButton>Увійти в матч</EnterButton>
            ) : (
                secondsRemaining > 0 && blitzInfo && (
                    <ContentWrapper>
                        <Title>{blitzInfo.title || 'БЛІЦ ТУРНІР'}</Title>
                        <Countdown>ДО СТАРТУ: {formatTime(secondsRemaining)}</Countdown>
                    </ContentWrapper>
                )
            )}
        </CardWrapper>
    );
};

export default EventCard; // Экспорт по умолчанию, если это основной экспорт файла