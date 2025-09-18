// src/hooks/useWebSocket.js
import { useEffect, useRef } from 'react';
import { showAlert } from "./src/alertService.jsx";

/**
 * @param {string|null} userId
 * @param {{ onShowAlert?: (payload) => void }} options
 */
const useWebSocket = (userId, options = {}) => {
    const ws = useRef(null);
    const onShowAlertRef = useRef(options.onShowAlert);

    // Обновляем ref на каждый ререндер, не пересоздавая сокет
    useEffect(() => {
        onShowAlertRef.current = options.onShowAlert;
    }, [options.onShowAlert]);

    useEffect(() => {
        if (!userId) return;

        const wsUrl = `ws://localhost:8123/ws?user_id=${userId}`;
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log("WebSocket connected");
        };

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("Received message:", data);

                if (data.type === 'show_alert' && data.payload) {
                    // Если пользователь передал свою функцию — вызываем её.
                    if (typeof onShowAlertRef.current === 'function') {
                        try {
                            onShowAlertRef.current(data.payload);
                            showAlert(data.payload.message, { html: data.payload.html });
                        } catch (err) {
                            console.error('onShowAlert handler threw:', err);
                            // fallback к дефолтному алерту
                        }
                    } else {
                        // По умолчанию используем локальный showAlert
                        showAlert(data.payload.message, { html: data.payload.html });
                    }
                }

                // ...обработка других типов сообщений...
            } catch (error) {
                console.error("Failed to parse WebSocket message:", error);
            }
        };

        ws.current.onclose = () => {
            console.log("WebSocket disconnected");
        };

        ws.current.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [userId]); // сокет пересоздаётся только при изменении userId
};

export default useWebSocket;