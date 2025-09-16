import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import Config from "../../config.js";

// --- Styled Components ---

const OptionWrapper = styled.div`
    width: 188px;
    height: 50px;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    display: flex;
    align-items: center;
    background: linear-gradient(90deg, #3a3a5a 0%, #2a2a40 100%);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
    cursor: pointer;
    // Плавный переход для всех анимируемых свойств
    transition: transform 0.3s ease, box-shadow 0.3s ease;

    // Псевдо-элемент для создания эффекта свечения при наведении
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 12px;
        border: 2px solid transparent;
        background: linear-gradient(120deg, #8e44ad, #3498db, #e74c3c) border-box;
        -webkit-mask:
            linear-gradient(#fff 0 0) padding-box,
            linear-gradient(#fff 0 0);
        -webkit-mask-composite: destination-out;
        mask-composite: exclude;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none; // Чтобы не мешал кликам
    }

    &:hover {
        transform: translateY(-4px) scale(1.05); // Эффект "приподнимания"
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
        
        // Показываем свечение при наведении
        &::before {
            opacity: 1;
        }

        // Анимируем дочерние элементы при наведении
        .trophy-image {
            transform: rotate(-5deg) scale(1.1);
        }
        .main-title {
             text-shadow: 0 0 8px rgba(255, 255, 255, 0.7);
        }
        .background-image {
            opacity: 0.15;
            transform: scale(1.1);
        }
    }
    
    &:active {
        // Эффект нажатия
        transform: translateY(-1px) scale(1.02);
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
    }
`;

const BackgroundImage = styled.img`
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    opacity: 0.1;
    pointer-events: none;
    transition: opacity 0.3s ease, transform 0.3s ease;
`;

const TrophyImage = styled.img`
    width: 49px;
    height: 50px;
    flex-shrink: 0;
    transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1); // Добавляем плавный переход
`;

const ContentContainer = styled.div`
    flex-grow: 1; // Занимает всё оставшееся место
    display: flex;
    align-items: center;
    padding: 0 12px 0 8px;
    gap: 8px;
    color: white;
    font-family: 'Inter', sans-serif;
    // Улучшаем рендеринг шрифтов
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
`;

const TextBlock = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
`;

const Text = styled.span`
    font-size: 14px;
    font-weight: 600;
    text-shadow: 1px 1px 3px rgba(0,0,0,0.6);
    transition: text-shadow 0.3s ease;
`;

const TimeText = styled(Text)`
    color: #a9a9d4;
    font-size: 13px;
    font-weight: 500;
`;

const CostContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
    background-color: rgba(0, 0, 0, 0.3);
    padding: 4px 8px;
    border-radius: 16px;
    transition: background-color 0.3s ease;
`;

const CostText = styled.span`
    font-size: 12px;
    font-weight: 700;
    color: #ffc107;
`;

const CostIcon = styled.img`
    width: 10px;
    height: 14px;
`;


// --- Component ---

export default function BlitzOption({ title, time, cost, trophy, icon }) {
    return (
        <OptionWrapper>
            <BackgroundImage className="background-image" src={Config.IMAGES.blitz_line} alt="card-bg" />
            <TrophyImage className="trophy-image" src={trophy} alt="trophy" />
            <ContentContainer>
                <TextBlock>
                    <Text className="main-title">{title}</Text>
                    <TimeText>{time}</TimeText>
                </TextBlock>
                <CostContainer>
                    <CostText>{cost}</CostText>
                    <CostIcon src={icon} alt="icon" />
                </CostContainer>
            </ContentContainer>
        </OptionWrapper>
    );
}

BlitzOption.propTypes = {
    title: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired,
    cost: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    trophy: PropTypes.string,
    icon: PropTypes.string,
};

BlitzOption.defaultProps = {
    trophy: Config.IMAGES.trophy,
    icon: Config.IMAGES.energy,
};