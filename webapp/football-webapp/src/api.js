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
/**
 * Відправляє запит на купівлю гравця з трансферного ринку.
 * @param {number} transferId - ID трансферу.
 * @param {number} buyerUserId - ID користувача, який купує.
 * @returns {Promise<any>} - Результат відповіді сервера.
 */
export const buyPlayerFromTransfer = async (transferId, buyerUserId) => {
    const response = await fetch(`http://localhost:8123/transfers/${transferId}/buy`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ buyer_user_id: buyerUserId }),
    });

    const data = await response.json();

    if (!response.ok) {
        // Викидаємо помилку з повідомленням від бекенда
        throw new Error(data.detail || 'Не вдалося купити гравця.');
    }

    return data;
};

/**
 * A helper function to parse price strings like "999,99 грн" into an integer number of cents/kopecks.
 * @param {string} priceString - The price string to parse.
 * @returns {number} The price in the smallest currency unit (e.g., kopecks).
 */
const parsePrice = (priceString) => {
    if (typeof priceString !== 'string') return priceString;
    const numberString = priceString.replace(/[^\d,]/g, '').replace(',', '.');
    return Math.round(parseFloat(numberString));
};

/**
 * A generic function to make a payment request to the backend.
 * @param {string} endpoint - The API endpoint (e.g., '/payments/vip').
 * @param {object} payload - The data to send in the request body.
 * @returns {Promise<object>} The JSON response from the server.
 */
const createPaymentRequest = async (endpoint, payload) => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Network response was not ok');
        }

        return await response.json();
    } catch (error) {
        console.error(`Error creating payment for ${endpoint}:`, error);
        throw error; // Re-throw the error to be caught by the component
    }
};

// This URL should be configured properly for your environment
const WEBHOOK_URL = "https://your-domain.com/api/v1/monobank/webhook";

// --- Specific API Functions ---

export const api = {
    /**
     * Creates a payment for a VIP Pass.
     * @param {object} data - { userId, price, type }
     */
    createVipPayment: (data) => {
        const payload = {
            user_id: data.userId,
            price: parsePrice(data.price), // Convert "999,99 грн" to 99999
            name_product: "VIP Підписка",
            webhook_url: WEBHOOK_URL,
        };
        return createPaymentRequest('/payments/vip', payload);
    },

    /**
     * Creates a payment for a Coin Pack.
     * @param {object} data - { userId, pack }
     */
    createCoinPayment: (data) => {
        const payload = {
            user_id: data.userId,
            price: data.pack.price, // Assuming price is already an integer
            name_product: `Монети ${data.pack.label}`,
            webhook_url: WEBHOOK_URL,
            count_money: parseInt(data.pack.label.replace('x', '')),
        };
        return createPaymentRequest('/payments/money', payload);
    },

    /**
     * Creates a payment for an Energy Pack.
     * @param {object} data - { userId, pack }
     */
    createEnergyPayment: (data) => {
        const payload = {
            user_id: data.userId,
            price: data.pack.price,
            name_product: `Енергія ${data.pack.label}`,
            webhook_url: WEBHOOK_URL,
            amount_energy: parseInt(data.pack.label.replace('x', '')),
        };
        return createPaymentRequest('/payments/energy', payload);
    },

    /**
     * Creates a payment for a Box.
     * @param {object} data - { userId, box }
     */
    createBoxPayment: (data) => {
        const payload = {
            user_id: data.userId,
            price: parsePrice(data.box.discountedPrice), // Convert "75 грн" to 7500
            name_product: data.box.title,
            webhook_url: WEBHOOK_URL,
            type_box: data.box.id,
        };
        return createPaymentRequest('/payments/box', payload);
    },
};