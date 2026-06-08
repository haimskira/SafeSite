import React, { useContext, useState, useEffect } from 'react';
import api from '../api';
import { AuthContext } from '../contexts/AuthContext';
import { LanguageContext } from '../contexts/LanguageContext';

const LOCATIONS = [
    {
        key: 'NORTH',
        status: 'IN_PROTECTED_AREA',
        labelKey: 'in_protected_area',
        icon: '🏢',
        color: 'var(--warning)',
        bgColor: 'rgba(245, 158, 11, 0.12)',
    },
    {
        key: 'SOUTH',
        status: 'ON_MY_WAY',
        labelKey: 'on_my_way',
        icon: '🏭',
        color: 'var(--success)',
        bgColor: 'rgba(16, 185, 129, 0.12)',
    },
    {
        key: 'HOME',
        status: 'AT_HOME',
        labelKey: 'at_home',
        icon: '🏠',
        color: 'var(--primary-color)',
        bgColor: 'rgba(56, 189, 248, 0.12)',
    },
];

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const { t } = useContext(LanguageContext);
    const [currentStatus, setCurrentStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await api.get('/attendance/my-status');
                if (res.data?.status) setCurrentStatus(res.data.status);
            } catch {
                // no record yet
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    const handleSelect = async (loc) => {
        if (updating) return;
        setUpdating(true);
        setError('');
        try {
            if (loc.key === 'HOME') {
                await api.post('/attendance/update-status', { status: 'AT_HOME' });
            } else {
                await api.post('/attendance/check-in', { site: loc.key, status: loc.status });
            }
            setCurrentStatus(loc.status);
        } catch {
            setError('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
                <h2>{t('loading')}</h2>
            </div>
        );
    }

    const active = LOCATIONS.find(l => l.status === currentStatus);

    return (
        <div className="container dashboard-home">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '0.4rem' }}>{t('welcome_back')}, {user?.first_name}</h2>
                {active && (
                    <p style={{ color: active.color, fontWeight: 600, fontSize: '1rem' }}>
                        {active.icon} {active.label || t(active.labelKey)}
                    </p>
                )}
            </div>

            {error && <div className="error-msg">{error}</div>}

            <div className="location-grid">
                {LOCATIONS.map(loc => {
                    const selected = currentStatus === loc.status;
                    return (
                        <button
                            key={loc.key}
                            onClick={() => handleSelect(loc)}
                            disabled={updating}
                            className="location-card"
                            style={{
                                background: selected ? loc.bgColor : 'var(--card-bg)',
                                border: selected
                                    ? `2px solid ${loc.color}`
                                    : '1px solid var(--border-color)',
                                boxShadow: selected
                                    ? `0 0 24px ${loc.bgColor}`
                                    : 'var(--shadow-md)',
                                opacity: updating && !selected ? 0.55 : 1,
                            }}
                        >
                            <span className="location-icon">{loc.icon}</span>
                            <span
                                className="location-label"
                                style={{ color: selected ? loc.color : 'var(--text-main)' }}
                            >
                                {t(loc.labelKey)}
                            </span>
                            {selected && (
                                <span
                                    className="location-dot"
                                    style={{ background: loc.color }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default Dashboard;
