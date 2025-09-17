import React, {useEffect, useLayoutEffect, useRef, useState} from "react";
import ReactDOM from "react-dom";
import Config from "../../config.js";
import {motion, AnimatePresence} from "framer-motion";
import default_sound from "../../assets/public/sounds/notification.mp3"
import { useSpring, animated } from 'react-spring';
/**
 * ModalRoot — теперь всегда портирует в document.body (чтобы не зависеть от места рендера)
 * и жёстко ограничивает размеры модалки (width/maxWidth/maxHeight + overflowY:auto).
 */

// ✨ --- ГЛОБАЛЬНІ СТИЛІ ТА ТЕМА --- ✨
// Додаємо стилі безпосередньо в компонент для простоти.
// В реальному проекті це краще винести в окремий CSS-файл.
const GlobalStyles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap');

    :root {
      --glow-primary: #1BCAFB;
      --glow-secondary: #AE4CFF;
      --text-primary: #FFFFFF;
      --text-secondary: #A5A5A5;
      --surface-background: rgba(38, 38, 38, 0.75);
      --surface-border: rgba(255, 255, 255, 0.1);
      --surface-highlight: rgba(255, 255, 255, 0.05);
      --shadow-color: rgba(0, 0, 0, 0.5);
      --green-accent: #37C35F;
      --red-accent: #D33434;
      
      --gradient-button: linear-gradient(170deg, #1BCAFB 0%, #1997F8 100%);
      --gradient-button-alt: linear-gradient(170deg, #FBF21B 0%, #F8BA19 100%);
      --gradient-border: linear-gradient(145deg, var(--glow-primary), var(--glow-secondary));
    }
  `}</style>
);

// Шум для фону (додає текстуру)
const noiseURL = "data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E";


export function ModalRoot({
                              children,
                              onClose,
                              backdrop = true,
                              variant = "center",
                              attachTo = null,
                              className = "",
                              style = {},
                              animation = true,
                              soundOnOpen = default_sound,
                          }) {
    useEffect(() => {
        if (soundOnOpen) {
            try {
                const audio = new Audio(soundOnOpen);
                audio.volume = 0.3;
                audio.play().catch(e => console.error("Could not play sound:", e));
            } catch (error) {
                console.error("Error creating audio element for modal:", error);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const mountNode = typeof document !== "undefined" ? document.body : null;
    if (!mountNode) return null;

    const [center, setCenter] = useState({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
    });

    useLayoutEffect(() => {
        function updateCenter() {
            const container = attachTo instanceof Element
                ? attachTo
                : document.querySelector('[data-modal-root]');

            if (container) {
                const rect = container.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = variant === "alert"
                    ? rect.top + 20 + Math.max(24, rect.height * 0.08)
                    : rect.top + rect.height / 2;
                setCenter({x: Math.round(cx), y: Math.round(cy)});
            } else {
                setCenter({x: window.innerWidth / 2, y: window.innerHeight / 2});
            }
        }

        updateCenter();
        window.addEventListener("resize", updateCenter, {passive: true});
        window.addEventListener("scroll", updateCenter, {passive: true});
        const mo = new MutationObserver(updateCenter);
        mo.observe(document.body, {childList: true, subtree: true});
        return () => {
            window.removeEventListener("resize", updateCenter);
            window.removeEventListener("scroll", updateCenter);
            mo.disconnect();
        };
    }, [variant, attachTo]);

    // ✨ --- ПОКРАЩЕНІ ВАРІАНТИ АНІМАЦІЇ --- ✨
    const backdropVariants = {
        hidden: {opacity: 0},
        visible: {opacity: 1},
    };

    const modalVariants = {
        hidden: {opacity: 0, scale: 0.9, y: "-45%", x: "-50%"},
        visible: {opacity: 1, scale: 1, y: "-50%", x: "-50%"},
        exit: {opacity: 0, scale: 0.9, y: "-55%", x: "-50%"}
    };

    const overlayBase = {
        position: "fixed",
        inset: 0,
        display: "block",
        zIndex: 2147483647,
        pointerEvents: "auto",
    };

    const backdropStyle = {
        position: "absolute",
        inset: 0,
        background: backdrop ? "rgba(0,0,0,0.5)" : "transparent",
        // ✨ Покращений "скляний" ефект
        backdropFilter: backdrop ? "blur(8px) saturate(120%)" : "none",
        WebkitBackdropFilter: backdrop ? "blur(8px) saturate(120%)" : "none",
        zIndex: 2147483646,
    };

    const modalPositionStyle = {
        position: "fixed",
        left: `${center.x}px`,
        top: `${center.y}px`,
        // ✨ УСІ ВАШІ СТИЛІ ПОЗИЦІОНУВАННЯ ТА РОЗМІРІВ ЗБЕРЕЖЕНО
        width: "min(360px, 86vw)",
        maxWidth: "360px",
        maxHeight: "72vh",
        overflowY: "auto",
        zIndex: 2147483647,
        boxSizing: "border-box",
        // Прибираємо стандартний скролбар, якщо потрібно
        '::-webkit-scrollbar': {
            display: 'none'
        },
        scrollbarWidth: 'none',
        ...style,
    };

    const modal = (
        <AnimatePresence mode="wait">
            <div style={overlayBase} className={`modal-root ${className}`}>
                <GlobalStyles/> {/* ✨ Додаємо глобальні стилі */}
                <motion.div
                    key="backdrop"
                    style={backdropStyle}
                    onClick={onClose}
                    variants={animation ? backdropVariants : {}}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    transition={{duration: 0.3, ease: "circOut"}}
                />
                <motion.div
                    key="modal-content"
                    style={modalPositionStyle}
                    onClick={(e) => e.stopPropagation()}
                    variants={animation ? modalVariants : {}}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    // ✨ Трохи змінена анімація для більш чіткого ефекту
                    transition={{type: "spring", damping: 25, stiffness: 350}}
                >
                    {children}
                </motion.div>
            </div>
        </AnimatePresence>
    );

    return ReactDOM.createPortal(modal, mountNode);
}


// ✨ --- Box (Значно перероблений для кращого візуалу) --- ✨
function Box({children, style = {}, className = "", onClose}) {
    const baseStyle = {
        position: "relative",
        // ✨ Ефект "Аврора" - напівпрозорий фон з градієнтом та шумом
        background: `radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.08), transparent 70%), var(--surface-background)`,
        backgroundImage: `url('${noiseURL}'), radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.08), transparent 70%)`,
        backgroundBlendMode: 'overlay',
        backgroundRepeat: 'repeat',
        backgroundSize: 'auto, 100% 100%',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',

        borderRadius: 16,
        // ✨ М'яка, багатошарова тінь для глибини
        boxShadow: "0 16px 40px var(--shadow-color), 0 0 0 1px var(--surface-border)",
        // ✨ Замість border використовуємо тінь, щоб не конфліктувати з градієнтною обводкою
        border: "1px solid transparent",
        padding: 14,
        color: "var(--text-primary)",
        fontFamily: "'Inter', sans-serif",
        width: "100%",
        maxWidth: "440px",
        boxSizing: "border-box",
        overflow: "hidden", // Потрібно для градієнтної обводки
        ...style,
    };

    const gradientBorderStyle = {
        content: '""',
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        padding: '1px', // Товщина обводки
        background: 'var(--gradient-border)',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        pointerEvents: 'none',
    };

    const closeStyle = {
        position: "absolute",
        right: 10,
        top: 10,
        width: 32,
        height: 32,
        zIndex: 2,
        borderRadius: 10,
        border: "none",
        background: "rgba(255,255,255,0.08)",
        color: "var(--text-secondary)",
        fontSize: 18,
        fontWeight: 500,
        lineHeight: "32px",
        textAlign: "center",
        cursor: "pointer",
        transition: "background 0.2s ease, color 0.2s ease, transform 0.2s ease",
    };

    return (
        <div style={baseStyle} className={`modal-box ${className}`}>
            <div style={gradientBorderStyle}/> {/* ✨ Градієнтна обводка */}
            {onClose && (
                <motion.button
                    aria-label="Close"
                    onClick={onClose}
                    style={closeStyle}
                    title="Закрити"
                    whileHover={{
                        background: "rgba(255,255,255,0.15)",
                        color: "var(--text-primary)",
                        scale: 1.1,
                        rotate: 90
                    }}
                    whileTap={{scale: 0.9}}
                >
                    ×
                </motion.button>
            )}
            <div style={{position: "relative", zIndex: 1}}> {/* Контент має бути над обводкою */}
                {children}
            </div>
        </div>
    );
}


// ✨ --- Покращені компоненти --- ✨

function HeaderBar({title}) {
    return (
        <div style={{
            textAlign: "center",
            fontWeight: 800,
            fontSize: 18,
            marginBottom: 8,
            // ✨ Легка тінь для кращої читабельності
            textShadow: '0 1px 3px rgba(0,0,0,0.5)'
        }}>
            {title}
        </div>
    );
}

function GradientButton({children, onClick, style = {}, variant = 'primary'}) {
    const buttonStyle = {
        borderRadius: 18,
        padding: "10px 16px",
        fontWeight: 700,
        fontSize: 15,
        color: 'white',
        boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
        background: variant === 'alt' ? 'var(--gradient-button-alt)' : 'var(--gradient-button)',
        border: "none",
        cursor: "pointer",
        outline: "none",
        ...style,
    };

    return (
        <motion.button
            onClick={onClick}
            style={buttonStyle}
            whileHover={{scale: 1.05, y: -2, boxShadow: "0 8px 20px rgba(0,0,0,0.4)"}}
            whileTap={{scale: 0.98, y: 0}}
            transition={{type: "spring", stiffness: 400, damping: 15}}
        >
            {children}
        </motion.button>
    );
}


// ✨ 2. Створюємо невеликий компонент для анімації числа
const AnimatedChance = ({ chance }) => {
    // Використовуємо хук useSpring для анімації
    const { number } = useSpring({
        from: { number: 0 },
        to: chance,
        delay: 300, // Невелика затримка перед початком анімації
        config: { mass: 1, tension: 20, friction: 15 }, // Налаштування для плавної анімації
    });

    // Повертаємо анімований елемент
    return (
        <animated.span>
            {number.to(val => `${val.toFixed(0)}%`)}
        </animated.span>
    );
};


/* ---------- TopChancesAlert (Покращена версія з анімацією) ---------- */
export function TopChancesAlert({ teams = [] }) {
    return (
        <Box style={{ width: 360, padding: 16 }}>
            <div style={{
                color: "var(--glow-secondary)",
                fontWeight: 800,
                fontSize: 16,
                textAlign: "center",
                marginBottom: 12,
                textShadow: '0 2px 5px rgba(174, 76, 255, 0.4)'
            }}>
                Поточні шанси на гол:
            </div>
            {teams.slice(0, 2).map((t, i) => (
                <div key={t.name} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: i === 0 ? 0 : 8,
                    padding: '8px 12px',
                    background: 'var(--surface-highlight)',
                    borderRadius: 10
                }}>
                    <div style={{ color: "var(--text-secondary)", fontSize: 14, fontWeight: 500 }}>
                        {`Команда ${t.name} (${t.meta}):`}
                    </div>
                    <div style={{
                        color: t.chance >= 50 ? "var(--green-accent)" : "var(--red-accent)",
                        fontWeight: 800,
                        fontSize: 16,
                        textShadow: `0 0 8px ${t.chance >= 50 ? 'var(--green-accent)' : 'var(--red-accent)'}`
                    }}>
                        {/* ✨ 3. Замінюємо статичний вивід на анімований компонент */}
                        <AnimatedChance chance={t.chance} />
                    </div>
                </div>
            ))}
        </Box>
    );
}

/* ---------- PlayerModal (Більш виразний дизайн) ---------- */
export function PlayerModal({
                                player = {},
                                isOwner = false, // <-- Новий пропс, що визначає, чи це гравець користувача
                                onBuy,
                                onSell, // Тепер це функція для переходу до SetPriceModal
                                onRemoveFromSale, // <-- Нова функція
                                onInstantSell,
                                onClose,
                                isProcessing = false, // <-- Новий пропс для блокування кнопок
}) {
    console.log("Player: ", player);
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);
    const statItemStyle = {
        display: "contents" // Дозволяє дочірнім елементам поводитись як прямі нащадки grid
    };
    const statLabelStyle = {color: "var(--text-secondary)", fontWeight: 500, fontSize: 14};
    const statValueStyle = {
        fontWeight: 700,
        fontSize: 15,
        textAlign: 'right',
        textShadow: '0 1px 2px var(--shadow-color)'
    };

    return (
        <Box style={{padding: 16}} onClose={onClose}>
            <HeaderBar title="Інформація про гравця"/>

            <div style={{display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap"}}>
                <div style={{flex: "0 0 auto", width: 92, maxWidth: "28%", boxSizing: "border-box"}}>
                    <motion.img
                        src={player.images.avatar || "/assets/img172.png"}
                        alt={player.name}
                        style={{
                            width: "100%",
                            height: "auto",
                            maxHeight: 110,
                            objectFit: "cover",
                            borderRadius: 12,
                            border: "2px solid var(--glow-primary)",
                            boxShadow: `0 0 15px -2px var(--glow-primary)`,
                            display: "block",
                        }}
                        initial={{opacity: 0, scale: 0.8}}
                        animate={{opacity: 1, scale: 1}}
                        transition={{delay: 0.1}}
                    />
                </div>

                <div style={{flex: "1 1 60%", minWidth: 140, boxSizing: "border-box"}}>
                    <div style={{fontSize: 20, fontWeight: 800}}>{player.name || "—"}</div>
                    <div style={{color: "var(--text-secondary)", marginTop: 4, fontStyle: 'italic'}}>{player.position || "—"}</div>

                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto",
                        gap: "8px 12px",
                        marginTop: 12,
                        alignItems: "center"
                    }}>
                        <div style={statItemStyle}><span style={statLabelStyle}>Вік:</span><span
                            style={statValueStyle}>{player.age ?? "—"}</span></div>
                        <div style={statItemStyle}><span style={statLabelStyle}>Сила:</span><span
                            style={statValueStyle}>{player.power ?? "—"}</span></div>
                        <div style={statItemStyle}><span style={statLabelStyle}>Талант:</span><span
                            style={statValueStyle}>{player.talent ?? "—"}</span></div>
                    </div>

                    <div style={{
                        marginTop: 16,
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        flexWrap: "wrap"
                    }}>
                        {/* --- УМОВНИЙ РЕНДЕРИНГ КНОПОК --- */}
                        {isOwner ? (
                            <>
                                {player.transfer ? (
                                    <GradientButton onClick={onRemoveFromSale} variant="danger" disabled={isProcessing}>
                                        {isProcessing ? 'Знімаємо...' : 'Зняти з продажу'}
                                    </GradientButton>
                                ) : (
                                    <div style={{ display: 'flex', gap: '20px', width: '100%', height: 70, position: 'relative', right: 60 }}>
                                        <GradientButton onClick={onSell} variant="alt" disabled={isProcessing} style={{ flex: 1 }}>
                                            Продати на ринку
                                        </GradientButton>
                                        <GradientButton onClick={onInstantSell} variant="danger" disabled={isProcessing} style={{ flex: 1 }}>
                                            Продати моментально
                                        </GradientButton>
                                    </div>
                                )}
                            </>
                        ) : (
                            <GradientButton onClick={onBuy} disabled={isProcessing}>
                                {isProcessing ? 'Купуємо...' : 'Купити'}
                            </GradientButton>
                        )}
                        <div style={{ marginLeft: "auto", /* ... */ }}>
                            @{player.seller || player.owner?.user_name || "—"}
                        </div>
                    </div>
                </div>
            </div>
        </Box>
    );
}


/* ---------- DonateEnergyModal & OutOfEnergyModal (Об'єднані стилі карток) ---------- */
// ✨ Компонент для картки товару, щоб уникнути дублювання
function ShopPackCard({pack, onAction, actionText, pricePrefix = "", priceSuffix = " грн"}) {
    return (
        <motion.div
            style={{
                background: "var(--surface-highlight)",
                padding: 12,
                borderRadius: 12,
                textAlign: "center",
                boxSizing: "border-box",
                border: "1px solid var(--surface-border)",
                overflow: 'hidden',
                position: 'relative'
            }}
            whileHover={{
                scale: 1.03,
                boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
                background: 'rgba(255,255,255,0.08)'
            }}
            transition={{type: "spring", stiffness: 300, damping: 15}}
            variants={{
                hidden: {opacity: 0, y: 20},
                visible: {opacity: 1, y: 0}
            }}
        >
            <img src={pack.img} alt={pack.label || `pack-${pack.id}`} style={{
                width: 72,
                height: 72,
                objectFit: "contain",
                marginBottom: 4,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
            }}/>
            <div style={{fontWeight: 800, fontSize: 16, marginBottom: 6}}>{pack.label}</div>
            <div style={{
                marginBottom: 10,
                color: "var(--text-secondary)",
                fontSize: 14,
                fontWeight: 500
            }}>{pricePrefix}{pack.price}{priceSuffix}</div>
            <GradientButton onClick={() => onAction(pack)} style={{width: "100%", fontSize: 14}}>
                {actionText}
            </GradientButton>
        </motion.div>
    );
}

export function BuyModal({onClose, onDonate, type = 'coin'}) {
    const packs = type === "coin" ? [
        {id: 1, label: "x100", price: 125, img: Config.IMAGES.coin_mini},
        {id: 2, label: "x500", price: 200, img: Config.IMAGES.coin_medium},
        {id: 3, label: "x1000", price: 350, img: Config.IMAGES.coin_large},
        {id: 4, label: "x10000", price: 2500, img: Config.IMAGES.coin_premium},
    ] : [
        {id: 1, label: "x100", price: 125, img: Config.IMAGES.energy_mini},
        {id: 2, label: "x200", price: 200, img: Config.IMAGES.energy_medium},
        {id: 3, label: "x500", price: 350, img: Config.IMAGES.energy_large},
        {id: 4, label: "x1000", price: 600, img: Config.IMAGES.energy_premium},
    ]

    return (
        <Box style={{padding: 16, maxWidth: 520, height: 480}}>
            <HeaderBar title={type === 'coin' ? "Купити монети": "Купити енергію"}/>

            <motion.div
                style={{display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12}}
                initial="hidden"
                animate="visible"
                variants={{
                    visible: {transition: {staggerChildren: 0.07, delayChildren: 0.2}}
                }}
            >
                {packs.map((p) => (
                    <ShopPackCard key={p.id} pack={p} onAction={onDonate} actionText="Купити"/>
                ))}
            </motion.div>

            <div style={{marginTop: 14, textAlign: "center"}}>
                <motion.button
                    onClick={onClose}
                    style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        fontSize: 13
                    }}
                    whileHover={{color: 'var(--text-primary)'}}
                >
                    Закрити
                </motion.button>
            </div>
        </Box>
    );
}


export function OutOfEnergyModal({onClose, onBuy, packs = null}) {
    const defaultPacks = [
        {id: 1, label: "x100", price: 125, img: Config.IMAGES.energy_mini},
        {id: 2, label: "x200", price: 200, img: Config.IMAGES.energy_medium},
        {id: 3, label: "x500", price: 350, img: Config.IMAGES.energy_large},
        {id: 4, label: "x1000", price: 600, img: Config.IMAGES.energy_premium},
    ];

    const shopPacks = packs || defaultPacks;

    return (
        <Box style={{padding: 16, maxWidth: 520}}>
            <HeaderBar title="Недостатньо енергії"/>
            <div style={{
                color: "var(--text-secondary)",
                fontSize: 14,
                textAlign: 'center',
                marginBottom: 14
            }}>Оберіть пакунок, щоб продовжити:
            </div>

            <motion.div
                style={{display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12}}
                initial="hidden"
                animate="visible"
                variants={{
                    visible: {transition: {staggerChildren: 0.07, delayChildren: 0.2}}
                }}
            >
                {shopPacks.map((p) => (
                    <ShopPackCard key={p.id} pack={p} onAction={onBuy} actionText={`Купити за ${p.price}`}/>
                ))}
            </motion.div>
        </Box>
    );
}


/* ---------- AlertModal (Елегантний та чистий) ---------- */
export function AlertModal({
                               message = "Повідомлення",
                               html = false,
                               onClose = () => {
                               },
                               autoCloseMs = 3000,
                               width = 320,
                               height = 200,
                               maxFont = 22,
                               minFont = 10,
                           }) {
    const textRef = useRef(null);
    const [fontSize, setFontSize] = useState(maxFont);

    useEffect(() => {
        if (!autoCloseMs || autoCloseMs <= 0) return;
        const t = setTimeout(onClose, autoCloseMs);
        return () => clearTimeout(t);
    }, [autoCloseMs, onClose]);

    useLayoutEffect(() => {
        const el = textRef.current;
        if (!el) return;
        let size = maxFont;
        el.style.fontSize = size + "px"; // Встановлюємо початковий розмір
        while (size > minFont && (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth)) {
            size--;
            el.style.fontSize = size + "px";
        }
        setFontSize(size);
    }, [message, maxFont, minFont, width, height, html]);

    const alertStyle = {
        width,
        height,
        background: `radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.08), transparent 70%), var(--surface-background)`,
        borderRadius: 16,
        boxShadow: "0 16px 40px var(--shadow-color), 0 0 0 1px var(--surface-border)",
        padding: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        position: "relative",
        overflow: 'hidden',
        border: '1px solid transparent'
    };

    const gradientBorderStyle = {
        content: '""',
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        padding: '1px',
        background: 'var(--gradient-border)',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        pointerEvents: 'none',
    };

    const textContainerStyle = {
        width: "100%",
        height: "100%",
        overflow: "hidden",
        color: "var(--text-primary)",
        boxSizing: "border-box",
        fontWeight: 700,
        lineHeight: 1.3,
        fontSize,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
    };

    return (
        <div style={alertStyle}>
            <div style={gradientBorderStyle} />
            <motion.button
                onClick={onClose}
                style={{
                    position: "absolute", top: 8, right: 8, width: 30, height: 30,
                    background: "rgba(255,255,255,0.08)", border: "none", color: "#fff",
                    fontSize: 18, cursor: "pointer", borderRadius: 10, zIndex: 2
                }}
                whileHover={{
                    background: "rgba(255,255,255,0.15)",
                    scale: 1.1,
                    rotate: 90
                }}
                whileTap={{scale: 0.9}}
            >
                ×
            </motion.button>
            {html ? (
                <div ref={textRef} style={textContainerStyle} dangerouslySetInnerHTML={{__html: message}}/>
            ) : (
                <div ref={textRef} style={textContainerStyle}>{message}</div>
            )}
        </div>
    );
}



// ✨--- НОВИЙ КОМПОНЕНТ ДЛЯ ВТОРИННИХ КНОПОК ---✨
function SecondaryButton({ children, onClick, style = {} }) {
    const buttonStyle = {
        borderRadius: 18,
        padding: "10px 16px",
        fontWeight: 700,
        fontSize: 15,
        background: "var(--surface-highlight)",
        border: "1px solid var(--surface-border)",
        cursor: "pointer",
        color: "var(--text-secondary)",
        ...style,
    };
    return (
        <motion.button
            onClick={onClick}
            style={buttonStyle}
            whileHover={{ scale: 1.05, color: 'var(--text-primary)', background: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.98 }}
        >
            {children}
        </motion.button>
    );
}


// ✨ --- BuyEnergyModal (Покращена версія) --- ✨
export function BuyEnergyModal({
                                   balanceCoins = null,
                                   packs = null,
                                   onConfirm = () => {},
                                   onClose = () => {},
                               }) {
    const defaultPacks = [
        {id: 1, label: "20", energy: 20, img: Config.IMAGES.energy_mini},
        {id: 2, label: "50", energy: 50, img: Config.IMAGES.energy_mini},
        {id: 3, label: "100", energy: 100, img: Config.IMAGES.energy_mini},
        {id: 4, label: "200", energy: 200, img: Config.IMAGES.energy_medium},
        {id: 5, label: "400", energy: 500, img: Config.IMAGES.energy_large},
        {id: 6, label: "1000", energy: 1000, img: Config.IMAGES.energy_premium},
    ];
    const shopPacks = packs && packs.length ? packs : defaultPacks;

    const [energy, setEnergy] = useState(shopPacks[0].energy);
    const [customQty, setCustomQty] = useState(String(shopPacks[0].energy));
    const [isInputFocused, setInputFocused] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "Enter") handleConfirm();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [energy, customQty]);

    function onSelectPack(p) {
        setEnergy(p.energy);
        setCustomQty(String(p.energy));
    }

    function handleCustomChange(val) {
        const clean = val.replace(/\D+/g, "");
        setCustomQty(clean);
        setEnergy(clean === "" ? 0 : Number(clean));
    }

    function handleConfirm() {
        const qty = Number(energy || 0);
        if (!qty || qty <= 0) return;
        onConfirm({energy: qty});
    }

    const inputStyle = {
        padding: "10px 12px", borderRadius: 10, border: "1px solid var(--surface-border)",
        background: "rgba(0,0,0,0.2)", color: "white", width: "100%", boxSizing: "border-box",
        fontSize: 15, fontWeight: 500, outline: 'none',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        borderColor: isInputFocused ? 'var(--glow-primary)' : 'var(--surface-border)',
        boxShadow: isInputFocused ? `0 0 8px -1px var(--glow-primary)` : 'none',
    };

    return (
        <Box style={{padding: 16, maxWidth: 520}} onClose={onClose}>
            <HeaderBar title="Задонатити енергію"/>

            <div style={{display: "flex", gap: 16, alignItems: "center", marginBottom: 16}}>
                <motion.div
                    style={{flex: "0 0 92px", textAlign: 'center'}}
                    initial={{opacity: 0, scale: 0.5}}
                    animate={{opacity: 1, scale: 1}}
                    transition={{delay: 0.1, type: 'spring', stiffness: 200}}
                >
                    <img src={Config.IMAGES.energy_large} alt="energy" style={{width: 80, height: 80, objectFit: "contain", filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.5))'}}/>
                </motion.div>

                <div style={{flex: 1}}>
                    <div style={{color: "var(--text-secondary)", marginBottom: 8, fontSize: 14}}>Оберіть кількість або введіть вручну</div>
                    <motion.div
                        style={{display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12}}
                        variants={{visible: {transition: {staggerChildren: 0.05}}}}
                        initial="hidden" animate="visible"
                    >
                        {shopPacks.map((p) => (
                            <motion.button
                                key={p.id}
                                onClick={() => onSelectPack(p)}
                                style={{
                                    padding: "8px 12px", borderRadius: 12, cursor: "pointer",
                                    fontWeight: 700, border: '2px solid transparent'
                                }}
                                variants={{hidden: {opacity: 0, y: 10}, visible: {opacity: 1, y: 0}}}
                                animate={{
                                    borderColor: p.energy === Number(energy) ? 'var(--glow-primary)' : 'transparent',
                                    background: p.energy === Number(energy) ? 'rgba(27,202,251,0.15)' : 'var(--surface-highlight)',
                                }}
                                whileHover={{scale: 1.05, background: 'rgba(27,202,251,0.1)'}}
                            >
                                {p.label}
                            </motion.button>
                        ))}
                    </motion.div>

                    <input ref={inputRef} value={customQty} onChange={(e) => handleCustomChange(e.target.value)}
                           placeholder="Кількість" inputMode="numeric" style={inputStyle}
                           onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)} />
                </div>
            </div>

            <div style={{display: "flex", gap: 10, justifyContent: "flex-end", alignItems: 'center', marginTop: 6}}>
                <div style={{marginRight: 'auto', color: "var(--text-secondary)", fontSize: 14}}>
                    Разом: <span style={{color: 'var(--text-primary)', fontWeight: 700}}>{energy} енергії</span>
                </div>
                <SecondaryButton onClick={onClose}>Відмінити</SecondaryButton>
                <GradientButton onClick={handleConfirm} style={{minWidth: 120}}>Задонатити</GradientButton>
            </div>
        </Box>
    );
}


// ✨ --- SetPriceModal (Покращена версія) --- ✨
export function SetPriceModal({
                                  initialPrice = 1000,
                                  minPrice = 1,
                                  maxPrice = 1000000,
                                  onConfirm = () => {},
                                  onClose = () => {},
                                  onBack = () => {}, // <-- Новий пропс
                                  isProcessing = false, // <-- Новий пропс для блокування кнопки
                              }) {
    const [price, setPrice] = useState(initialPrice);
    const [isInputFocused, setInputFocused] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") onClose();
            if (e.key === "Enter") handleConfirm();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [price]);

    function handleChange(val) {
        const clean = val.replace(/\D+/g, "");
        let num = clean === "" ? "" : Number(clean);
        if (num > maxPrice) num = maxPrice;
        setPrice(num);
    }
    function handleConfirm() {
        if (isProcessing) return;
        const p = Number(price || 0);
        if (p < minPrice || p > maxPrice) return;
        onConfirm(p);
    }

    const inputContainerStyle = {
        position: 'relative', width: '100%',
    };

    const inputStyle = {
        padding: "16px 20px 16px 50px", borderRadius: 12, border: "1px solid var(--surface-border)",
        background: "rgba(0,0,0,0.2)", color: "white", width: "100%",
        boxSizing: "border-box", fontWeight: 800, fontSize: 22, outline: 'none',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        borderColor: isInputFocused ? '#F8BA19' : 'var(--surface-border)',
        boxShadow: isInputFocused ? `0 0 10px -1px #F8BA19` : 'none',
    };

    return (
        <Box style={{padding: 16, maxWidth: 420}} onClose={onClose}>
            <HeaderBar title="Встановити ціну"/>
            <div style={{color: "var(--text-secondary)", marginBottom: 12, fontSize: 14, textAlign: 'center'}}>Введіть суму в монетах</div>

            <div style={inputContainerStyle}>
                <span style={{position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', fontSize: 24}}>🪙</span>
                <input ref={inputRef} value={price} onChange={(e) => handleChange(e.target.value)}
                       inputMode="numeric" placeholder={`${minPrice}`} style={inputStyle}
                       onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)} />
            </div>

            <div style={{color: "var(--text-secondary)", fontSize: 12, marginTop: 8, textAlign: 'center'}}>
                Мін: {minPrice.toLocaleString('uk-UA')} · Макс: {maxPrice.toLocaleString('uk-UA')}
            </div>

            <div style={{display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20}}>
                {/* --- ДОДАНО КНОПКУ НАЗАД --- */}
                <SecondaryButton onClick={onBack}>Назад</SecondaryButton>
                <div style={{display: "flex", gap: 10}}>
                    <GradientButton onClick={handleConfirm} variant="alt" style={{minWidth: 140}}>
                        {isProcessing ? 'Обробка...' : 'Підтвердити'}
                    </GradientButton>
                </div>
            </div>
        </Box>
    );
}

