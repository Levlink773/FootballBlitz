import React from 'react';
import styles from '../../css_files/league/RatingInfo.module.css'; // Нові стилі
import Config from '../../config.js';

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
                <img src={Config.IMAGES.coin} alt="coin" />
            </div>
            <div className={styles.rewardItem}>
                <span className={styles.rewardAmountEnergy}>{reward2}</span>
                <img src={Config.IMAGES.energy} alt="energy" />
            </div>
        </div>
    </div>
);

const SeasonalInfoContent = () => (
    <>
        <p className={styles.introText}>
            Рейтинг формується за результатами Blitz-турнірів:
        </p>
        <div className={styles.pointsSection}>
            <div className={styles.pointItem}>
                <img src={Config.IMAGES.trophy_gold} alt="Gold" />
                <span>1 місце - 3 оч.</span>
            </div>
            <div className={styles.pointItem}>
                <img src={Config.IMAGES.trophy_silver} alt="Silver" />
                <span>2 місце - 2 оч.</span>
            </div>
            <div className={styles.pointItem}>
                <img src={Config.IMAGES.trophy_bronze} alt="Bronze" />
                <span>Півфінал - 1 оч.</span>
            </div>
        </div>
        <p className={styles.resetInfo}>
            Щонеділі о <strong className={styles.highlightText}>23:30</strong> рейтинг обнуляється, а топ-10 отримують нагороди:
        </p>
        <div className={styles.rewardsGrid}>
            {REWARDS_DATA.sort((a, b) => parseInt(a.place) - parseInt(b.place)).map(item => (
                <RewardRow key={item.place} place={item.place} reward1={item.r1} reward2={item.r2} />
            ))}
        </div>
    </>
);

const WinRateInfoContent = () => (
    <>
        <p className={styles.introText}>
            Цей рейтинг сортує гравців за відсотком перемог у всіх зіграних матчах.
        </p>
        <div className={styles.formulaBox}>
            <p>Формула:</p>
            <code>(Перемоги / Всього матчів) * 100%</code>
        </div>
        <p className={styles.resetInfo}>
            Враховуються абсолютно всі гравці, навіть ті, хто ще не зіграв жодного матчу.
        </p>
        <p className={styles.footerText}>
            Цей показник відображає вашу ефективність та майстерність.
        </p>
    </>
);

const RatingInfo = ({ type, onBack }) => {
    const title = type === 'seasonal' ? 'ЯК ПРАЦЮЄ РЕЙТИНГ' : 'РЕЙТИНГ % ПЕРЕМОГ';
    const content = type === 'seasonal' ? <SeasonalInfoContent /> : <WinRateInfoContent />;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>{title}</h1>

            <div className={styles.infoBox}>
                {content}
            </div>

            <div className={styles.backButtonContainer} onClick={onBack}>
                <img src={Config.IMAGES.left_arrow} alt="<" className={styles.arrowIcon} />
                <span className={styles.backText}>Назад</span>
                <img src={Config.IMAGES.right_arrow} alt=">" className={styles.arrowIcon} />
            </div>
        </div>
    );
};

export default RatingInfo;