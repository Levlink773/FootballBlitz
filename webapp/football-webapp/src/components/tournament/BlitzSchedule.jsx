import React from "react";
import styled, { keyframes } from "styled-components";
import Config from "../../config.js";
import BlitzOption from "./TournamentOption.jsx";

const defaultSchedule = [
    { id: 1, title: "Бліц (16) День", time: "09:00, 11:00, 15:00", cost: "-30" },
    { id: 2, title: "Бліц (16) Вечір", time: "16:00, 20:00, 00:00", cost: "-30" },
    { id: 3, title: "Бліц (32) День", time: "12:00, 13:00", cost: "-30" },
    { id: 4, title: "Бліц (32) Вечір", time: "18:00, 19:00, 21:00", cost: "-30" },
    { id: 5, title: "🏆 VIP Бліц (16)", time: "17:00", cost: "-30" },
    { id: 6, title: "🏆 VIP Бліц (8)", time: "10:00, 14:00, 22:00", cost: "-30" },
];

// Видаляємо фіксовані константи, вони більше не потрібні для сітки
// const ITEM_W = 188;
// const GAP = 20;

const ScheduleGrid = styled.div`
    display: grid;
    /* Дві колонки, які ділять простір порівну */
    grid-template-columns: 1fr 1fr; 
    
    /* Стандартний відступ */
    gap: 15px;
    
    /* Ширина сітки - майже весь екран, але не більше 420px */
    width: 96%;
    max-width: 400px;
    
    margin: 0 auto;
    padding: 10px 0;

    /* Адаптація для дуже вузьких екранів (< 360px) */
    @media (max-width: 360px) {
        gap: 8px; /* Зменшуємо дірку між картками */
        width: 98%;
    }
`;

const fadeInUp = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
`;

const AnimatedItem = styled.div`
    animation: ${fadeInUp} 0.5s ease-out forwards;
    opacity: 0; 
    animation-delay: ${props => props.delay * 0.1}s;
    
    /* Гарантуємо, що елемент займає всю ширину колонки */
    width: 100%;
    display: flex;
    justify-content: center;
`;

export default function BlitzSchedule({ items = defaultSchedule }) {
    return (
        <ScheduleGrid>
            {items.map((item, index) => (
                <AnimatedItem key={item.id} delay={index}>
                    <BlitzOption
                        title={item.title}
                        time={item.time}
                        cost={item.cost}
                        trophy={item.id === 6 || item.id === 5 ? Config.IMAGES.king : Config.IMAGES.trophy}
                        icon={Config.IMAGES.energy}
                        backgroundImage={index === items.length - 1 || index === items.length - 2 ? Config.IMAGES.king_vip : Config.IMAGES.blitz_line}
                    />
                </AnimatedItem>
            ))}
        </ScheduleGrid>
    );
}