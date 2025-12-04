import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import Config from "../../config.js";

// --- Styled Components ---

const OptionWrapper = styled.div`
    /* 🔥 АДАПТАЦІЯ: Ширина тепер 100% від колонки сітки, а не фіксовані 188px */
    width: 100%;
    height: 50px;
    border-radius: 12px;
    position: relative;
    
    /* Прибираємо жорсткі зсуви, які ламають сітку */
    /* top: -20px; left: 5px; -> Видалено */
    
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    overflow: visible; /* Дозволяємо трофею вилазити */

    /* Градієнтна рамка */
    &::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        border-radius: 12px;
        border: 2px solid transparent;
        background: linear-gradient(120deg, #8e44ad, #3498db, #e74c3c) border-box;
        -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: destination-out;
        mask-composite: exclude;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
    }

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
        &::before { opacity: 1; }
        .trophy-image { transform: rotate(-5deg) scale(1.1); }
        .background-image { opacity: 0.15; transform: scale(1.1); }
    }
    
    &:active {
        transform: translateY(-1px);
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
    }

    /* 🔥 Адаптація висоти для зовсім малих екранів */
    @media (max-width: 360px) {
        height: 45px;
    }
`;

const BackgroundImage = styled.img`
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    object-fit: cover; /* Щоб картинка не розтягувалась неприродно */
    border-radius: 12px;
    opacity: 1;
    pointer-events: none;
    transition: opacity 0.3s ease, transform 0.3s ease;
    z-index: 1;
`;

const TrophyImage = styled.img`
    /* 🔥 АДАПТАЦІЯ: Трофей трохи менший на мобільному */
    width: 60px;
    height: 60px;
    
    position: relative;
    left: -10px; /* Трохи вилазить вліво */
    z-index: 3;
    flex-shrink: 0;
    transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);

    @media (max-width: 360px) {
        width: 50px;
        height: 50px;
        left: -5px;
    }
`;

const ContentContainer = styled.div`
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: space-between; /* Розсовує текст і ціну по краях */
    
    position: relative;
    z-index: 2;
    
    /* Відступи всередині картки */
    padding-right: 8px; 
    /* Зліва відступ менший, бо там трофей */
    margin-left: -15px; 

    @media (max-width: 360px) {
        margin-left: -10px;
        padding-right: 5px;
    }
`;

const TextBlock = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    /* Обмеження ширини, щоб текст не наліз на ціну */
    max-width: 80px; 
    
    @media (max-width: 340px) {
        max-width: 60px;
    }
`;

const Text = styled.span`
    font-size: 13px;
    font-weight: 700;
    color: white;
    text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
    white-space: nowrap;
    
    @media (max-width: 360px) {
        font-size: 11px;
    }
`;

const TimeText = styled(Text)`
    color: #a9a9d4;
    font-size: 10px;
    
    font-weight: 500;
    margin-top: 2px;
    
    @media (max-width: 360px) {
        font-size: 9px;
    }
`;

const CostContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 3px;
    
    background-color: rgba(0, 0, 0, 0.4);
    padding: 3px 6px;
    border-radius: 8px;
    
    /* Гарантуємо, що ціна не стиснеться */
    flex-shrink: 0; 
`;

const CostText = styled.span`
    font-size: 11px;
    font-weight: 700;
    color: #ffc107;
    
    @media (max-width: 360px) {
        font-size: 10px;
    }
`;

const CostIcon = styled.img`
    width: 10px;
    height: 14px;
    
    @media (max-width: 360px) {
        width: 8px;
        height: 11px;
    }
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
    backgroundImage: PropTypes.string,
};

BlitzOption.defaultProps = {
    trophy: Config.IMAGES.trophy,
    icon: Config.IMAGES.energy,
    backgroundImage: Config.IMAGES.blitz_line,
};