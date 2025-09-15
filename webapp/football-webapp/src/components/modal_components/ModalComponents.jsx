import React, {useEffect, useLayoutEffect, useRef, useState} from "react";
import ReactDOM from "react-dom";
import Config from "../../config.js";

/**
 * ModalRoot — теперь всегда портирует в document.body (чтобы не зависеть от места рендера)
 * и жёстко ограничивает размеры модалки (width/maxWidth/maxHeight + overflowY:auto).
 */

export function ModalRoot({
                              children,
                              onClose,
                              backdrop = true,
                              variant = "center",
                              attachTo = null, // <--- поддерживаем проп
                              className = "",
                              style = {},
                          }) {
    // если attachTo передали и это DOM-элемент — монтируем относительно него (находим его центр)
    const mountNode = typeof document !== "undefined" ? document.body : null;
    if (!mountNode) return null;

    // состояние центра (как у вас было)
    const [center, setCenter] = useState({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
    });

    useLayoutEffect(() => {
        function updateCenter() {
            // prefer attachTo if provided and valid
            const container = attachTo instanceof Element
                ? attachTo
                : document.querySelector('[data-modal-root]'); // fallback (не надежный при CSS Modules)

            if (container) {
                const rect = container.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = variant === "alert"
                    ? rect.top + Math.max(24, rect.height * 0.08)
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
    }, [variant, attachTo]); // <-- завязано на attachTo


    // Overlay: покрытие всего viewport (фон), модалка будет позиционироваться фиксированно по center
    const overlayBase = {
        position: "fixed",
        inset: 0,
        display: "block", // фон один, модалка позиционируется отдельно
        zIndex: 2147483647,
        pointerEvents: "auto",
    };

    const backdropStyle = {
        position: "absolute",
        inset: 0,
        background: backdrop ? "rgba(0,0,0,0.45)" : "transparent",
        WebkitBackdropFilter: backdrop ? "blur(2px)" : "none",
        zIndex: 2147483646,
    };

    // сам модальный контейнер — позиционируем его фиксированно в точке center
    const modalPositionStyle = {
        position: "fixed",
        left: `${center.x}px`,
        top: `${center.y}px`,
        transform: "translate(-50%, -50%)",
        // Ограничение размеров: никогда не вылезет за экран
        width: "min(360px, 86vw)", // немного компактнее
        maxWidth: "360px",
        maxHeight: "72vh",
        overflowY: "auto",
        zIndex: 2147483647,
        boxSizing: "border-box",
        ...style,
    };

    const modal = (
        <div style={overlayBase} className={`modal-root ${className}`}>
            <div style={backdropStyle} onClick={onClose}/>
            <div style={modalPositionStyle} onClick={(e) => e.stopPropagation()}>
                {children}
            </div>
        </div>
    );

    return ReactDOM.createPortal(modal, mountNode);
}

// Box — внутренний контейнер, контролирует padding и внутренний maxWidth
function Box({children, style = {}, className = "", onClose}) {
    const base = {
        position: "relative",        // нужно для абсолютного позиционирования крестика
        background: "rgba(38,38,38,0.95)",
        borderRadius: 12,
        boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
        border: "1px solid rgba(33,132,218,0.06)",
        padding: 12,
        color: "white",
        fontFamily: "Inter, sans-serif",
        width: "100%",
        maxWidth: "440px",
        boxSizing: "border-box",
        ...style,
    };

    const closeStyle = {
        position: "absolute",
        right: 8,
        top: 8,
        width: 30,
        height: 30,
        borderRadius: 8,
        border: "none",
        background: "rgba(255,255,255,0.06)",
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: 800,
        lineHeight: "30px",
        textAlign: "center",
        cursor: "pointer",
        boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
    };

    return (
        <div style={base} className={`modal-box ${className}`}>
            {onClose && (
                <button
                    aria-label="Close"
                    onClick={onClose}
                    style={closeStyle}
                    title="Закрити"
                >
                    ×
                </button>
            )}
            {children}
        </div>
    );
}

function HeaderBar({title}) {
    return (
        <div style={{textAlign: "center", fontWeight: 700, fontSize: 16, marginBottom: 6}}>
            {title}
        </div>
    );
}

function GradientButton({children, onClick, style = {}}) {
    return (
        <button
            onClick={onClick}
            style={{
                borderRadius: 18,
                padding: "8px 12px",
                fontWeight: 700,
                boxShadow: "0 4px 8px rgba(0,0,0,0.25)",
                background: "linear-gradient(179deg,#1BCAFB 0%,#1997F8 100%)",
                border: "none",
                cursor: "pointer",
                ...style,
            }}
        >
            {children}
        </button>
    );
}

/* ---------- TopChancesAlert ---------- */
export function TopChancesAlert({teams = []}) {
    return (
        <Box style={{width: 360, padding: 12, background: "rgba(49,49,49,0.95)", borderRadius: 12}}>
            <div style={{color: "#AE4CFF", fontWeight: 700, textAlign: "center", marginBottom: 8}}>
                Поточні шанси на гол:
            </div>
            {teams.slice(0, 2).map((t, i) => (
                <div
                    key={t.name}
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: i === 0 ? 0 : 6,
                    }}
                >
                    <div style={{color: "#A5A5A5", fontSize: 13, fontWeight: 700}}>
                        {`Команда ${t.name} (${t.meta}):`}
                    </div>
                    <div style={{color: t.chance >= 50 ? "#37C35F" : "#D33434", fontWeight: 800}}>{`${t.chance}%`}</div>
                </div>
            ))}
        </Box>
    );
}

