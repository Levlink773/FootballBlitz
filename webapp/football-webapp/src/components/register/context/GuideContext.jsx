import React, { createContext, useState, useContext } from 'react';

// 1. Создаем контекст
const GuideContext = createContext(null);

// 2. Создаем провайдер, который будет "хранить" состояние
export const GuideProvider = ({ children }) => {
    const [guideTarget, setGuideTarget] = useState(null); // e.g., 'training', 'blitz', etc.

    return (
        <GuideContext.Provider value={{ guideTarget, setGuideTarget }}>
            {children}
        </GuideContext.Provider>
    );
};

// 3. Создаем кастомный хук для удобного доступа к контексту
export const useGuide = () => {
    const context = useContext(GuideContext);
    if (!context) {
        throw new Error('useGuide must be used within a GuideProvider');
    }
    return context;
};