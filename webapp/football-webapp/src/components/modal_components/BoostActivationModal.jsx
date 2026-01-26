import React, {useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {FaBolt, FaClock, FaCheckCircle, FaTrophy, FaDumbbell, FaUsers} from 'react-icons/fa';
import Config from '../../config.js';
import {Box, ModalRoot} from './ModalComponents.jsx'; // Імпортуємо ваш компонент Box

export const BoostActivationModal = ({boost, onClose, onActivate, hasActiveBoost}) => {
    const [isSuccess, setIsSuccess] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleActivate = async () => {
        setIsProcessing(true);
        await onActivate(boost);
        setIsProcessing(false);
        setIsSuccess(true);

        // Автозакриття через 2 сек
        setTimeout(() => {
            onClose();
        }, 2000);
    };

    const getBoostIcon = (type) => {
        if (type.includes('TRAINING')) return <FaDumbbell size={32} color="#FFD700"/>;
        if (type.includes('TEAM')) return <FaUsers size={32} color="#00F2FF"/>;
        if (type.includes('STRENGTH')) return <FaBolt size={32} color="#FF4444"/>;
        return <FaTrophy size={32} color="#FFD700"/>;
    };

    // Якщо у вас є картинки в Config, використовуйте їх. Якщо ні - іконки вище.
    // Тут приклад з картинками, як у вас було:
    const getBoostImage = (type) => {
        if (type.includes('TRAINING')) return Config.IMAGES.boost_training;
        if (type.includes('TEAM')) return Config.IMAGES.boost_team;
        if (type.includes('STRENGTH')) return Config.IMAGES.boost_strength;
        return Config.IMAGES.trophy;
    };

    const getDescription = (type) => {
        if (type.includes('TRAINING')) return "Збільшує ефективність тренувань";
        if (type.includes('TEAM')) return "Збільшує силу команди в матчах";
        if (type.includes('STRENGTH')) return "Прискорює прокачку сили";
        return "Покращує характеристики";
    };

    const contentStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '20px 10px',
        color: '#fff'
    };

    const imageContainerStyle = {
        position: 'relative',
        margin: '20px 0',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100px',
        height: '100px',
    };

    const glowStyle = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '120px',
        height: '120px',
        background: 'radial-gradient(circle, rgba(0,255,136,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 0
    };

    const titleStyle = {
        fontSize: '20px',
        fontWeight: '800',
        textTransform: 'uppercase',
        marginBottom: '10px',
        letterSpacing: '1px',
        background: 'linear-gradient(90deg, #fff, #aaa)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
    };

    const statStyle = {
        fontSize: '32px',
        fontWeight: '900',
        color: '#00ff88',
        marginBottom: '5px',
        textShadow: '0 0 15px rgba(0, 255, 136, 0.4)'
    };

    const descStyle = {
        fontSize: '14px',
        color: 'rgba(255, 255, 255, 0.6)',
        marginBottom: '25px',
        fontFamily: "'Inter', sans-serif"
    };

    const buttonStyle = {
        width: '100%',
        padding: '16px',
        borderRadius: '12px',
        // Якщо є активний буст - сірий колір, інакше зелений градієнт
        background: hasActiveBoost ? '#555' : 'linear-gradient(90deg, #00C853, #64DD17)',
        color: hasActiveBoost ? '#aaa' : '#fff',
        border: 'none',
        fontWeight: '800',
        fontSize: '16px',
        cursor: hasActiveBoost ? 'not-allowed' : 'pointer', // Курсор заборони
        boxShadow: hasActiveBoost ? 'none' : '0 8px 20px rgba(0, 200, 83, 0.3)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        transition: 'transform 0.1s ease',
        marginTop: '10px'
    };

    return (
            <Box onClose={onClose} style={{border: '1px solid rgba(255,255,255,0.1)'}}>
                <AnimatePresence mode="wait">
                    {!isSuccess ? (
                        <motion.div
                            key="info"
                            initial={{opacity: 0, y: 10}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -10}}
                            style={contentStyle}
                        >
                            <div style={titleStyle}>Активація Буста</div>

                            <div style={imageContainerStyle}>
                                <div style={glowStyle}/>
                                <img
                                    src={getBoostImage(boost.boostType)}
                                    alt="Boost"
                                    style={{
                                        width: '80px',
                                        height: 'auto',
                                        position: 'relative',
                                        zIndex: 1,
                                        filter: 'drop-shadow(0 0 15px rgba(0,0,0,0.5))'
                                    }}
                                />
                            </div>

                            <div style={statStyle}>
                                +{boost.percent}%
                            </div>
                            <div style={descStyle}>
                                {getDescription(boost.boostType)}
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'rgba(255,255,255,0.05)',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                marginBottom: '20px',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <FaClock color="#FFD700"/>
                                <span style={{color: '#fff', fontWeight: '600', fontSize: '14px'}}>
                                {boost.duration} год.
                            </span>
                            </div>
                            {/* Якщо є активний буст, показуємо попередження */}
                            {hasActiveBoost && (
                                <div style={{color: '#FF4444', fontSize: '12px', marginBottom: '10px', fontWeight: 'bold'}}>
                                    ⚠️ У вас вже діє активний ефект.
                                </div>
                            )}

                            <motion.button
                                onClick={() => !hasActiveBoost && handleActivate()} // Блокуємо клік
                                style={buttonStyle}
                                whileTap={hasActiveBoost ? {} : { scale: 0.96 }}
                                disabled={isProcessing || hasActiveBoost} // Disable атрибут
                            >
                                {hasActiveBoost
                                    ? "БУСТ ВЖЕ АКТИВНИЙ"
                                    : (isProcessing ? "Активація..." : "АКТИВУВАТИ")
                                }
                            </motion.button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{scale: 0.8, opacity: 0}}
                            animate={{scale: 1, opacity: 1}}
                            style={{...contentStyle, padding: '40px 20px'}}
                        >
                            <motion.div
                                initial={{scale: 0}}
                                animate={{scale: 1.2}}
                                transition={{type: "spring", stiffness: 200, damping: 10}}
                                style={{marginBottom: '20px'}}
                            >
                                <FaCheckCircle size={80} color="#00ff88"
                                               style={{filter: 'drop-shadow(0 0 20px rgba(0,255,136,0.5))'}}/>
                            </motion.div>
                            <h2 style={{color: '#fff', margin: '0 0 10px 0', fontSize: '24px'}}>Успішно!</h2>
                            <p style={{color: 'rgba(255,255,255,0.6)', margin: 0}}>Ефект вже діє на вашу команду.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Box>
    );
};