/* ---------- PlayerModal (ещё компактнее + адаптив) ---------- */
export function PlayerModal({player = {}, onBuy, onSell}) {
    return (
        <Box style={{padding: 12, borderRadius: 12}}>
            <div style={{textAlign: "center", fontWeight: 800, fontSize: 18, marginBottom: 8}}>
                Інформація про гравця
            </div>

            <div
                style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                }}
            >
                {/* Левый блок с изображением (меньше) */}
                <div style={{flex: "0 0 auto", width: 92, maxWidth: "28%", boxSizing: "border-box"}}>
                    <img
                        src={player.image || "/assets/img172.png"}
                        alt={player.name}
                        style={{
                            width: "100%",
                            height: "auto",
                            maxHeight: 110,
                            objectFit: "cover",
                            borderRadius: 8,
                            border: "2px solid #0BACCC",
                            display: "block",
                        }}
                    />
                </div>

                {/* Правый блок с данными */}
                <div style={{flex: "1 1 60%", minWidth: 140, boxSizing: "border-box"}}>
                    <div style={{fontSize: 18, fontWeight: 800}}>{player.name || "—"}</div>
                    <div style={{color: "#A5A5A5", marginTop: 4}}>{player.position || "—"}</div>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr auto",
                            gap: 8,
                            marginTop: 8,
                            alignItems: "center",
                        }}
                    >
                        <div style={{color: "#A5A5A5", fontWeight: 700}}>Вік:</div>
                        <div style={{fontWeight: 700}}>{player.age ?? "—"}</div>

                        <div style={{color: "#A5A5A5", fontWeight: 700}}>Сила:</div>
                        <div style={{fontWeight: 700}}>{player.power ?? "—"}</div>

                        <div style={{color: "#A5A5A5", fontWeight: 700}}>Талант:</div>
                        <div style={{fontWeight: 700}}>{player.talent ?? "—"}</div>

                        <div style={{color: "#A5A5A5", fontWeight: 700}}>Точність:</div>
                        <div style={{fontWeight: 700}}>{player.accuracy ?? "—"}</div>
                    </div>

                    <div
                        style={{
                            marginTop: 10,
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            flexWrap: "wrap",
                        }}
                    >
                        <button
                            onClick={onBuy}
                            style={{
                                borderRadius: 16,
                                padding: "8px 12px",
                                fontWeight: 700,
                                boxShadow: "0 4px 8px rgba(0,0,0,0.25)",
                                background: "linear-gradient(180deg,#1BCAFB 0%,#1997F8 100%)",
                                border: "none",
                                cursor: "pointer",
                            }}
                        >
                            Купити
                        </button>

                        <button
                            onClick={onSell}
                            style={{
                                borderRadius: 16,
                                padding: "8px 12px",
                                fontWeight: 700,
                                boxShadow: "0 4px 8px rgba(0,0,0,0.25)",
                                background: "linear-gradient(180deg,#FBF21B 0%,#F8BA19 100%)",
                                border: "none",
                                cursor: "pointer",
                            }}
                        >
                            Продати
                        </button>

                        <div style={{marginLeft: "auto", color: "#A5A5A5", fontSize: 12, fontWeight: 700}}>
                            Продавець: {player.seller || "—"}
                        </div>
                    </div>
                </div>
            </div>
        </Box>
    );
}

