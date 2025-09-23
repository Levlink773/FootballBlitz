import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import Config from '../../config.js';

// --- Анимации ---
const slideInFromLeft = keyframes`
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
`;
const slideInFromRight = keyframes`
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
`;

// --- Стили ---
const InfoContainer = styled.div`
  position: absolute;
  top: 300px;
  left: 0;
  width: 100%;
  padding: 0 20px;
  box-sizing: border-box;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const InfoIcon = styled.img`
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  filter: drop-shadow(0 0 4px rgba(0,0,0,0.6));
  transition: transform 0.3s ease, filter 0.3s ease;
`;

const Text = styled.p`
  margin: 0;
  color: #e0e0e0;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
  text-shadow: 0 1px 2px rgba(0,0,0,1), 0 0 5px rgba(173,216,230,0.5);
  transition: color 0.3s ease, text-shadow 0.3s ease;

  /* переносы */
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  hyphens: auto;
  flex: 1;
`;

/* InfoBlock: общий стиль + поведение для align="right" */
const InfoBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 8px;
  border-radius: 8px;
  transition: transform 0.3s ease, background-color 0.3s ease, border-color 0.3s ease;
  cursor: default;
  opacity: 0;

  flex: 1 1 155px;
  max-width: 40ch;
  min-width: 120px;

  border-left: 3px solid transparent;
  animation: ${slideInFromLeft} 0.5s cubic-bezier(0.25,0.46,0.45,0.94) forwards;
  animation-delay: ${props => props.delay || '0s'};

  &:hover {
    transform: translateX(5px);
    background-color: rgba(142,68,173,0.1);
    border-left-color: #9b59b6;

    ${InfoIcon} {
      transform: scale(1.1);
      filter: drop-shadow(0 0 10px #ffd700);
    }

    ${Text} {
      color: #ffffff;
      text-shadow: 0 1px 1px rgba(0,0,0,1), 0 0 8px rgba(155,89,182,0.9);
    }
  }

  /* === стили для правого блока ===
     Изменения:
     - НЕ используем row-reverse (порядок в JSX: Icon затем Text),
     - выравниваем содержимое в начало (иконка будет у левого края правого блока),
     - текст внутри блока делаем left-aligned,
     - анимацию ставим slideInFromRight.
  */
  ${({ align }) => align === 'right' && css`
    /* порядок: Icon -> Text (оставляем как в JSX) */
    flex-direction: row;
    justify-content: flex-start;   /* содержимое блока прижато к левой границе блока */
    text-align: left;
    border-left: none;
    border-right: 3px solid transparent;
    animation-name: ${slideInFromRight};

    /* чуть уменьшим правый паддинг и сделаем левый паддинг чуть меньше,
       чтобы иконка оказалась ближе к внутренней границе блока */
    padding-left: 6px;
    padding-right: 10px;

    &:hover {
      transform: translateX(-5px);
      border-right-color: #9b59b6;
      border-left-color: transparent;
    }
  `}

  @media (max-width: 480px) {
    max-width: 30ch;
    min-width: 100px;
  }
`;

// --- Компонент ---
export const InfoPanel = () => {
    return (
        <InfoContainer>
            <InfoBlock delay="0.2s">
                <InfoIcon src={Config.IMAGES.trophy} alt="trophy" />
                <Text>
                    Участь у бліц-турнірах дає енергію, монети та кубки.
                </Text>
            </InfoBlock>

            {/* Правый блок: иконка (корона) будет слева внутри этого блока */}
            <InfoBlock delay="0.2s" align="right">
                <InfoIcon src={Config.IMAGES.crown} alt="crown" />
                <Text>
                    Преміум турніри та інші функції для VIP-користувачів.
                </Text>
            </InfoBlock>
        </InfoContainer>
    );
};
