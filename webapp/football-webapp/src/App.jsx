// src/App.jsx
import {useEffect, useState} from "react";
import {BrowserRouter, Route, Routes, useLocation, useNavigate} from "react-router-dom";
import {Main} from "./pages/Main.jsx";
import TrainingRoomCard from "./pages/Training.jsx";
import TournamentCard from "./pages/Tournament.jsx";
import RatingCard from "./pages/Rating.jsx";
import ShopCard from "./pages/Shop.jsx";
import TransferCard from "./pages/Transfer.jsx";
import MatchCard from "./pages/Match.jsx";
import EducationCard from "./pages/EducationCentere.jsx";
import {API_BASE_URL} from "./api.js";
import {useGuide} from "./components/register/context/GuideContext.jsx";

function AppContent() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const { setGuideTarget } = useGuide();

    useEffect(() => {
        async function fetchUser() {
            try {
                let tgId = null;

                const tg = window.Telegram?.WebApp;
                if (tg) {
                    tg.ready();
                    tgId = tg.initDataUnsafe?.user?.id || null;
                }

                if (!tgId) {
                    const params = new URLSearchParams(window.location.search);
                    tgId = params.get("user_id");
                }

                if (!tgId) {
                    setError("Не удалось получить user_id");
                    setLoading(false);
                    return;
                }

                tgId = tgId.toString();

                const res = await fetch(`${API_BASE_URL}/users/${tgId}`);
                if (!res.ok) throw new Error(`Ошибка загрузки пользователя: ${res.status}`);

                const data = await res.json();
                setUser(data);
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, []);

    // useEffect ДЛЯ РЕДИРЕКТА и подсказок
    useEffect(() => {
        if (!user) return;

        // Если пользователь ещё на этапах создания команды / выбора имени / получения первого персонажа —
        // принудительно отправляем на главную страницу
        const needsGoHome = [
            "CREATE_TEAM",
            "SEND_NAME_TEAM",
            "GET_FIRST_CHARACTER",
        ].includes(user.status_register);

        if (needsGoHome && location.pathname !== "/") {
            navigate("/", { replace: true });
            setGuideTarget(null); // Сбрасываем подсказку
            return;
        }

        // ✨ ИЗМЕНЕНИЕ: Убрали проверку `location.pathname`.
        // Теперь `guideTarget` устанавливается независимо от текущей страницы.
        // Это заставляет UI (NavigationBar, Header) блокировать все нецелевые кнопки,
        // пока статус пользователя не изменится.
        const needsTrainingHint = user.status_register === "FIRST_TRAINING";
        const needsShopHint = user.status_register === "SHOPPING";
        const needsTransferHint = user.status_register === "TRANSFER";
        const needsBlitzHint = user.status_register === "FIRST_BLITZ";
        const needsECHint = user.status_register === "EDUCATION_CENTER";
        const needsRatingHint = user.status_register === "RATING";
        const needsHomeHint = user.status_register === "HOME";

        if (needsTrainingHint) {
            setGuideTarget('training');
        } else if (needsTransferHint) {
            setGuideTarget('transfers');
        } else if (needsShopHint) {
            setGuideTarget('shop');
        } else if (needsECHint) {
            setGuideTarget('learning');
        } else if (needsBlitzHint) {
            setGuideTarget("tournaments");
        } else if (needsRatingHint) {
            setGuideTarget('ratings');
        } else if (needsHomeHint) {
            setGuideTarget('home');
        } else {
            // Сбрасываем, если пользователь прошел все этапы обучения
            setGuideTarget(null);
        }
    }, [user, location, navigate, setGuideTarget]);

    if (loading) return <div>Загрузка...</div>;
    if (error) return <div style={{ color: "red" }}>Ошибка: {error}</div>;

    return (
        <Routes>
            <Route path="/" element={<Main user={user} setUser={setUser} />} />
            <Route path="/trainings" element={<TrainingRoomCard user={user} setUser={setUser} />} />
            <Route path="/blitz" element={<TournamentCard user={user} setUser={setUser} />} />
            <Route path="/rating" element={<RatingCard user={user} setUser={setUser} />} />
            <Route path="/shop" element={<ShopCard user={user} setUser={setUser} />} />
            <Route path="/transfer" element={<TransferCard user={user} setUser={setUser} />} />
            <Route path="/match" element={<MatchCard user={user} setUser={setUser} />} />
            <Route path="/education_centre" element={<EducationCard user={user} setUser={setUser} />} />
        </Routes>
    );
}

export default AppContent;