export function DonateEnergyModal({
                                      onClose = () => {
                                      },
                                      onDonate = (pack) => {
                                      },
                                      assets = {
                                          energy_mini: Config.IMAGES.energy_mini,
                                          energy_medium: Config.IMAGES.energy_medium,
                                          energy_large: Config.IMAGES.energy_large,
                                          energy_premium: Config.IMAGES.energy_premium,
                                      },
                                  }) {
    const packs = [
        {id: 1, label: "x100", price: 125, img: assets.energy_mini},
        {id: 2, label: "x200", price: 200, img: assets.energy_medium},
        {id: 3, label: "x500", price: 350, img: assets.energy_large},
        {id: 4, label: "x1000", price: 600, img: assets.energy_premium},
    ];

    return (
        <Box style={{padding: 14, maxWidth: 520}}>
            <div style={{textAlign: "center", fontWeight: 800, fontSize: 18, marginBottom: 10}}>
                Задонатити енергію
            </div>

            <div style={{display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12}}>
                {packs.map((p) => (
                    <div key={p.id} style={{
                        background: "rgba(255,255,255,0.02)",
                        padding: 12,
                        borderRadius: 10,
                        textAlign: "center",
                        boxSizing: "border-box"
                    }}>
                        <img src={p.img} alt={p.label}
                             style={{width: 72, height: 72, objectFit: "contain", marginBottom: 8}}/>
                        <div style={{fontWeight: 700, marginBottom: 6}}>{p.label}</div>
                        <div style={{marginBottom: 8, color: "#A5A5A5", fontSize: 13}}>{p.price} грн</div>
                        <GradientButton onClick={() => onDonate(p)} style={{width: "100%"}}>
                            Підсилити
                        </GradientButton>
                    </div>
                ))}
            </div>

            <div style={{marginTop: 10, textAlign: "right", color: "#A5A5A5", fontSize: 12}}>
                <button onClick={onClose}
                        style={{background: "transparent", border: "none", color: "#A5A5A5", cursor: "pointer"}}>
                    Закрити
                </button>
            </div>
        </Box>
    );
}

