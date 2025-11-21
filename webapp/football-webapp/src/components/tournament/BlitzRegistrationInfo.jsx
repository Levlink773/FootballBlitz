import React from "react";
import styled from "styled-components";

const InfoWrapper = styled.div`
  /* 🔥 АДАПТАЦИЯ: Убираем жесткие привязки (top, left) */
  position: relative;
  width: 100%;
  max-width: 360px; /* Ограничиваем ширину для красоты */
  margin: 10px auto 0; /* Центрируем и даем отступ сверху */
  
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.25); /* Чуть темнее для читаемости */
  color: white;
  font-family: 'Inter', sans-serif;
  font-size: 14px; /* Базовый размер чуть меньше */
  line-height: 1.4;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
  box-sizing: border-box; /* Чтобы padding не раздувал ширину */

  /* Адаптация для маленьких экранов */
  @media (max-width: 360px) {
    font-size: 12px;
    padding: 8px 10px;
    margin-top: 8px;
  }
`;

const Title = styled.div`
  font-weight: 700;
  margin-bottom: 4px; /* Небольшой отступ от заголовка */
  font-size: 1.1em; /* Относительный размер */
  color: #FFD700; /* Золотистый цвет для акцента */
`;

const List = styled.ul`
  margin: 0;
  padding-left: 20px; /* Стандартный отступ для списка */
`;

const ListItem = styled.li`
  margin-bottom: 2px;
  font-weight: 500;
  
  /* Красивые маркеры */
  &::marker {
    color: #FFD700;
  }
`;

export default function BlitzRegistrationInfo() {
    return (
        <InfoWrapper>
            <Title>📜 Реєстрація відкривається:</Title>
            <List>
                <ListItem>за 30 хв до VIP-турніру</ListItem>
                <ListItem>за 20 хв до звичайних турнірів</ListItem>
            </List>
        </InfoWrapper>
    );
}