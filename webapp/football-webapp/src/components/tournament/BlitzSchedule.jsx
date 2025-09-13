import React from "react";
import styled from "styled-components";
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
    // 1. Указываем, что колонок должно быть ровно 2, и они делят место поровну.
    grid-template-columns: repeat(2, 1fr);
    gap: ${GAP}px;
    
    // 2. Ограничиваем максимальную ширину контейнера для аккуратного вида.
    // (Ширина 2х элементов + отступ между ними)
    max-width: ${ITEM_W * 2 + GAP}px;
    
    // 3. Центрируем сам контейнер на странице.
    margin: 0 auto; 
    padding: 20px 0; // Добавим вертикальные отступы для воздуха
`;

export default function BlitzSchedule({ items = defaultSchedule }) {
    return (
        <ScheduleGrid>
            {items.map((item) => (
                <BlitzOption
                    key={item.id}
                    title={item.title}
                    time={item.time}
                    cost={item.cost}
                    trophy={Config.IMAGES.trophy}
                    icon={Config.IMAGES.energy}
                />
            ))}
        </ScheduleGrid>
    );
}