// ================== OutOfEnergyModal (Недостатньо енергії — магазин) ==================
export function OutOfEnergyModal({
                                     onClose = () => {
                                     },
                                     onBuy = (pack) => {
                                     },
                                     packs = null, // можно прокинуть массив паков; по умолчанию — как ниже
                                     assets = {
                                         energy_mini: Config.IMAGES.energy_mini,
                                         energy_medium: Config.IMAGES.energy_medium,
                                         energy_large: Config.IMAGES.energy_large,
                                         energy_premium: Config.IMAGES.energy_premium,
                                     },
                                 }) {
    const defaultPacks = [
        {id: 1, price: 125, multiplier: 100, img: assets.energy_mini},
        {id: 2, price: 200, multiplier: 200, img: assets.energy_medium},
        {id: 3, price: 350, multiplier: 500, img: assets.energy_large},
        {id: 4, price: 600, multiplier: 1000, img: assets.energy_premium},
    ];

    const shopPacks = packs || defaultPacks;

    return (
        <Box style={{padding: 14, maxWidth: 520}}>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8}}>
                <div style={{fontWeight: 800, fontSize: 18}}>Недостатньо енергії</div>
                <button onClick={onClose} style={{
                    width: 34,
                    height: 34,
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.06)",
                    border: "none",
                    cursor: "pointer"
                }}>✕
                </button>
            </div>

            <div style={{color: "#A5A5A5", fontSize: 13, marginBottom: 12}}>ПРИДБАТИ</div>

            <div style={{display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12}}>
                {shopPacks.map((p) => (
                    <div key={p.id} style={{
                        background: "rgba(255,255,255,0.02)",
                        padding: 12,
                        borderRadius: 10,
                        textAlign: "center",
                    }}>
                        <img src={p.img} alt={`pack-${p.id}`}
                             style={{width: 72, height: 72, objectFit: "contain", marginBottom: 8}}/>
                        <div style={{fontWeight: 800, marginBottom: 6}}>x{p.multiplier}</div>
                        <div style={{color: "#A5A5A5", marginBottom: 8}}>{p.price} грн</div>
                        <GradientButton onClick={() => onBuy(p)} style={{width: "100%"}}>
                            {`Купити ${p.price} грн`}
                        </GradientButton>
                    </div>
                ))}
            </div>
        </Box>
    );
}

export function AlertModal({
                               message = "Повідомлення",
                               onClose = () => {
                               },
                               autoCloseMs = 2500, // миллисекунд; 0 = не закрывать автоматически
                               style = {},
                           }) {
    useEffect(() => {
        if (!autoCloseMs || autoCloseMs <= 0) return;
        const t = setTimeout(() => onClose(), autoCloseMs);
        return () => clearTimeout(t);
    }, [autoCloseMs, onClose]);

    return (
        <div
            role="alert"
            aria-live="polite"
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px 20px",
                borderRadius: 12,
                background: "linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
                boxShadow: "0 10px 30px rgba(0,0,0,0.45), 0 0 18px rgba(80,200,255,0.06) inset",
                border: "1px solid rgba(255,255,255,0.03)",
                backdropFilter: "blur(6px)",
                minWidth: 240,
                maxWidth: "84vw",
                ...style,
            }}
        >
            <div style={{
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: 18,
                textAlign: "center",
                lineHeight: 1.15,
                textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                padding: "4px 6px",
                wordBreak: "break-word",
                whiteSpace: "pre-wrap",
            }}>
                {message}
            </div>
        </div>
    );
}

