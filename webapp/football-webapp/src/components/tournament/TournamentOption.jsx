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
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
    cursor: pointer;

    &:hover {
        transform: scale(1.05);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }
`;

const BackgroundImage = styled.img`
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    opacity: 0.1; /* Делаем фоновое изображение менее навязчивым */
    pointer-events: none;
`;

const TrophyImage = styled.img`
    width: 49px;
    height: 50px;
    flex-shrink: 0; /* Чтобы изображение не сжималось */
`;

const ContentContainer = styled.div`
    display: flex;
    align-items: center;
    padding: 0 12px;
    gap: 8px;
    color: white;
    font-family: 'Inter', sans-serif;
`;

const Text = styled.span`
    font-size: 14px;
    font-weight: 600;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
`;

const TimeText = styled(Text)`
    color: #a9a9d4; /* Небольшой цветовой акцент */
    font-size: 13px;
`;

const CostContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto; /* Прижимает блок к правому краю */
    background-color: rgba(0, 0, 0, 0.2);
    padding: 4px 8px;
    border-radius: 16px;
`;

const CostText = styled.span`
    font-size: 12px;
    font-weight: 700;
    color: #ffc107; /* Яркий акцент для стоимости */
`;

const CostIcon = styled.img`
    width: 10px;
    height: 14px;
`;


// --- Component ---

export default function BlitzOption({ title, time, cost, trophy, icon }) {
    return (
        <OptionWrapper>
            <BackgroundImage src={Config.IMAGES.blitz_line} alt="card-bg" />
            <TrophyImage src={trophy} alt="trophy" />
            <ContentContainer>
                <Text>{title}</Text>
                <TimeText>{time}</TimeText>
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