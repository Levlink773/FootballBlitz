import React, { useEffect, useState } from 'react';
import { ModalRoot, Box as ModalBox } from "../modal_components/ModalComponents.jsx";
import styles from '../../css_files/main_css/InventoryModal.module.css'; // Використаємо стилі інвентаря, вони підходять
import { API_BASE_URL } from '../../api.js';

// Константи (ті самі, що і в InventoryModal)
const POWER_MUL = 20;
const TALENT_MUL = 60;
const AGE_MUL = 15;

// Компонент рядка статистики (перевикористовуємо)
const StatRow = ({ label, value, icon, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px' }}>
        <span style={{ fontSize: '24px' }}>{icon}</span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '12px', color: '#aaa', textTransform: 'uppercase' }}>{label}</span>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: color }}>{value}</span>
        </div>
    </div>
);

export const AnalyticsModal = ({ user, onClose }) => {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Завантажуємо персонажів для розрахунку
        const fetchStats = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/users/${user.user_id}/all`);
                if (res.ok) {
                    const chars = await res.json();
                    calculate(chars);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, [user.user_id]);

    const calculate = (chars) => {
        if (!chars || chars.length === 0) return;
        let totalAge = 0, totalTalent = 0, totalPower = 0, totalPrice = 0;
        chars.forEach(c => {
            totalAge += c.age; totalTalent += c.talent; totalPower += c.power;
            const price = (c.power * POWER_MUL) + (c.talent * TALENT_MUL) - (c.age * AGE_MUL);
            totalPrice += Math.max(0, price);
        });
        setStats({
            avgAge: (totalAge / chars.length).toFixed(1),
            avgTalent: (totalTalent / chars.length).toFixed(1),
            totalPower: Math.round(totalPower),
            totalPrice: Math.round(totalPrice)
        });
    };

    return (
        <ModalRoot onClose={onClose}>
            <ModalBox onClose={onClose}>
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    <h2 style={{ color: '#fff', marginBottom: '20px', textTransform: 'uppercase' }}>📊 Аналітика Клубу</h2>

                    {isLoading ? (
                        <div style={{color: '#aaa'}}>Завантаження даних...</div>
                    ) : stats ? (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr', // На весь екран у стовпчик для мобілок
                            gap: '15px',
                        }}>
                            <StatRow label="Загальна Сила" value={stats.totalPower} icon="💪" color="#FFD700" />
                            <StatRow label="Вартість Складу" value={`$${(stats.totalPrice / 1000).toFixed(1)}k`} icon="💰" color="#4CAF50" />
                            <StatRow label="Середній Вік" value={stats.avgAge} icon="🎂" color="#2196F3" />
                            <StatRow label="Середній Талант" value={stats.avgTalent} icon="🌟" color="#E91E63" />
                        </div>
                    ) : (
                        <div>Немає даних про гравців</div>
                    )}

                    <div style={{ marginTop: '25px', fontSize: '12px', color: '#666' }}>
                        * Дані оновлюються в реальному часі на основі вашого складу.
                    </div>
                </div>
            </ModalBox>
        </ModalRoot>
    );
};