// ✨ --- VipPromoModal (Преміум версія) --- ✨
export function VipPromoModal({
                                  title = "VIP ПІДПИСКА",
                                  price = "999,99 грн",
                                  benefits = ["+100 ЕНЕРГІЇ ЩОДНЯ", "X2 НАГОРОДИ НАВЧАЛЬНОГО ЦЕНТРУ", "VIP ТУРНІРИ"],
                                  assets = {},
                                  onSubscribe = () => {},
                                  onClose = () => {},
                                  scale = 1,
                              }) {
    const background = assets.background || Config.IMAGES.vip_hero || Config.IMAGES.vipBackground;
    const vipImage = assets.vip || Config.IMAGES.VIPImage || Config.IMAGES.vipShield;
    const banner = assets.banner || Config.IMAGES.bannerImage || Config.IMAGES.greenBanner;

    const s = (v) => (typeof v === "number" ? Math.max(1, Math.round(v * scale)) + "px" : v);
    const base = {
        boxMaxWidth: 360, containerMaxHeight: 460, titleFont: 24, vipMaxHeight: 180,
        benefitsFont: 13, buttonHeight: 52, buttonRadius: 12, priceFont: 20, padding: 14,
    };

    return (
        <Box style={{padding: 0, maxWidth: s(base.boxMaxWidth), borderRadius: s(16)}} onClose={onClose}>
            <div style={{
                position: "relative", width: "100%", maxHeight: s(base.containerMaxHeight), overflow: "hidden",
                borderRadius: s(16), display: "flex", flexDirection: "column",
            }}>
                <motion.img src={background} alt="vip background"
                            style={{position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none"}}
                            initial={{scale: 1.2, opacity: 0.8}}
                            animate={{scale: 1, opacity: 1}}
                            transition={{duration: 0.5, ease: 'easeOut'}}
                />
                <div style={{ position: "absolute", inset: 0, background: 'radial-gradient(circle at 50% 30%, transparent 0%, rgba(0,0,0,0.8) 100%)' }} />

                <div style={{
                    position: "relative", zIndex: 1, padding: s(base.padding), boxSizing: "border-box",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: s(8),
                    flex: "1 1 auto", overflowY: "auto", textAlign: "center",
                }}>
                    <motion.div
                        style={{color: "#FFFFFF", fontSize: s(base.titleFont), fontWeight: 900, textShadow: "0 4px 12px rgba(0,0,0,0.7)"}}
                        initial={{opacity: 0, y: -20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}}
                    >
                        {title}
                    </motion.div>

                    <motion.div
                        style={{marginTop: s(8), width: "80%", maxWidth: s(240), display: "flex", justifyContent: "center", alignItems: "center"}}
                        initial={{opacity: 0, scale: 0.7}} animate={{opacity: 1, scale: 1}} transition={{delay: 0.3, type: 'spring', damping: 10}}
                    >
                        <motion.img src={vipImage} alt="VIP"
                                    style={{maxHeight: s(base.vipMaxHeight), width: "auto", objectFit: "contain", filter: "drop-shadow(0 10px 25px rgba(0,0,0,0.6))"}}
                                    animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        />
                    </motion.div>

                    <motion.div
                        style={{ marginTop: s(8), color: "#FDE400", fontWeight: 700, fontSize: s(base.benefitsFont), lineHeight: 1.4, textShadow: "0 2px 4px rgba(0,0,0,0.6)"}}
                        initial={{opacity: 0}} animate={{opacity: 1}} transition={{delay: 0.5}}
                    >
                        {benefits.map((b, i) => (
                            <div key={i} style={{marginBottom: i === benefits.length - 1 ? 0 : s(6), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8}}>
                                <span style={{color: '#37C35F'}}>✓</span><span>{b}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>

                <div style={{
                    position: "relative", zIndex: 2, padding: `${s(12)} ${s(base.padding)}`, boxSizing: "border-box",
                    background: "linear-gradient(0deg, rgba(0,0,0,0.4), transparent)",
                }}>
                    <motion.button
                        onClick={onSubscribe}
                        style={{
                            width: "100%", maxWidth: s(300), height: s(base.buttonHeight),
                            borderRadius: s(base.buttonRadius), border: "rgba(255,255,255,0.8)",
                            cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
                            overflow: "hidden", outline: "none", WebkitTapHighlightColor: "transparent",
                            backgroundImage: `url(${banner})`, backgroundSize: "cover", backgroundPosition: "center",
                            boxShadow: "0 8px 25px rgba(0,0,0,0.5), inset 0 2px 2px rgba(255,255,255,0.2), inset 0 -3px 3px rgba(0,0,0,0.2)",
                            backgroundColor: "#10783c",
                        }}
                        whileHover={{scale: 1.03, boxShadow: "0 12px 30px rgba(0,0,0,0.6), inset 0 2px 2px rgba(255,255,255,0.2), inset 0 -3px 3px rgba(0,0,0,0.2)", filter: 'brightness(1.1)'}}
                        whileTap={{scale: 0.98, filter: 'brightness(0.95)'}}
                        transition={{type: 'spring', stiffness: 300, damping: 15}}
                    >
                        <span style={{fontWeight: 900, fontSize: s(base.priceFont), color: "#fff", textShadow: "0 2px 5px rgba(0,0,0,0.7)", pointerEvents: "none"}}>
                            {price}
                        </span>
                    </motion.button>
                </div>
            </div>
        </Box>
    );
}


/* ---------- Экспорт по умолчанию ---------- */
export default {
    ModalRoot,
    TopChancesAlert,
    PlayerModal,
    OutOfEnergyModal,
    BuyModal,
    AlertModal,
    SetPriceModal,
    BuyEnergyModal
};
