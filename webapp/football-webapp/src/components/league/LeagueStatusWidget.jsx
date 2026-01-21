import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { FaArrowUp, FaArrowDown, FaShieldAlt, FaInfoCircle } from 'react-icons/fa';

// --- STYLES ---

const pulseGreen = keyframes`
  0% { box-shadow: 0 0 5px rgba(0, 255, 136, 0.2); }
  50% { box-shadow: 0 0 20px rgba(0, 255, 136, 0.5); }
  100% { box-shadow: 0 0 5px rgba(0, 255, 136, 0.2); }
`;

const pulseRed = keyframes`
  0% { box-shadow: 0 0 5px rgba(255, 68, 68, 0.2); }
  50% { box-shadow: 0 0 20px rgba(255, 68, 68, 0.5); }
  100% { box-shadow: 0 0 5px rgba(255, 68, 68, 0.2); }
`;

const shimmerGold = keyframes`
  0% { background-position: -100% 0; }
  100% { background-position: 200% 0; }
`;

// Wrapper for the whole block (Explainer + Widget)
const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
`;

const ExplainerRow = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    padding-left: 4px;
`;

const ExplainerIcon = styled(FaInfoCircle)`
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
`;

const ExplainerText = styled.div`
    font-family: 'Inter', sans-serif;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.6);
    font-style: italic;
`;

const WidgetContainer = styled.div`
    width: 100%;
    margin-bottom: 5px; /* Reduced bottom margin since we have a wrapper now */
    padding: 12px 16px;
    border-radius: 14px;
    
    display: flex;
    align-items: center;
    gap: 14px;
    
    /* Basie style - glass */
    background: rgba(20, 20, 30, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    
    /* --- ZONE STYLES --- */

    /* 🟢 PROMOTION */
    ${props => props.zone === 'PROMOTION' && css`
        border: 1px solid #00FF88;
        background: linear-gradient(135deg, rgba(0, 255, 136, 0.2) 0%, rgba(0, 40, 20, 0.8) 100%);
        animation: ${pulseGreen} 2s infinite;
    `}

    /* 🔴 DEMOTION */
    ${props => props.zone === 'DEMOTION' && css`
        border: 1px solid #FF4444;
        background: linear-gradient(135deg, rgba(255, 68, 68, 0.2) 0%, rgba(40, 0, 0, 0.8) 100%);
        animation: ${pulseRed} 2s infinite;
    `}

    /* 🟡 RETENTION (Bright!) */
    ${props => props.zone === 'RETENTION' && css`
        border: 1px solid #FFD700;
        /* Golden shimmer effect */
        background: linear-gradient(90deg, 
            rgba(255, 215, 0, 0.1) 0%, 
            rgba(255, 215, 0, 0.25) 50%, 
            rgba(255, 215, 0, 0.1) 100%);
        background-size: 200% 100%;
        animation: ${shimmerGold} 3s infinite linear;
        box-shadow: 0 0 15px rgba(255, 215, 0, 0.2);
    `}
`;

const IconBox = styled.div`
    width: 42px; 
    height: 42px;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 20px;
    flex-shrink: 0;
    
    /* Bright icons with shadow */
    ${props => props.zone === 'PROMOTION' && css`
        color: #00FF88; 
        background: rgba(0, 255, 136, 0.2);
        box-shadow: 0 0 10px rgba(0, 255, 136, 0.4);
        border: 1px solid rgba(0, 255, 136, 0.5);
    `}
    
    ${props => props.zone === 'DEMOTION' && css`
        color: #FF4444; 
        background: rgba(255, 68, 68, 0.2);
        box-shadow: 0 0 10px rgba(255, 68, 68, 0.4);
        border: 1px solid rgba(255, 68, 68, 0.5);
    `}
    
    ${props => props.zone === 'RETENTION' && css`
        color: #FFD700; 
        background: rgba(255, 215, 0, 0.2);
        box-shadow: 0 0 10px rgba(255, 215, 0, 0.4);
        border: 1px solid rgba(255, 215, 0, 0.5);
    `}
`;

const TextContent = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
`;

const Title = styled.div`
    font-family: 'Exo 2', sans-serif;
    font-weight: 900;
    font-size: 13px; /* Slightly larger */
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
    
    ${props => props.zone === 'PROMOTION' && css`color: #00FF88;`}
    ${props => props.zone === 'DEMOTION' && css`color: #FF4444;`}
    ${props => props.zone === 'RETENTION' && css`color: #FFD700;`}
`;

const Message = styled.div`
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 500;
    color: #fff; /* White text for better contrast */
    line-height: 1.3;
    opacity: 0.9;
`;

const LeagueStatusWidget = ({ userPosition }) => {
    if (!userPosition) return null;

    const { zone, zone_msg } = userPosition;

    let icon = <FaShieldAlt />;
    let title = "ЗОНА СТАБІЛЬНОСТІ";
    let explanation = "Ви в безпеці. Збереження поточної ліги.";

    if (zone === 'PROMOTION') {
        icon = <FaArrowUp />;
        title = "ЗОНА ПІДВИЩЕННЯ";
        explanation = "Ви в топі! Перехід у вищу лігу в кінці сезону.";
    } else if (zone === 'DEMOTION') {
        icon = <FaArrowDown />;
        title = "ЗОНА ВИЛЬОТУ";
        explanation = "Ви внизу рейтингу. Ризик пониження ліги.";
    }

    return (
        <Wrapper>
            <ExplainerRow>
                <ExplainerIcon />
                <ExplainerText>{explanation}</ExplainerText>
            </ExplainerRow>

            <WidgetContainer zone={zone}>
                <IconBox zone={zone}>
                    {icon}
                </IconBox>
                <TextContent>
                    <Title zone={zone}>{title}</Title>
                    <Message>{zone_msg || "Грайте стабільно, щоб утримати позицію."}</Message>
                </TextContent>
            </WidgetContainer>
        </Wrapper>
    );
};

export default LeagueStatusWidget;