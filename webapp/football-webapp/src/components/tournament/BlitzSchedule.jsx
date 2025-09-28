import React from "react";
import styled, { keyframes } from "styled-components";
import Config from "../../config.js";
import BlitzOption from "./TournamentOption.jsx";

const defaultSchedule = [
    { id: 1, title: "Бліц (8)", time: "09:00 & 11:00", cost: "-30" },
    { id: 2, title: "Бліц (8)", time: "12:00 & 13:00", cost: "-30" },
    { id: 3, title: "Бліц (8)", time: "15:00 & 16:00", cost: "-30" },
    { id: 4, title: "Бліц (8)", time: "18:00 & 19:00", cost: "-30" },
    { id: 5, title: "Бліц (8)", time: "20:00 & 21:00", cost: "-30" },
    { id: 6, title: "Бліц (8)", time: "22:00 & 00:00", cost: "-30" },
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

const AnimatedItem = styled.div`
    animation: ${fadeInUp} 0.5s ease-out forwards;
    opacity: 0; 
    animation-delay: ${props => props.delay * 0.1}s; 
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
                        trophy={item.id === 6 ? Config.IMAGES.king : Config.IMAGES.trophy}
                        icon={Config.IMAGES.energy}
                        // Conditionally set backgroundImage for the last item
                        backgroundImage={index === items.length - 1 ? Config.IMAGES.king_vip : Config.IMAGES.blitz_line}
                    />
                </AnimatedItem>
            ))}
        </ScheduleGrid>
    );
}