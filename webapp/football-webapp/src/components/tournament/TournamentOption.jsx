// TournamentOption.jsx
import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import Config from "../../config.js";

// --- Styled Components ---

const OptionWrapper = styled.div`
    width: 188px;
    height: 50px;
    border-radius: 12px;
    overflow: visible;
    position: relative;
    top: -20px;
    left: 5px;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;

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
        pointer-events: none;
    }

    &:hover {
        transform: translateY(-4px) scale(1.05);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
        
        &::before {
            opacity: 1;
        }

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
        transform: translateY(-1px) scale(1.02);
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
    }
`;

const BackgroundImage = styled.img`
    position: absolute;
    left: 0;
    top: 0;
    width: 105%;
    height: 120%;
    opacity: 1;
    pointer-events: none;
    transition: opacity 0.3s ease, transform 0.3s ease;
    z-index: 1;
`;

const TrophyImage = styled.img`
    width: 70px;
    height: 70px;
    left: -25px;
    flex-shrink: 0;
    transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
    position: relative; /* <-- ДОБАВЛЕНО для z-index */
    z-index: 2;       /* <-- ДОБАВЛЕНО */
`;

const ContentContainer = styled.div`
    flex-grow: 1;
    display: flex;
    align-items: center;
    padding: 0 12px 0 8px;
    gap: 12px;
    color: white;
    font-family: 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    position: relative; /* <-- ДОБАВЛЕНО для z-index */
    z-index: 2;       /* <-- ДОБАВЛЕНО */
`;

const TextBlock = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    position: relative;
    left: -20px;
`;

const Text = styled.span`
    font-size: 14px;
    font-weight: 600;
    text-shadow: 1px 1px 3px rgba(0,0,0,0.6);
    transition: text-shadow 0.3s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const TimeText = styled(Text)`
    color: #a9a9d4;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
    position: relative;
    left: -20px;
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

export default function BlitzOption({ title, time, cost, trophy, icon, backgroundImage }) {
    return (
        <OptionWrapper>
            <BackgroundImage className="background-image" src={backgroundImage} alt="card-bg" />
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
    backgroundImage: PropTypes.string, // Add backgroundImage to propTypes
};

BlitzOption.defaultProps = {
    trophy: Config.IMAGES.trophy,
    icon: Config.IMAGES.energy,
    backgroundImage: Config.IMAGES.blitz_line, // Set default to blitz_line
};