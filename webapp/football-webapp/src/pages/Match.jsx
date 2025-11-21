import React, {useState, useEffect, useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {motion, AnimatePresence} from 'framer-motion';
import {Header} from "../components/Header.jsx";
import Config from "../config.js";
import {NavigationBar} from "../components/NavigationBar.jsx";
import {ModalRoot, DonateEnergyModal, OutOfEnergyModal} from '../components/modal_components/ModalComponents.jsx';
import styles from '../css_files/Main.module.css';
import {showAlert, showTopChanceAlert} from "../alertService.jsx";
import {api, API_BASE_URL} from "../api.js";
import {useWebSocketPro} from "../../useWebsocket.js";
import DOMPurify from 'dompurify';

// --- НОВЫЙ КОМПОНЕНТ SCOREBOARD ---
const Scoreboard = ({matchState}) => {
    // Не рендерим компонент, если данных о командах нет
    if (!matchState?.name_first_team || !matchState?.name_second_team) {
        return null;
    }

    const scoreVariants = {
        initial: {opacity: 0, y: -10},
        animate: {opacity: 1, y: 0},
        exit: {opacity: 0, y: 10},
    };

    return (
        <motion.div
            className={styles.scoreboardContainer}
            initial={{opacity: 0, y: -50}}
            animate={{opacity: 1, y: 0}}
            transition={{type: 'spring', stiffness: 100, damping: 15}}
        >
            <div className={styles.team}>
                <span className={styles.teamName}>{matchState.name_first_team}</span>
            </div>
            <div className={styles.score}>
                <AnimatePresence mode="wait">
                    <motion.span key={`score_a_${matchState.goal_first_team}`} {...scoreVariants}>
                        {matchState.goal_first_team}
                    </motion.span>
                </AnimatePresence>
                <span className={styles.scoreSeparator}>:</span>
                <AnimatePresence mode="wait">
                    <motion.span key={`score_b_${matchState.goal_second_team}`} {...scoreVariants}>
                        {matchState.goal_second_team}
                    </motion.span>
                </AnimatePresence>
            </div>
            <div className={`${styles.team} ${styles.teamRight}`}>
                <span className={styles.teamName}>{matchState.name_second_team}</span>
            </div>
        </motion.div>
    );
};


export default function MatchCard({user, setUser}) {
    const [isLoading, setIsLoading] = useState(false);
    const [activeModal, setActiveModal] = useState(null);

    const [matchState, setMatchState] = useState(undefined);
    const [isMatchStateLoading, setIsMatchStateLoading] = useState(true);

    const navigate = useNavigate();

    const fetchUser = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/users/${user.user_id}`);
            if (!res.ok) return;
            const userData = await res.json();
            if (setUser) setUser(userData);
        } catch (e) {
            console.error("fetchUser error", e);
        }
    };

    const handleWebSocketMessage = useCallback((data) => {
        console.log("Handling WS message in MatchCard:", data);

        switch (data.type) {
            case 'blitz_match_state':
                if (data.payload) {
                    console.log("Updating match state from WebSocket:", data.payload);
                    setMatchState(data.payload);
                }
                break;

            case 'show_alert':
                if (data.payload && data.payload.message) {
                    showAlert(data.payload.message, {html: data.payload.html});
                }
                break;

            case 'show_top_alert':
                if (data.payload) {
                    console.log("Showing top chances alert:", data.payload);
                    showTopChanceAlert(data.payload);
                }
                break;

            case 'remove_user':
                console.log("User removed from match via WebSocket, redirecting...");
                showAlert(data.payload.message)
                navigate('/blitz');
                break;

            default:
                break;
        }
    }, [navigate]);

    useWebSocketPro(user?.user_id, handleWebSocketMessage);

    useEffect(() => {
        const fetchMatchState = async () => {
            if (!user?.user_id) {
                setIsMatchStateLoading(false);
                return;
            }
            setIsMatchStateLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/blitz/user/${user.user_id}/match_state`);
                if (res.ok) {
                    const data = await res.json();
                    setMatchState(data);
                } else if (res.status === 404) {
                    setMatchState(null);
                } else {
                    console.error("Failed to fetch match state:", res.statusText);
                    setMatchState(null);
                }
            } catch (e) {
                console.error("fetchMatchState error", e);
                setMatchState(null);
            } finally {
                setIsMatchStateLoading(false);
            }
        };

        fetchMatchState();
    }, [user?.user_id]);

    useEffect(() => {
        if (!isMatchStateLoading && matchState === null) {
            console.log("Match state is null after check, redirecting to /blitz.");
            navigate('/blitz');
        }
    }, [matchState, isMatchStateLoading, navigate]);


    const handleDonate = async (data) => {
        const energyToDonate = data.energy;
        if (!user || user.energy < energyToDonate) {
            showAlert("У вас недостатньо енергії для такого донату.");
            setActiveModal('buy');
            return;
        }
        setIsLoading(true);
        setActiveModal(null);
        try {
            await api.donateEnergy({
                user_id: user.user_id,
                energy: energyToDonate,
            });
            await fetchUser();
        } catch (error) {
            console.error("Donation failed:", error);
            showAlert(`Помилка: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePurchaseEnergy = async (item) => {
        if (!user || !user.user_id) {
            showAlert("Помилка: користувача не знайдено. Будь ласка, перезавантажте сторінку.");
            return;
        }
        setIsLoading(true);
        setActiveModal(null);
        try {
            const response = await api.createEnergyPayment({userId: user.user_id, pack: item});
            if (response && response.page_url) {
                window.location.href = response.page_url;
            } else {
                throw new Error("Не вдалося отримати посилання на оплату.");
            }
        } catch (error) {
            console.error("Payment failed:", error);
            showAlert(`Помилка під час створення платежу: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isMatchStateLoading && matchState === null) {
        return <div style={{textAlign: 'center', marginTop: '50px'}}>Перенаправлення...</div>;
    }

    return (
        <div className={styles.page}>
            <img className={styles.pageBackgroundBlur} src={Config.IMAGES.match_background} alt="" />
            <div className={styles.mainContainer} data-modal-root>
                {isLoading && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                    }}>
                        <h2>Створення платежу...</h2>
                    </div>
                )}
                <Header user={user}/>

                {/* --- ВСТАВЛЯЕМ ТАБЛО ЗДЕСЬ --- */}
                <Scoreboard matchState={matchState}/>

                <img
                    src={Config.IMAGES.match_background}
                    alt="background"
                    className={styles.backgroundImage}
                />
                <PromoCard
                    onOpenDonate={() => setActiveModal('donate')}
                    onOpenBuy={() => setActiveModal('buy')}
                    matchState={matchState}
                    isMatchStateLoading={isMatchStateLoading}
                />
                <NavigationBar/>
                <AnimatePresence>
                    {activeModal === 'donate' && (
                        <ModalRoot>
                            <DonateEnergyModal onClose={() => setActiveModal(null)} onConfirm={handleDonate}/>
                        </ModalRoot>
                    )}
                    {activeModal === 'buy' && (
                        <ModalRoot>
                            <OutOfEnergyModal onClose={() => setActiveModal(null)} onBuy={handlePurchaseEnergy}/>
                        </ModalRoot>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

const PromoCard = ({onOpenDonate, onOpenBuy, matchState, isMatchStateLoading}) => {
    const cardVariants = {
        hidden: {opacity: 0, y: 50, scale: 0.95},
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {type: 'spring', damping: 20, stiffness: 200, delay: 0.2}
        }
    };

    const renderContent = () => {
        if (isMatchStateLoading) {
            return <p className={styles.promoText}>Завантаження стану матчу...</p>;
        }

        if (!matchState) {
            return (
                <div className={styles.promoText}>
                    <h2 style={{textAlign: 'center', padding: '20px 0'}}>
                        Перевірка участі у турнірі...
                    </h2>
                </div>
            );
        }

        const imageMap = {
            STARTED: Config.IMAGES.goal0,
            PREPARATION_MATCH: Config.IMAGES.goal0,
            END_MATCH: Config.IMAGES.goal0,
            FINISHED: Config.IMAGES.goal0,
            GOAL: Config.IMAGES.goal3,
            NO_GOAL: Config.IMAGES.goal2,
            PING: Config.IMAGES.goal1,
        };

        const imageSrc = imageMap[matchState.state?.toUpperCase()] || Config.IMAGES.goal0;
        const safeHtml = matchState?.message ? DOMPurify.sanitize(matchState.message) : "";

        return (
            <>
                <motion.img
                    src={imageSrc}
                    alt="football goal"
                    className={styles.promoGoal}
                    whileHover={{scale: 1.05}}
                    transition={{type: 'spring', stiffness: 300}}
                />
                <div
                    className={styles.promoText}
                    style={matchState.state === 'ping' ? {fontSize: '10px'} : {}}
                >
                    {safeHtml ? (
                        <div dangerouslySetInnerHTML={{__html: safeHtml}}/>
                    ) : (
                        <p>{/* fallback */}Очікуємо на початок...</p>
                    )}
                </div>
                {matchState.state === 'ping' && (
                    <>
                        <div className={styles.promoButtons}>
                            <motion.button
                                className={`${styles.promoBtn} ${styles.boostBtn}`}
                                onClick={onOpenDonate}
                                whileHover={{scale: 1.05, y: -2, boxShadow: '0 10px 20px rgba(0,0,0,0.3)'}}
                                whileTap={{scale: 0.95}}
                            >
                                <span>ПІДСИЛИТИ</span>
                                <img src={Config.IMAGES.energy} alt="Енергія" className={styles.energyIcon}
                                     style={{width: 28, height: 28}}/>
                            </motion.button>
                            <motion.button
                                className={`${styles.promoBtn} ${styles.buyBtn}`}
                                onClick={onOpenBuy}
                                whileHover={{scale: 1.05, y: -2, boxShadow: '0 10px 20px rgba(0,0,0,0.3)'}}
                                whileTap={{scale: 0.95}}
                            >
                                <span>КУПИТИ</span>
                                <img src={Config.IMAGES.energy_energy} alt="Енергія" className={styles.energyIcon}
                                     style={{width: 18}}/>
                            </motion.button>
                        </div>
                        <div className={styles.promoText}>
                            <p className={styles.promoHighlight}>
                                ⭐ Досягніть 200 енергії у цьому епізоді — і отримаєте буст +300% до суми донату!
                            </p>
                        </div>
                    </>
                )}
            </>
        );
    }

    return (
        <div className={styles.promoCardWrapper}>
            <motion.div
                className={styles.promoCardContainer}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
            >
                <div className={styles.gradientBorder}/>
                <h3 className={styles.promoTitle}>МАТЧ</h3>
                {renderContent()}
            </motion.div>
        </div>
    );
};