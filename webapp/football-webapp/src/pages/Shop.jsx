import React from 'react';
import {Header} from "../components/Header.jsx";
import Config from "../config.js";
import {NavigationBar} from "../components/NavigationBar.jsx";
import styles from '../css_files/Main.module.css';
import Shop from "../components/shop/Shop.jsx";
import ShopCoins from "../components/shop/ShopCoins.jsx";
import ShopEnergy from "../components/shop/ShopEnergy.jsx";

export default function ShopCard({mockUser}) {
    return (
        <div className={styles.mainContainer}>
            <Header user={mockUser} />
            <img
                src={Config.IMAGES.shop_background}
                alt="background"
                className={styles.backgroundImage}
            />
            {/* Main Shop Content */}
            <ShopCoins /> {/* <-- USE THE COMPONENT HERE */}
            <NavigationBar />
        </div>
    );
}