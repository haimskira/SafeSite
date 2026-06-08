import React, { useContext, useState, useEffect } from 'react';
import api from '../api';
import { AuthContext } from '../contexts/AuthContext';
import { LanguageContext } from '../contexts/LanguageContext';

const SITE_CARDS = [
    {
        key: 'NORTH',
        labelKey: 'north_site',
        icon: '🏢',
        color: 'var(--warning)',
        bgColor: 'rgba(245, 158, 11, 0.12)',
    },
    {
        key: 'SOUTH',
        labelKey: 'south_site',
        icon: '🏭',
        color: 'var(--success)',
        bgColor: 'rgba(16, 185, 129, 0.12)',
    },
    {
        key: 'HOME',
        labelKey: 'at_home',
        icon: '🏠',
        color: 'var(--primary-color)',
        bgColor: 'rgba(56, 189, 248, 0.12)',
    },
];

const SUB_STATUSES = [
    {
        status: 'IN_PROTECTED_AREA',
        labelKey: 'in_protected_area',
        icon: '🛡️',
        color: 'var(--success)',
        bgColor: 'rgba(16, 185, 129, 0.12)',
    },
    {
        status: 'ON_MY_WAY',
        labelKey: 'on_my_way',
        icon: '🚗',
        color: 'var(--warning)',
        bgColor: 'rgba(245, 158, 11, 0.12)',
    },
];

const ON_SITE_STATUSES = ['WORKING', 'IN_PROTECTED_AREA', 'ON_MY_WAY'];

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const { t } = useContext(LanguageContext);

    const [currentSite, setCurrentSite] = useState(null);    // 'NORTH' | 'SOUTH' | null
    const [currentStatus, setCurrentStatus] = useState(null); // status string
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await api.get('/attendance/my-status');
                const log = res.data;
                if (log?.status) setCurrentStatus(log.status);
                if (log?.site) {
                    setCurrentSite(log.site);
                } else {
                    // Latest log is a status update — restore site from localStorage
                    const saved = localStorage.getItem('safesite_current_site');
                    if (saved && log?.status && ON_SITE_STATUSES.includes(log.status)) {
                        setCurrentSite(saved);
                    }
                }
            } catch {
                // no record yet
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    const handleSiteSelect = async (card) => {
        if (updating) return;
        setUpdating(true);
        setError('');
        try {
            if (card.key === 'HOME') {
                await api.post('/attendance/update-status', { status: 'AT_HOME' });
                setCurrentStatus('AT_HOME');
                setCurrentSite(null);
                localStorage.removeItem('safesite_current_site');
            } else {
                await api.post('/attendance/check-in', { site: card.key, status: 'WORKING' });
                setCurrentStatus('WORKING');
                setCurrentSite(card.key);
                localStorage.setItem('safesite_current_site', card.key);
            }
        } catch {
            setError('Failed to update status');
        } finally {
            setUpdating(false);
        }
    };

    const handleSubStatus = async (sub) => {
        if (updating) return;
        setUpdating(true);
        setError('');
        try {
            await api.post('/attendance/update-status', { status: sub.status });
            setCurrentStatus(sub.status);
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

    const isOnSite = currentSite === 'NORTH' || currentSite === 'SOUTH';
    const activeSiteCard = SITE_CARDS.find(c => c.key === currentSite) || null;
    const activeSubStatus = SUB_STATUSES.find(s => s.status === currentStatus) || null;

    return (
        <div className="container dashboard-home">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ marginBottom: '0.4rem' }}>{t('welcome_back')}, {user?.first_name}</h2>
            </div>

            {error && <div className="error-msg">{error}</div>}

            {/* ── Location cards ── */}
            <div className="location-grid">
                {SITE_CARDS.map(card => {
                    const selected =
                        card.key === 'HOME'
                            ? currentStatus === 'AT_HOME'
                            : currentSite === card.key;
                    return (
                        <button
                            key={card.key}
                            onClick={() => handleSiteSelect(card)}
                            disabled={updating}
                            className="location-card"
                            style={{
                                background: selected ? card.bgColor : 'var(--card-bg)',
                                border: selected
                                    ? `2px solid ${card.color}`
                                    : '1px solid var(--border-color)',
                                boxShadow: selected
                                    ? `0 0 24px ${card.bgColor}`
                                    : 'var(--shadow-md)',
                                opacity: updating && !selected ? 0.55 : 1,
                            }}
                        >
                            <span className="location-icon">{card.icon}</span>
                            <span
                                className="location-label"
                                style={{ color: selected ? card.color : 'var(--text-main)' }}
                            >
                                {t(card.labelKey)}
                            </span>
                            {selected && (
                                <span className="location-dot" style={{ background: card.color }} />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Sub-status (appears only when on a site) ── */}
            {isOnSite && (
                <div className="sub-status-section">
                    <p className="sub-status-title" style={{ color: activeSiteCard?.color }}>
                        {activeSiteCard?.icon} {t(activeSiteCard?.labelKey)} —{' '}
                        <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                            {t('current_status')}
                        </span>
                    </p>
                    <div className="sub-status-grid">
                        {SUB_STATUSES.map(sub => {
                            const selected = currentStatus === sub.status;
                            return (
                                <button
                                    key={sub.status}
                                    onClick={() => handleSubStatus(sub)}
                                    disabled={updating}
                                    className="sub-status-card"
                                    style={{
                                        background: selected ? sub.bgColor : 'var(--card-bg)',
                                        border: selected
                                            ? `2px solid ${sub.color}`
                                            : '1px solid var(--border-color)',
                                        opacity: updating && !selected ? 0.55 : 1,
                                        color: selected ? sub.color : 'var(--text-muted)',
                                    }}
                                >
                                    <span style={{ fontSize: '1.5rem' }}>{sub.icon}</span>
                                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                                        {t(sub.labelKey)}
                                    </span>
                                    {selected && (
                                        <span
                                            style={{
                                                width: '7px',
                                                height: '7px',
                                                borderRadius: '50%',
                                                background: sub.color,
                                                display: 'inline-block',
                                                animation: 'pulse 1.5s infinite',
                                            }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
