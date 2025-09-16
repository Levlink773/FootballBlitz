import React from "react";
import styled, { keyframes } from "styled-components";
import Config from "../../config.js";
import BlitzOption from "./TournamentOption.jsx";

const defaultSchedule = [
    { id: 1, title: "Бліц (8)", time: "09:00", cost: "-30" },
    { id: 2, title: "Бліц (16)", time: "12:00", cost: "-30" },
    { id: 3, title: "Бліц (16)", time: "18:00", cost: "-30" },
    { id: 4, title: "Бліц (16)", time: "21:00", cost: "-30" },
    { id: 5, title: "Бліц (8)", time: "00:00", cost: "-30" },
    { id: 6, title: "Бліц (16)", time: "15:00", cost: "-30" },
];

const ITEM_W = 188;
const GAP = 20;

const ScheduleGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: ${GAP}px;
    max-width: ${ITEM_W * 2 + GAP}px;
    margin: 0 auto;
    padding: 20px 0;
`;

// Анимация появления элемента
const fadeInUp = keyframes`
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

// Обёртка для каждого элемента, чтобы применить анимацию с задержкой
const AnimatedItem = styled.div`
    // Применяем анимацию fadeInUp
    animation: ${fadeInUp} 0.5s ease-out forwards;
    // forwards - чтобы элемент остался видимым после анимации
    
    // Начальное состояние (до анимации)
    opacity: 0; 
    
    // Вычисляем задержку для каждой карточки на основе её индекса
    animation-delay: ${props => props.delay * 0.1}s; 
`;


export default function BlitzSchedule({ items = defaultSchedule }) {
    return (
        <ScheduleGrid>
            {items.map((item, index) => (
                // Оборачиваем BlitzOption в анимированный контейнер
                <AnimatedItem key={item.id} delay={index}>
                    <BlitzOption
                        title={item.title}
                        time={item.time}
                        cost={item.cost}
                        trophy={item.id === 6 ? Config.IMAGES.king : Config.IMAGES.trophy}
                        icon={Config.IMAGES.energy}
                    />
                </AnimatedItem>
            ))}
        </ScheduleGrid>
    );
}