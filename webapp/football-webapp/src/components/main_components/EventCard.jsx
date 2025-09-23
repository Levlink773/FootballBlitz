import React, { useState, useEffect, useCallback } from 'react';
// --- ШАГ 1: Импортируем useNavigate ---
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
// Убедитесь, что путь к вашему файлу конфигурации (с изображениями) указан верно
import Config from "../../config.js";
import {showAlert} from "../../alertService.jsx";
import useWebSocket, {useWebSocketPro} from "../../../useWebsocket.js";
import {API_BASE_URL} from "../../api.js";
import buttonBg from '../../assets/public/vip_emblem_large.png';
// --- Анимации и стили (без изменений) ---

const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
`;

// Удаляем pulsate, так как в новом дизайне его нет
// const pulsate = keyframes...

const CardWrapper = styled.div`
    position: relative;
    width: 320px; // Увеличиваем ширину
    height: 120px; // Увеличиваем высоту
    top: 320px;
    left: 67px;
    margin: 20px auto; // Убираем абсолютное позиционирование для гибкости
    border-radius: 16px;
    overflow: visible; // Оставляем, чтобы кубок мог выходить за рамки
    display: flex;
    justify-content: center;
    align-items: center;
    // Новый фон, как в дизайне
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
    // Удаляем псевдоэлемент ::before для свечения
`;

const CardBackground = styled.img`
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 15px;
    opacity: 1; // Делаем фон менее заметным
    filter: brightness(1);
    pointer-events: none;
`;

const CupIcon = styled.img`
    position: absolute;
    width: 105px; // Немного увеличиваем
    height: auto;
    left: -45px; // Подвигаем ближе к краю
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    filter: drop-shadow(5px 5px 10px rgba(0, 0, 0, 0.5));
    transition: transform 0.3s ease-out;

    ${CardWrapper}:hover & { // Более простой hover-эффект
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
    padding-left: 95px; // Увеличиваем отступ слева из-за кубка
    height: 100%;
    gap: 8px; // Добавляем отступ между элементами
    position: relative;
    left: -50px;
`;

const Title = styled.div`
    color: white;
    font-size: 18px; // Немного уменьшаем для нового формата
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.8);
    // Для лучшего отображения составного заголовка
    display: flex;
    align-items: baseline;
    gap: 8px;

    span {
      font-weight: 500;
      font-size: 16px;
      color: #ccc;
    }
`;

// Новый контейнер для таймера
const CountdownWrapper = styled.div`
    background-color: rgba(0, 0, 0, 0.04);
    border-radius: 20px;
    padding: 4px 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

const CountdownText = styled.div`
    color: #FFC93E; // Золотой цвет
    font-size: 9px;
    position: relative;
    top: 8px;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    text-shadow: 0 0 5px rgba(255, 201, 62, 0.5);
    letter-spacing: 0.5px;
`;

// Полностью переработанная кнопка
const RegistrationButton = styled.button`
    width: 230px;
    height: 44px;
    border-radius: 12px;
    // Яркий желто-оранжевый градиент
    background: url(${buttonBg}) no-repeat center center;
    box-shadow: 0 4px 10px rgba(248, 165, 39, 0.3);
    border: none;
    // Добавляем "давленную" рамку для 3D эффекта
    border-bottom: 3px solid #C47D0F;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #4D3300; // Темный текст для контраста
    font-size: 14px;
    font-family: 'Inter', sans-serif;
    font-weight: 800;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s ease;
    gap: 12px; // Расстояние между текстом и стоимостью

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
    color: white; // Белый цвет для стоимости
    font-weight: 700;
    font-size: 12px;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.4);
`;

const CurrencyIcon = styled.img`
    width: 18px;
    height: 18px;
`;

// Компонент для статуса регистрации, как в старом коде, но можно обновить
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

