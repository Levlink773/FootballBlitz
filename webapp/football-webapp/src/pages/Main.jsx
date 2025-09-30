import React, {useState} from "react";
import styles from '../css_files/Main.module.css';
import {Header} from "../components/Header.jsx";
import {VipBanner} from "../components/main_components/VipBanner.jsx";
import {UserProfile} from "../components/main_components/UserProfile.jsx";
import {DailyTasks} from "../components/main_components/DailyTasks.jsx";
import {StatsPanel} from "../components/main_components/StatsPanel.jsx";
import {NavigationBar} from "../components/NavigationBar.jsx";
import Config from "../config.js";
import EventCard from "../components/main_components/EventCard.jsx";
import useWebSocket from "../../useWebsocket.js";

export const Main = ({initialUserFromServer}) => {
    const [user, setUser] = useState(initialUserFromServer);
    const vip_pass_status = user?.vip_pass_is_active;
    console.log(vip_pass_status);
    return (
        <div className={styles.page}>
            <div className={styles.mainContainer} data-modal-root>
                <img className={styles.backgroundImage} src={Config.IMAGES.background} alt="background"/>

                <Header user={user}/>
                <VipBanner isActive={vip_pass_status}/>
                <UserProfile user={user}/>
                <DailyTasks/>
                <div className={styles.eventCardWrapperEventMain}>
                    <EventCard user={user} onUserUpdate={setUser}/>
                </div>
                <StatsPanel user={user}/>
                <NavigationBar/>
            </div>
        </div>
    );
};