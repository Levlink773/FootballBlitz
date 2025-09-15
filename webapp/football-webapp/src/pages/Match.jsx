import React from 'react';
import {Header} from "../components/Header.jsx";
import Config from "../config.js";
import {NavigationBar} from "../components/NavigationBar.jsx";
import styles from '../css_files/Main.module.css';

export default function MatchCard({mockUser}) {
    return (
        <div className={styles.mainContainer}>
            <Header user={mockUser} />
            <img
                src={Config.IMAGES.match_background}
                alt="background"
                className={styles.backgroundImage}
            />
            <PromoCard/>
            <NavigationBar />
        </div>
    );
}
const PromoCard = () => {
    return (
        <div className={styles.promoCardWrapper}>
            <div className={styles.promoCardContainer}>
                {/* Заголовок */}
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, textAlign: "center" }}>
                    МАТЧ
                </h3>

                {/* Картинка футбольных ворот */}
                <img
                    src={Config.IMAGES.goal1}
                    alt="football goal"
                    className={styles.promoGoal}
                />

                {/* Текстовый блок */}
                <div className={styles.promoText}>
                    <p style={{ margin: "6px 0" }}>
                        🔥 Вирішальний момент епізоду вже близько! 🔥
                    </p>
                    <p style={{ margin: "6px 0" }}>
                        Ваша енергія може стати тим самим поштовхом, що змінить усе — підтримайте свою команду!
                    </p>
                    <p style={{ margin: "6px 0", fontWeight: 700 }}>
                        ⭐ Досягніть 200 енергії у цьому епізоді — і отримаєте буст +300% до суми донату!
                    </p>
                </div>

                {/* Блок кнопок */}
                <div className={styles.promoButtons}>
                    <button className={styles.promoBtn} aria-label="Підсилити">
                        <span>ПІДСИЛИТИ</span>
                        <img
                            src={Config.IMAGES.energy}
                            alt="Енергія"
                            className={styles.energyIcon}
                        />
                    </button>

                    <button className={styles.promoBtn} aria-label="Купити">
                        <span>КУПИТИ</span>
                        <img
                            src={Config.IMAGES.energy_energy}
                            alt="Енергія"
                            className={styles.energyIcon}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};