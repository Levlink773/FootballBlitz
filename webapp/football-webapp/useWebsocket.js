// src/hooks/useWebSocket.js
import { useEffect, useRef } from 'react';
import {showAlert} from "./src/alertService.jsx";

const useWebSocket = (userId) => {
    const ws = useRef(null);

    useEffect(() => {
        // Не встановлюємо з'єднання, якщо немає userId
        if (!userId) {
            return;
        }

        // URL вашого WebSocket сервера
        const wsUrl = `ws://localhost:8123/ws?user_id=${userId}`; // Замініть на ваш URL в продакшені
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
            console.log("WebSocket connected");
        };

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("Received message:", data);

                // Обробляємо подію, яку ми відправили з бота
                if (data.type === 'show_alert' && data.payload?.message) {
                    showAlert(data.payload.message, {html: data.payload.html}); // Викликаємо alert!
                }

                // Тут можна додати обробники для інших типів подій (data.type)
                // наприклад, оновлення балансу, завершення тренування тощо.

            } catch (error) {
                console.error("Failed to parse WebSocket message:", error);
            }
        };

        ws.current.onclose = () => {
            console.log("WebSocket disconnected");
            // Тут можна реалізувати логіку автоматичного перепідключення
        };

        ws.current.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        // Функція для очищення при розмонтуванні компонента
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [userId]); // Перестворюємо з'єднання, якщо змінився userId
};

export default useWebSocket;