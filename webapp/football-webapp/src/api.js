// src/api.js

const API_BASE_URL = 'http://localhost:8123';

/**
 * Виставляє гравця на трансфер.
 * @param {number} characterId - ID персонажа.
 * @param {number} price - Ціна продажу.
 * @returns {Promise<object>} - Дані про створений трансфер.
 */
export const postPlayerToTransfer = async (characterId, price) => {
    const response = await fetch(`${API_BASE_URL}/transfers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            characters_id: characterId,
            price: price,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Не вдалося виставити гравця на трансфер');
    }

    return response.json();
};

/**
 * Знімає гравця з трансферу.
 * @param {number} transferId - ID запису в таблиці трансферів.
 * @returns {Promise<boolean>} - Успішність операції.
 */
export const removePlayerFromTransfer = async (transferId) => {
    const response = await fetch(`${API_BASE_URL}/transfers/${transferId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Не вдалося зняти гравця з трансферу');
    }

    // Статус 204 No Content не повертає тіло
    return response.status === 204;
};

/**
 * Моментально продає персонажа системі.
 * @param {number} characterId - ID персонажа.
 * @returns {Promise<object>} - Результат операції.
 */
export const instantSellPlayer = async (characterId) => {
    // Припускаємо, що ендпоінт знаходиться в роутері персонажів.
    // Якщо ні, змініть шлях на правильний, наприклад /transfers/instant_sell
    const response = await fetch(`${API_BASE_URL}/transfers/instant_sell`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            character_id: characterId,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '❌ Не вдалося моментально продати гравця');
    }

    return response.json();
};