// Сообщение для незарегистрированных пользователей
const NotRegisteredMessage = styled.div`
  /* базовое количество символов (подберите под ваш дизайн) */
  --max-chars-base: 20;        /* change this if you want another "base" length */
  --max-chars: calc(var(--max-chars-base) * 2); /* в два раза больше символов */

  color: #f1c40f;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  text-align: center;
  line-height: 1.4;
  padding: 0 10px 0 80px;
  z-index: 3;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.7);

  /* поведение переноса */
  white-space: normal;            /* разрешаем переносы */
  overflow-wrap: anywhere;        /* более агрессивный перенос слов при необходимости */
  word-break: break-word;         /* запасная опция для кросс-браузерности */

  /* ограничиваем ширину в символах (приблизительно) */
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

    // --- ШАГ 2: Инициализируем хук навигации ---
    const navigate = useNavigate();

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
        console.log("fetch blitzStatus: ", user.user_id);

        setNotificationShown(false);
        try {
            const activeResponse = await fetch(`${API_BASE_URL}/blitz/active`);
            if (!activeResponse.ok) throw new Error('Failed to fetch active status');
            const activeData = await activeResponse.json();

            if (activeData.active === true) {
                setIsBlitzActive(true);
                setSecondsRemaining(null);
                setBlitzInfo({ info: { title: 'БЛІЦ АКТИВНИЙ' } });

                // Даже если блиц активен, нам нужно знать, зарегистрирован ли в нем юзер,
                // чтобы показать правильную кнопку/сообщение
                try {
                    const regResponse = await fetch(`${API_BASE_URL}/blitz/user/${user.user_id}/match_state`);
                    if (regResponse.ok) {
                        const regData = await regResponse.json();
                        setIsRegistered(true);
                    } else {
                        setIsRegistered(false);
                    }
                } catch (e) {
                    setIsRegistered(false);
                }
                return;
            }

            // Если активного нет, ищем следующий
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
                    console.error("Failed to fetch registration status", e);
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
    // --- ШАГ 2: Создаем универсальный обработчик для WebSocket ---
    const handleWebSocketMessage = useCallback((data) => {
        console.log("Получено WebSocket сообщение в компоненте:", data);

        // Используем switch для обработки разных типов событий
        switch (data.type) {
            case 'show_alert':
                // Сохраняем старую логику для алертов
                if (data.payload) {
                    showAlert(data.payload.message, { html: data.payload.html });
                    // Также можно вызвать fetchBlitzStatus, если это необходимо
                    fetchBlitzStatus();
                }
                break;

            case 'update_max_participants':
                // НОВОЕ: Обрабатываем обновление максимального количества участников
                if (data.payload && typeof data.payload.max_participants === 'number') {
                    console.log(`Обновляем participants_count на: ${data.payload.max_participants}`);

                    // Обновляем состояние blitzInfo, сохраняя остальные данные
                    setBlitzInfo(prevBlitzInfo => {
                        // Проверка, что prevBlitzInfo и prevBlitzInfo.info существуют
                        if (!prevBlitzInfo?.info) return prevBlitzInfo;

                        return {
                            ...prevBlitzInfo,
                            info: {
                                ...prevBlitzInfo.info,
                                participants_count: data.payload.max_participants
                            }
                        };
                    });
                }
                break;

            default:
                // Можно логировать неизвестные типы сообщений для отладки
                console.warn(`Получен неизвестный тип WebSocket сообщения: ${data.type}`);
        }
    }, [fetchBlitzStatus]); // Добавляем fetchBlitzStatus в зависимости
    useWebSocketPro(user.user_id, handleWebSocketMessage);
    useEffect(() => {
        fetchBlitzStatus();
    }, [fetchBlitzStatus]);

    useEffect(() => {
        if (isLoading || !user || notificationShown || secondsRemaining === null || isBlitzActive || isRegistered) {
            return;
        }

        const isVip = user.vip_pass_is_active;
        const registrationThreshold = isVip ? 30 * 60 : 20 * 60;

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


    // --- ШАГ 3: Обновляем логику обработчика клика ---
    const handleRegisterClick = async () => {
        // Если блиц активен, основное действие - вход в матч (если зарегистрирован)
        if (isBlitzActive) {
            if (isRegistered) {
                navigate('/match'); // <-- Перенаправление на страницу матча
            } else {
                showAlert("Ви не зареєстровані на цей бліц. Дочекайтесь наступного.");
            }
            return; // Прекращаем выполнение функции
        }

        // Если блиц еще не начался, работает логика регистрации
        if (isRegistered) {
            showAlert("Ви вже зареєстровані на цей бліц.");
            return;
        }

        if (!blitzInfo?.blitz_id || !user?.user_id) {
            showAlert("Не вдалося отримати інформацію про турнір або користувача.");
            return;
        }

        const isVip = user.vip_pass_is_active;
        const registrationWindow = isVip ? 30 * 60 : 20 * 60;
        if (secondsRemaining > registrationWindow) {
            const minutesLeft = Math.ceil((secondsRemaining - registrationWindow) / 60);
            showAlert(`Реєстрація ще не відкрита. Зачекайте приблизно ${minutesLeft} хв.`);
            return;
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
    console.log("pl reg: ", playersRegistered);
    const maxPlayers = blitzInfo?.info?.max_participants || 16;
    const registrationCost = blitzInfo?.info?.cost || 30;

    return (
        // Используем onClick на всей карточке, но кнопку делаем <button> для семантики
        <CardWrapper onClick={handleRegisterClick}>
            <CardBackground src={Config.IMAGES.football_goal} alt="event background"/>
            <CupIcon src={Config.IMAGES.cup} alt="tournament cup"/>

            {isBlitzActive ? (
                <ContentWrapper> {/* <-- ДОДАНО ОБГОРТКУ */}
                    {isRegistered ? (
                        <RegistrationButton>
                            Увійти в матч
                        </RegistrationButton>
                    ) : (
                        <NotRegisteredMessage>
                            Ви не зареєстровані. <br/>
                            Чекайте на наступний.
                        </NotRegisteredMessage>
                    )}
                </ContentWrapper>
            ) : (
                // Логика для предстоящего блица
                secondsRemaining > 0 && blitzInfo?.info && (
                    <ContentWrapper>
                        <Title>
                            БЛІЦ ({maxPlayers}) <span>{blitzTime} {playersRegistered}/{maxPlayers}</span>
                        </Title>

                        <CountdownWrapper>
                            <CountdownText>
                                ДО СТАРТУ {formatTime(secondsRemaining)}
                            </CountdownText>
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
    );
};

export default EventCard;