import React from 'react';
import { createRoot } from 'react-dom/client';
import {AlertModal, ModalRoot} from "./components/modal_components/ModalComponents.jsx";
/**
 * Показує глобальний Alert, динамічно створюючи та знищуючи його в DOM.
 * @param {string | React.ReactNode} message - Повідомлення для показу.
 * @param {object} options - Додаткові пропси для AlertModal (напр., { autoCloseMs: 3000, html: true }).
 */
export function showAlert(message, options = {}) {
    // 1. Знаходимо головний контейнер для модальних вікон.
    const targetContainer = document.querySelector('[data-modal-root]');
    if (!targetContainer) {
        console.error('Контейнер [data-modal-root] не знайдено в DOM.');
        return;
    }

    // 2. Створюємо тимчасовий DOM-елемент, куди будемо рендерити наш алерт.
    const alertHost = document.createElement('div');
    targetContainer.appendChild(alertHost);

    // 3. Створюємо новий React root на цьому елементі.
    const root = createRoot(alertHost);

    // 4. Визначаємо функцію очищення. Це найважливіша частина!
    const cleanup = () => {
        // Розмонтовуємо React-компонент
        root.unmount();
        // Видаляємо тимчасовий DOM-елемент
        if (targetContainer.contains(alertHost)) {
            targetContainer.removeChild(alertHost);
        }
    };

    // 5. Збираємо всі пропси для AlertModal.
    // Функція cleanup буде викликана або по таймеру, або при кліку на "хрестик".
    const alertProps = {
        message,
        onClose: cleanup,
        autoCloseMs: 5000, // ✨ Стандартний час закриття - 5 секунд
        ...options, // Користувацькі опції можуть це перезаписати
    };

    // 6. Рендеримо компонент.
    // Ми огортаємо AlertModal в ModalRoot, щоб зберегти логіку позиціонування та анімації.
    root.render(
        <ModalRoot
            onClose={cleanup}
            variant="alert"
            backdrop={false} // Для алертів зазвичай не потрібен фон
            animation={true}
        >
            <AlertModal {...alertProps} />
        </ModalRoot>
    );
}