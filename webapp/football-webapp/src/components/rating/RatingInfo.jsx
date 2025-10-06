// RatingInfo.jsx

import React from 'react';
import ratingStyles from '../../css_files/rating/Rating.module.css';
import styles from '../../css_files/rating/RatingInfo.module.css';
import Config from '../../config.js';

// Component for seasonal rewards (unchanged)
const REWARDS_DATA = [
        { place: '1 місце', r1: '+600', r2: '+500' }, { place: '6 місце', r1: '+160', r2: '+80' },
        { place: '2 місце', r1: '+500', r2: '+400' }, { place: '7 місце', r1: '+140', r2: '+70' },
        { place: '3 місце', r1: '+400', r2: '+300' }, { place: '8 місце', r1: '+120', r2: '+60' },
        { place: '4 місце', r1: '+300', r2: '+200' }, { place: '9 місце', r1: '+100', r2: '+50' },
        { place: '5 місце', r1: '+200', r2: '+100' }, { place: '10 місце', r1: '+80', r2: '+40' },
];
const RewardRow = ({ place, reward1, reward2 }) => (
    <div className={styles.rewardRow}>
            <span className={styles.rewardPlace}>{place}</span>
            <div className={styles.rewardValues}>
                    <div className={styles.rewardItem}>
                            <span className={styles.rewardAmountCoin}>{reward1}</span>
                            <img src={Config.IMAGES.coin} alt="coin icon" />
                    </div>
                    <div className={styles.rewardItem}>
                            <span className={styles.rewardAmountEnergy}>{reward2}</span>
                            <img src={Config.IMAGES.energy} alt="energy icon" />
                    </div>
            </div>
    </div>
);


// 1. New component to render the content for the Seasonal Rating info page
const SeasonalInfoContent = () => (
    <>
            <p className={styles.introText}>
                    Рейтинг формується за результатами Blitz-турнірів:
            </p>
            <div className={styles.pointsSection}>
                    <div className={styles.pointItem}>
                            <img src={Config.IMAGES.trophy_gold} alt="Gold Trophy" />
                            <span>1 місце - 3 оч.</span>
                    </div>
                    <div className={styles.pointItem}>
                            <img src={Config.IMAGES.trophy_silver} alt="Silver Trophy" />
                            <span>2 місце - 2 оч.</span>
                    </div>
                    <div className={styles.pointItem}>
                            <img src={Config.IMAGES.trophy_bronze} alt="Bronze Trophy" />
                            <span>Півфіналісти - 1 оч.</span>
                    </div>
            </div>
            <p className={styles.resetInfo}>
                    Щонеділі о <strong className={styles.highlightText}>23:30</strong> рейтинг обнуляється, а перші 10 гравців отримують нагороди:
            </p>
            <div className={styles.rewardsGrid}>
                    {REWARDS_DATA.sort((a, b) => parseInt(a.place) - parseInt(b.place)).map(item => (
                        <RewardRow key={item.place} place={item.place} reward1={item.r1} reward2={item.r2} />
                    ))}
            </div>
            <p className={styles.footerText}>
                    Грай активно, щоб піднятися вище у таблиці та здобути цінні нагороди!
            </p>
    </>
);

// 2. New component to render the content for the Win Rate info page
const WinRateInfoContent = () => (
    <>
            <p className={styles.introText}>
                    Цей рейтинг сортує гравців за їхнім відсотком перемог у всіх зіграних матчах.
            </p>
            <div className={styles.formulaBox}>
                    <p>Формула розрахунку:</p>
                    <code>(Кількість перемог / Загальна кількість матчів) * 100%</code>
            </div>
            <p className={styles.resetInfo}>
                    Враховуються абсолютно всі гравці, навіть ті, хто ще не зіграв жодного матчу.
            </p>
            <p className={styles.footerText}>
                    Цей показник відображає вашу ефективність та майстерність у грі.
            </p>
    </>
);

// 3. The main component now accepts a `type` prop to decide what to render
const RatingInfo = ({ type, onBack }) => {
        const title = type === 'seasonal' ? 'ЯК ПРАЦЮЄ РЕЙТИНГ' : 'РЕЙТИНГ ЗА % ПЕРЕМОГ';
        const content = type === 'seasonal' ? <SeasonalInfoContent /> : <WinRateInfoContent />;

        return (
            <div className={ratingStyles.ratingContainer} style={{ top: '30px' }}>
                    <h1 className={styles.title}>{title}</h1>
                    <div className={styles.infoBox}>
                            <div className={styles.scrollableContent}>
                                    {content}
                            </div>
                    </div>
                    <div className={ratingStyles.howToContainer} onClick={onBack}>
                            <img src={Config.IMAGES.left_arrow} alt="Left Arrow" className={ratingStyles.arrowIcon} />
                            <span className={ratingStyles.howToText}>Назад</span>
                            <img src={Config.IMAGES.right_arrow} alt="Right Arrow" className={ratingStyles.arrowIcon} />
                    </div>
            </div>
        );
};

export default RatingInfo;