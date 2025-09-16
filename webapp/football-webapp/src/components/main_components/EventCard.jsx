import React from 'react';
import styled, { keyframes } from 'styled-components';
import Config from "../../config.js";

// --- Keyframes for animations ---

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

// --- Styled Components ---

const CardWrapper = styled.div`
    position: relative;
    width: 329px;
    height: 111px;
    margin: 340px auto; /* Центрируем для примера */
    left: 40px;
    border-radius: 15px;
    overflow: visible; /* Важно для обрезки фонового изображения */
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, #1f1f3a 0%, #2f2f55 100%);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(100, 100, 200, 0.3);
    transition: all 0.3s ease-in-out;
    cursor: pointer;
    transform: translateZ(0); /* Аппаратное ускорение */
    animation: ${fadeIn} 0.6s ease-out forwards;
    
    // Эффект свечения границы
    &::before {
        content: '';
        position: absolute;
        top: -2px; left: -2px; right: -2px; bottom: -2px;
        border-radius: 17px; /* Немного больше, чем у основного элемента */
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
        .cup-icon {
            transform: translateX(-5px) translateY(-5px) rotate(-5deg) scale(1.05);
            filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.7));
        }
        .register-button {
            transform: scale(1.05);
            box-shadow: 0 4px 15px rgba(0, 255, 255, 0.4);
        }
    }

    &:active {
        transform: translateY(-2px) scale(0.99);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
        &::before {
            opacity: 0.3;
        }
        .register-button {
            transform: scale(0.98);
            box-shadow: 0 2px 8px rgba(0, 255, 255, 0.2);
        }
    }
`;

const CardBackground = styled.img`
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 15px;
    opacity: 0.15; /* Мягкое фоновое изображение */
    filter: brightness(0.8);
    pointer-events: none;
    transition: opacity 0.3s ease, filter 0.3s ease;
`;

const CupIcon = styled.img`
    position: absolute;
    width: 94px;
    height: 115px;
    left: 13px; /* Сохраняем изначальное положение */
    top: 345px; /* Сохраняем изначальное положение */
    transform: translateY(calc(345px - 50% - 55.5px)) translateX(calc(13px - 50% + 47px)); /* Корректируем для центровки */

    z-index: 2;
    filter: drop-shadow(3px 3px 8px rgba(0, 0, 0, 0.6));
    transition: transform 0.3s ease-out, filter 0.3s ease;
    
    // Адаптируем позицию относительно родителя CardWrapper
    position: absolute;
    top: 50%;
    left: 10px; // Смещаем влево относительно карточки
    transform: translateY(-50%) translateX(0); /* Центрируем по вертикали, выносим за пределы */
    
    .card-wrapper:hover & {
        transform: translateY(-55%) translateX(-5px) rotate(-5deg) scale(1.05); /* Анимация при наведении на родителя */
        filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.7));
    }
`;


const ContentWrapper = styled.div`
    position: absolute;
    left: 99px; /* Исходное положение */
    top: 360px; /* Исходное положение */
    width: 238px;
    height: 70px; /* Увеличим для вместимости */
    
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    
    // Новая позиция относительно CardWrapper
    left: 120px; 
    top: 20px;
    width: auto;
    height: auto;
    
    text-align: center;
    z-index: 3;
`;

const Title = styled.div`
    color: white;
    font-size: 20px;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.7);
    white-space: nowrap;
    margin-bottom: 5px;
    letter-spacing: 0.5px;
    line-height: 1.2;
`;

const Countdown = styled.div`
    color: #ffda79; /* Золотистый цвет для таймера */
    font-size: 11px;
    font-family: 'Inter', sans-serif;
    font-weight: 800;
    text-shadow: 0 0 5px rgba(255, 215, 0, 0.7); /* Легкое свечение */
    white-space: nowrap;
    letter-spacing: 1px;
    animation: ${pulsate} 2s infinite ease-in-out; /* Пульсирующая анимация */
`;

const RegisterButton = styled.div`
    position: absolute;
    width: 189px;
    height: 33px;
    left: 123px; /* Исходное положение */
    top: 413px; /* Исходное положение */
    
    // Новая позиция относительно CardWrapper
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%); /* Центрируем */

    border-radius: 5px;
    background: linear-gradient(90deg, #6a11cb 0%, #2575fc 100%); /* Яркий градиент */
    box-shadow: 0 2px 10px rgba(0, 255, 255, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 15px;
    transition: all 0.3s ease;
    z-index: 4;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.2);
        transition: left 0.4s ease;
        transform: skewX(-20deg);
    }
    
    &:hover::before {
        left: 100%;
    }
`;

const RegisterButtonLabel = styled.div`
    color: white; /* Изменено на белый для лучшей контрастности */
    font-size: 11px;
    font-family: 'Inter', sans-serif;
    font-weight: 700;
    text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.6);
    letter-spacing: 0.5px;
    text-transform: uppercase;
    white-space: nowrap;
    z-index: 1; /* Поверх свечения */
`;

const RegisterButtonIcon = styled.img`
    width: 9px;
    height: 13px;
    margin-left: 8px;
    filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.4));
    transition: transform 0.3s ease;
    z-index: 1; /* Поверх свечения */

    .register-button:hover & {
        transform: rotate(10deg) scale(1.1); /* Анимация иконки при наведении на кнопку */
    }
`;


export const EventCard = () => {
    return (
        <CardWrapper className="card-wrapper">
            <CardBackground src={Config.IMAGES.football_goal} alt="event background"/>

            {/* Кубок позиционируем относительно CardWrapper */}
            <CupIcon className="cup-icon" src={Config.IMAGES.cup} alt="tournament cup"/>

            <ContentWrapper>
                <Title>БЛІЦ (8) 15:00 2/8</Title>
                <Countdown>ДО СТАРТУ 00:30 ХВ</Countdown>
            </ContentWrapper>

            <RegisterButton className="register-button">
                <RegisterButtonLabel>ЗАРЕЄСТРУВАТИСЬ -20</RegisterButtonLabel>
                <RegisterButtonIcon src={Config.IMAGES.energy} alt="coin"/>
            </RegisterButton>
        </CardWrapper>
    );
};