export function BuyEnergyModal({
                                   balanceCoins = null,
                                   packs = null,
                                   onConfirm = () => {
                                   },
                                   onClose = () => {
                                   },
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
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    // keyboard handlers: Enter -> confirm, Esc -> close
    useEffect(() => {
        function onKey(e) {
            if (e.key === "Escape") onClose();
            if (e.key === "Enter") handleConfirm();
        }

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
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

    return (
        <Box style={{padding: 14, maxWidth: 520}} onClose={onClose}>
            <div style={{textAlign: "center", fontWeight: 800, fontSize: 18, marginBottom: 8}}>
                Задонатити енергію
            </div>

            <div style={{display: "flex", gap: 12, alignItems: "center", marginBottom: 12}}>
                <div style={{flex: "0 0 92px"}}>
                    <img
                        src={shopPacks[0].img || Config.IMAGES.energy_mini}
                        alt="energy"
                        style={{width: 72, height: 72, objectFit: "contain"}}
                    />
                </div>

                <div style={{flex: 1}}>
                    <div style={{color: "#A5A5A5", marginBottom: 8}}>Выберите количество или введите вручную</div>

                    <div style={{display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8}}>
                        {shopPacks.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => onSelectPack(p)}
                                style={{
                                    padding: "8px 12px",
                                    borderRadius: 12,
                                    border: p.energy === Number(energy) ? "2px solid #1BCAFB" : "1px solid rgba(255,255,255,0.04)",
                                    background: p.energy === Number(energy) ? "rgba(27,202,251,0.06)" : "rgba(255,255,255,0.02)",
                                    cursor: "pointer",
                                    fontWeight: 700,
                                }}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    <div style={{display: "flex", gap: 8, alignItems: "center"}}>
                        <input
                            ref={inputRef}
                            value={customQty}
                            onChange={(e) => handleCustomChange(e.target.value)}
                            placeholder="Ввести количество энергии"
                            inputMode="numeric"
                            style={{
                                padding: "8px 10px",
                                borderRadius: 8,
                                border: "1px solid rgba(255,255,255,0.06)",
                                background: "transparent",
                                color: "white",
                                width: "100%",
                                boxSizing: "border-box",
                            }}
                        />
                        <div style={{color: "#A5A5A5", fontWeight: 700}}>{energy} енерг.</div>
                    </div>
                </div>
            </div>

            <div style={{display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6}}>
                <button
                    onClick={onClose}
                    style={{
                        borderRadius: 16,
                        padding: "8px 12px",
                        fontWeight: 700,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.03)",
                        cursor: "pointer",
                        color: "#fff",
                    }}
                >
                    Відмінити
                </button>

                <GradientButton
                    onClick={handleConfirm}
                    style={{
                        minWidth: 120,
                        background: "linear-gradient(180deg,#1BCAFB 0%,#1997F8 100%)",
                        cursor: "pointer",
                    }}
                >
                    Підтвердити
                </GradientButton>
            </div>
        </Box>
    );
}

/**
 * SetPriceModal (ввод монет) — например, выставление цены на продажу игрока
 * - props:
 *    initialPrice (number)
 *    minPrice (number)
 *    maxPrice (number)
 *    onConfirm(price)
 *    onClose()
 */
export function SetPriceModal({
                                  initialPrice = 1000,
                                  minPrice = 1,
                                  maxPrice = 1000000,
                                  onConfirm = () => {
                                  },
                                  onClose = () => {
                                  },
                              }) {
    const [price, setPrice] = useState(initialPrice);
    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    useEffect(() => {
        function onKey(e) {
            if (e.key === "Escape") onClose();
            if (e.key === "Enter") handleConfirm();
        }

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [price]);

    function handleChange(val) {
        const clean = val.replace(/\D+/g, "");
        setPrice(clean === "" ? "" : Number(clean));
    }

    function handleConfirm() {
        const p = Number(price || 0);
        if (!p || p < minPrice) return;
        if (p > maxPrice) return;
        onConfirm(p);
    }

    return (
        <Box style={{padding: 14, maxWidth: 420}} onClose={onClose}>
            <div style={{textAlign: "center", fontWeight: 800, fontSize: 18, marginBottom: 8}}>Установить цену
                (монеты)
            </div>

            <div style={{display: "flex", gap: 12, alignItems: "center", marginBottom: 8}}>
                <div style={{flex: 1}}>
                    <div style={{color: "#A5A5A5", marginBottom: 6}}>Введите сумму в монетах</div>
                    <input
                        ref={inputRef}
                        value={price}
                        onChange={(e) => handleChange(e.target.value)}
                        inputMode="numeric"
                        placeholder={`${minPrice}`}
                        style={{
                            padding: "10px 12px",
                            borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.06)",
                            background: "transparent",
                            color: "white",
                            width: "100%",
                            boxSizing: "border-box",
                            fontWeight: 700,
                        }}
                    />
                    <div style={{color: "#A5A5A5", fontSize: 12, marginTop: 8}}>
                        Минимум: {minPrice} · Максимум: {maxPrice}
                    </div>
                </div>

                <div style={{width: 120, textAlign: "center", color: "#A5A5A5", fontWeight: 700}}>
                    <div style={{marginBottom: 6}}>Итого</div>
                    <div style={{fontSize: 18, fontWeight: 900}}>{Number(price || 0)}</div>
                </div>
            </div>

            <div style={{display: "flex", gap: 10, justifyContent: "flex-end"}}>
                <button
                    onClick={onClose}
                    style={{
                        borderRadius: 16,
                        padding: "8px 12px",
                        fontWeight: 700,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.03)",
                        cursor: "pointer",
                        color: "#fff",
                    }}
                >
                    Отмена
                </button>

                <GradientButton
                    onClick={handleConfirm}
                    style={{
                        minWidth: 120,
                        background: "linear-gradient(180deg,#FBF21B 0%,#F8BA19 100%)",
                        color: "#222",
                        fontWeight: 800,
                    }}
                >
                    Подтвердить
                </GradientButton>
            </div>
        </Box>
    );
}

export function VipPromoModal({
                                  title = "VIP ПІДПИСКА",
                                  price = "999,99 грн",
                                  benefits = ["+100 ЕНЕРГІЇ ЩОДНЯ", "X2 НАГОРОДИ НАВЧАЛЬНОГО ЦЕНТРУ", "VIP ТУРНІРИ"],
                                  assets = {},
                                  onSubscribe = () => {
                                  },
                                  onClose = () => {
                                  },
                                  scale = 1,
                              }) {
    const background = assets.background || Config.IMAGES.vip_hero || Config.IMAGES.vipBackground;
    const vipImage = assets.vip || Config.IMAGES.VIPImage || Config.IMAGES.vipShield;
    const banner = assets.banner || Config.IMAGES.bannerImage || Config.IMAGES.greenBanner;

    const s = (v) => (typeof v === "number" ? Math.max(1, Math.round(v * scale)) + "px" : v);

    // base sizes tuned to avoid overflow
    const base = {
        boxMaxWidth: 360,            // общий макс.ширина модалки
        containerMaxHeight: 460,     // уменьшили высоту, чтобы не занимать весь экран
        titleFont: 22,               // чуть меньше
        vipMaxWidth: 240,
        vipMaxHeight: 400,           // КЛЮЧ: уменьшили maxHeight эмблемы
        benefitsFont: 13,
        buttonHeight: 48,
        buttonRadius: 10,
        priceFont: 18,
        padding: 14,
    };

    return (
        <Box
            style={{
                padding: 0,
                maxWidth: s(base.boxMaxWidth),
                borderRadius: Math.max(6, Math.round(12 * scale)),
            }}
            onClose={onClose}
        >
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    maxHeight: s(base.containerMaxHeight),
                    overflow: "hidden",
                    borderRadius: Math.max(6, Math.round(12 * scale)),
                    display: "flex",
                    flexDirection: "column",
                    background: "transparent",
                }}
            >
                {/* background */}
                <img
                    src={background}
                    alt="vip background"
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        pointerEvents: "none",
                        opacity: 1,
                    }}
                />

                {/* scrollable content area */}
                <div
                    style={{
                        position: "relative",
                        zIndex: 1,
                        padding: `${Math.round(base.padding * scale)}px`,
                        boxSizing: "border-box",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: Math.round(6 * scale),
                        flex: "1 1 auto",
                        overflowY: "auto", // запасной скролл только если всё очень много
                        textAlign: "center",
                    }}
                >
                    {/* Title */}
                    <div
                        style={{
                            color: "#FFFFFF",
                            fontSize: s(base.titleFont),
                            fontWeight: 800,
                            textShadow: "0 6px 18px rgba(0,0,0,0.6)",
                            marginTop: 2,
                        }}
                    >
                        {title}
                    </div>

                    {/* VIP image: ограничиваем высоту (важно) */}
                    <div
                        style={{
                            marginTop: Math.round(6 * scale),
                            // контейнер небольшой, чтобы картинка не "растягивалась"
                            width: "70%",
                            maxWidth: s(base.vipMaxWidth),
                            maxHeight: s(base.vipMaxHeight),       // <- уменьшить при необходимости (120px — начальное значение)
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            overflow: "hidden",
                        }}
                    >
                        <img
                            src={vipImage}
                            alt="VIP"
                            style={{
                                height: "200px",     // <- вот это уменьшает картинку
                                width: "auto",       // сохраняем пропорции
                                objectFit: "contain",
                                display: "block",
                                filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.45))",
                            }}
                        />
                    </div>

                    {/* benefits text — компактнее */}
                    <div
                        style={{
                            marginTop: Math.round(6 * scale),
                            color: "#FDE400",
                            fontWeight: 800,
                            fontSize: s(base.benefitsFont),
                            lineHeight: 1.05,
                            textShadow: "0 3px 6px rgba(0,0,0,0.45)",
                            whiteSpace: "pre-line",
                            padding: `${Math.round(4 * scale)}px ${Math.round(6 * scale)}px`,
                        }}
                    >
                        {benefits.map((b, i) => (
                            <div key={i} style={{marginBottom: i === benefits.length - 1 ? 0 : Math.round(4 * scale)}}>
                                {b}
                            </div>
                        ))}
                    </div>

                    {/* немного нижнего отступа чтобы контент не налипал в футер */}
                    <div style={{height: Math.round(6 * scale), flex: "0 0 auto"}}/>
                </div>

                {/* footer: кнопка всегда видна */}
                // footer wrapper — убедимся, что тут нет скролла и контейнер обрезает всё
                <div
                    style={{
                        position: "relative",
                        zIndex: 2,
                        padding: `${Math.round(10 * scale)}px ${Math.round(base.padding * scale)}px`,
                        boxSizing: "border-box",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: Math.round(8 * scale),
                        // если скролл ранее шел по модалке — делаем footer фиксированным внизу и без скролла
                        background: "linear-gradient(0deg, rgba(0,0,0,0.12), rgba(0,0,0,0.02))",
                        borderBottomLeftRadius: Math.max(6, Math.round(12 * scale)),
                        borderBottomRightRadius: Math.max(6, Math.round(12 * scale)),
                        overflow: "hidden",         // важное — обрезаем внутреннее содержимое
                    }}
                >
                    <button
                        onClick={onSubscribe}
                        style={{
                            width: "78%",
                            maxWidth: s(300),
                            height: s(base.buttonHeight),
                            borderRadius: Math.max(6, Math.round(base.buttonRadius * scale)),
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            // ОЧЕНЬ важно: обрезаем фон по радиусу и запретим фокусовую рамку
                            overflow: "hidden",
                            outline: "none",
                            WebkitTapHighlightColor: "transparent",
                            // background image как раньше — но убедимся, что он покрывает ровно
                            backgroundImage: `url(${banner})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center center",
                            backgroundRepeat: "no-repeat",
                            // уменьшенный/мягкий боксшэдоw (убираем возможные белые "обводки")
                            boxShadow: "0 8px 20px rgba(0,0,0,0.35), inset 0 -4px 0 rgba(0,0,0,0.08)",
                            // на случай если фон ассета содержит прозрачность — задаём фон кнопки близкий по цвету,
                            // чтобы не было резкого белого просвета
                            backgroundColor: "rgba(16,120,60,0.9)",
                        }}
                        // убираем фокусную рамку при tab / click
                        onMouseDown={(e)=> e.currentTarget.style.outline="none"}
                        onFocus={(e)=> e.currentTarget.style.outline="none"}
                    >
    <span
        style={{
            fontWeight: 900,
            fontSize: s(base.priceFont),
            color: "#fff",
            textShadow: "0 3px 8px rgba(0,0,0,0.5)",
            padding: `${Math.round(6 * scale)}px ${Math.round(12 * scale)}px`,
            pointerEvents: "none", // чтобы текст не мешал клику
        }}
    >
      {price}
    </span>
                    </button>
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
    DonateEnergyModal,
    AlertModal,
    SetPriceModal,
    BuyEnergyModal
};
