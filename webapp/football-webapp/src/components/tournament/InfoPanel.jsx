import React from 'react';
import styled, { keyframes } from 'styled-components';
import Config from '../../config.js'; // Убедитесь, что путь верный

// --- Анимации ---

const slideInFromLeft = keyframes`
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

// --- Стилизованные компоненты ---

const InfoContainer = styled.div`
    position: absolute;
    top: 340px;
    left: 50%;
    transform: translateX(-50%);
    width: 85%;
    max-width: 400px; /* Добавим максимальную ширину для больших экранов */
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: -15px; /* Немного увеличим расстояние между блоками */
`;

const InfoIcon = styled.img`
    width: 32px; /* Чуть крупнее для акцента */
    height: 32px;
    flex-shrink: 0;
    filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.7));
    transition: transform 0.3s ease-out, filter 0.4s ease;
`;

const Text = styled.p`
    margin: 0;
    color: #e0e0e0; /* Сделаем базовый цвет чуть мягче */
    font-size: 14px;
    font-weight: 500;
    line-height: 1.5;
    /* Ключевое улучшение - многослойная тень для эффекта свечения */
    text-shadow: 0 1px 2px rgba(0, 0, 0, 1), 0 0 5px rgba(173, 216, 230, 0.5);
    transition: color 0.3s ease, text-shadow 0.3s ease;
`;

const InfoBlock = styled.div`
    display: flex;
    align-items: flex-start;
    gap: -15px;
    padding: -5px;
    border-radius: 8px;
    border-left: 3px solid transparent; /* Основа для анимации */
    transition: transform 0.3s ease, background-color 0.3s ease, border-left-color 0.3s ease;
    cursor: default; /* Курсор по умолчанию, так как это инфо-блок */

    /* Анимация появления */
    opacity: 0;
    animation: ${slideInFromLeft} 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    animation-delay: ${props => props.delay || '0s'}; /* Задержка из пропсов */

    &:hover {
        transform: translateX(10px);
        background-color: rgba(142, 68, 173, 0.1); /* Легкая фиолетовая подложка */
        border-left-color: #9b59b6; /* Яркая неоновая граница */

        ${InfoIcon} {
            transform: scale(1.15) rotate(-8deg);
            filter: drop-shadow(0 0 12px #ffd700); /* Яркое золотое свечение */
        }

        ${Text} {
            color: #ffffff;
            text-shadow: 0 1px 1px rgba(0, 0, 0, 1), 0 0 8px rgba(155, 89, 182, 0.9);
        }
    }
`;

// --- Компонент ---

export const InfoPanel = () => {
    return (
        <InfoContainer>
            {/* Блок с кубком */}
            <InfoBlock delay="0.2s">
                <InfoIcon src={Config.IMAGES.trophy} alt="trophy" />
                <Text>
                    Участь у бліц-турнірах дає енергію, монети та кубки.
                </Text>
            </InfoBlock>

            {/* Блок с короной */}
            <InfoBlock delay="0.4s">
                <InfoIcon src={Config.IMAGES.crown} alt="crown" />
                <Text>
                    Преміум турніри та інші функції для VIP-користувачів.
                </Text>
            </InfoBlock>
        </InfoContainer>
    );
};