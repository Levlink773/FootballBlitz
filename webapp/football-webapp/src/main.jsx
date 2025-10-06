import {createRoot} from 'react-dom/client'
import './index.css';
import {BrowserRouter} from "react-router-dom";
import AppContent from "./App.jsx";
import {GuideProvider} from "./components/register/context/GuideContext.jsx";

const originalLog = console.log;

console.log = (...args) => {
    // обычный лог в браузере
    originalLog(...args);

    // отправляем в Vite dev server
    if (import.meta.hot) {
        import.meta.hot.send("console", args);
    }
};

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <GuideProvider>
            <AppContent/>
        </GuideProvider>
    </BrowserRouter>,
)
