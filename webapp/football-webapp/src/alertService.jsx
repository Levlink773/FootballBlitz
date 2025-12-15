import React from 'react';
import { createRoot } from 'react-dom/client';
import {AlertModal, InfoModal, ModalRoot, TopChancesAlert} from "./components/modal_components/ModalComponents.jsx";
/**
 * Показує глобальний Alert, динамічно створюючи та знищуючи його в DOM.
 * @param {string | React.ReactNode} message - Повідомлення для показу.
 * @param {object} options - Додаткові пропси для AlertModal (напр., { autoCloseMs: 3000, html: true }).
 */
export function showAlert(message, options = {}) {
    // 1. Знаходимо головний контейнер
    const targetContainer = document.querySelector('[data-modal-root]');
    if (!targetContainer) {
        console.error('Контейнер [data-modal-root] не знайдено в DOM.');
        return;
    }

    // 2. Створюємо тимчасовий DOM-елемент
    const alertHost = document.createElement('div');
    targetContainer.appendChild(alertHost);

    // 3. Створюємо React root
    const root = createRoot(alertHost);

    // 4. Функція очищення
    const cleanup = () => {
        root.unmount();
        if (targetContainer.contains(alertHost)) {
            targetContainer.removeChild(alertHost);
        }
    };

    // 5. 🔥 ЗМІНИ ТУТ:
    // Витягуємо 'sound' з опцій, щоб передати його в ModalRoot.
    // Решту опцій (...restOptions) залишаємо для AlertModal.
    const { sound, ...restOptions } = options;

    const alertProps = {
        message,
        onClose: cleanup,
        autoCloseMs: 5000,
        ...restOptions, // Передаємо решту опцій (наприклад, autoCloseMs)
    };

    // 6. Рендеримо компонент
    root.render(
        <ModalRoot
            onClose={cleanup}
            variant="alert"
            backdrop={false}
            animation={true}
            soundOnOpen={sound}
        >
            <AlertModal {...alertProps} />
        </ModalRoot>
    );
}

/* ---------- НОВАЯ ФУНКЦИЯ showTopChanceAlert ---------- */
export function showTopChanceAlert(payload, options = {}) {
    const targetContainer = document.querySelector('[data-modal-root]');
    if (!targetContainer) {
        console.error('Контейнер [data-modal-root] не знайдено в DOM.');
        return;
    }

    const alertHost = document.createElement('div');
    targetContainer.appendChild(alertHost);

    const root = createRoot(alertHost);

    const cleanup = () => {
        root.unmount();
        if (targetContainer.contains(alertHost)) {
            targetContainer.removeChild(alertHost);
        }
    };

    // Устанавливаем таймер на автоматическое закрытие
    const autoCloseMs = options.autoCloseMs || 7000; // По умолчанию 7 секунд
    setTimeout(cleanup, autoCloseMs);

    // 1. Трансформируем данные из payload в формат, который ожидает компонент
    const teamsData = [
        { name: payload.team1, chance: payload.chance_first_team_after },
        { name: payload.team2, chance: payload.chance_second_team_after }
    ];

    // 2. Рендерим компонент TopChancesAlert внутри ModalRoot для консистентности
    root.render(
        <ModalRoot
            onClose={cleanup}
            variant="alert"
            backdrop={false}
            animation={true}
        >
            <TopChancesAlert teams={teamsData} />
        </ModalRoot>
    );
}

/* ---------- НОВА ФУНКЦІЯ для виклику InfoModal ---------- */
/**
 * Показує глобальне інформаційне вікно з картинкою та текстом.
 * @param {object} options - Опції для модального вікна.
 * @param {string} [options.title] - Необов'язковий заголовок.
 * @param {string} options.image - URL картинки.
 * @param {string | React.ReactNode} options.text - Текст повідомлення.
 */
export function showInfoModal(options = {}) {
    // 1. Знаходимо головний контейнер
    const targetContainer = document.querySelector('[data-modal-root]');
    if (!targetContainer) {
        console.error('Контейнер [data-modal-root] не знайдено в DOM.');
        return;
    }

    // 2. Створюємо тимчасовий DOM-елемент
    const modalHost = document.createElement('div');
    targetContainer.appendChild(modalHost);

    // 3. Створюємо React root
    const root = createRoot(modalHost);

    // 4. Функція очищення
    const cleanup = () => {
        root.unmount();
        if (targetContainer.contains(modalHost)) {
            targetContainer.removeChild(modalHost);
        }
    };

    // 5. Збираємо пропси
    const modalProps = {
        onClose: cleanup,
        ...options,
    };

    // 6. Рендеримо компонент
    root.render(
        <ModalRoot
            onClose={cleanup}
            variant="center"
            backdrop={true}
            animation={true}
        >
            <InfoModal {...modalProps} />
        </ModalRoot>
    );
}

