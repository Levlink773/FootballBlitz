import React, {useRef} from "react";
import styles from '../css_files/Main.module.css';
import {Header} from "../components/Header.jsx";
import {VipBanner} from "../components/main_components/VipBanner.jsx";
import {UserProfile} from "../components/main_components/UserProfile.jsx";
import {DailyTasks} from "../components/main_components/DailyTasks.jsx";
import {EventCard} from "../components/main_components/EventCard.jsx";
import {StatsPanel} from "../components/main_components/StatsPanel.jsx";
import {NavigationBar} from "../components/NavigationBar.jsx";
import Config from "../config.js";
import {
    AlertModal,
    BuyEnergyModal, BuyModal,
    ModalRoot,
    OutOfEnergyModal,
    PlayerModal, SetPriceModal, TopChancesAlert, VipPromoModal,
} from "../components/modal_components/ModalComponents.jsx";
import {VipBannerActive} from "../components/main_components/VipBannerActive.jsx";
// Припустимо, що об'єкт user має таку структуру
const mockUser = {
    name: "Ronaldo",
    avatarUrl: "../assets/avatar.png"
};
const mockPlayer = {
    name: "Іван Занько",
    position: "Нападник",
    age: 32,
    power: 63,
    talent: 5,
    accuracy: "95%",
    seller: "@jei",
    image: Config.IMAGES.avatar_uk,
};
const mockTeams = [
    {name: "Real Madrid", meta: "Leonard", chance: 52},
    {name: "Spartak", meta: "Leonard", chance: 48},
];

export const Main = () => {
    return (
        <div className={styles.mainContainer} data-modal-root>
            <img className={styles.backgroundImage} src={Config.IMAGES.background} alt="background"/>

            <Header user={mockUser}/>
            <VipBanner isActive={true}/>
            <UserProfile user={mockUser}/>
            <ModalRoot variant='alert' backdrop={false}>
                <TopChancesAlert teams={mockTeams}
                            html={true}
                            width={340}
                            height={120}
                />
            </ModalRoot>
            <DailyTasks/>
            <div className={styles.eventCardWrapperEventMain}>
                <EventCard />
            </div>
            <StatsPanel/>
            <NavigationBar/>
        </div>
    );
};