import React, { useContext, useState, useEffect } from 'react';
import api from '../api';
import { AuthContext } from '../contexts/AuthContext';
import { LanguageContext } from '../contexts/LanguageContext';

const Dashboard = () => {
    const { user, initAuth } = useContext(AuthContext);
    const { t } = useContext(LanguageContext);

    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Checking in state logic can be added here
    }, []);

    const handleSetDefaultSite = async (siteOption) => {
        try {
            await api.put('/users/me/site', null, { params: { site: siteOption } });
            await initAuth(); // Refresh user object in context so default_site is populated
        } catch (err) {
            setError('Failed to save default site');
        }
    };

    const handleCheckIn = async () => {
        if (!user.default_site) return setError('No site selected');
        try {
            await api.post('/attendance/check-in', { site: user.default_site, status: 'WORKING' });
            setIsCheckedIn(true);
            setStatus(t('working'));
            setError('');
        } catch (err) {
            setError('Check-in failed');
        }
    };

    const handleStatusUpdate = async (newStatusText, rawStatus) => {
        try {
            await api.post('/attendance/update-status', { status: rawStatus });
            setStatus(newStatusText);
        } catch (err) {
            setError('Status update failed');
        }
    };

    const handleCheckOut = async () => {
        try {
            await api.post('/attendance/check-out');
            setIsCheckedIn(false);
            setStatus(t('i_left'));
        } catch (err) {
            setError('Checkout failed');
        }
    };

    // View 1: First time user - Needs to pick default site
    if (!user?.default_site) {
        return (
            <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
                <h2>{t('welcome_back')}, {user?.first_name}</h2>
                <h3 style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>{t('choose_default_site')}</h3>
                <p>{t('remember_site')}</p>

                {error && <div className="error-msg" style={{ maxWidth: '400px', margin: '1rem auto' }}>{error}</div>}

                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '3rem', flexWrap: 'wrap' }}>
                    <button onClick={() => handleSetDefaultSite('NORTH')} className="glass-card" style={{ cursor: 'pointer', flex: '1', minWidth: '250px', maxWidth: '300px', border: '2px solid var(--primary-color)' }}>
                        <h2>🏢 {t('north_site')}</h2>
                    </button>
                    <button onClick={() => handleSetDefaultSite('SOUTH')} className="glass-card" style={{ cursor: 'pointer', flex: '1', minWidth: '250px', maxWidth: '300px', border: '2px solid var(--warning)' }}>
                        <h2>🏭 {t('south_site')}</h2>
                    </button>
                </div>
            </div>
        );
    }

    // View 2: Regular User Dashboard - Check In / Out
    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <h2>{t('welcome_back')}, {user?.first_name}</h2>
            {error && <div className="error-msg">{error}</div>}

            <div className="glass-card" style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>{t('dashboard')}</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    {t('site')}: <strong style={{ color: 'var(--primary-color)' }}>{user.default_site === 'NORTH' ? t('north_site') : t('south_site')}</strong>
                </p>

                {/* Primary Action - Single Toggle */}
                <div style={{ marginBottom: '2rem' }}>
                    {!isCheckedIn ? (
                        <button 
                            className="btn btn-success" 
                            style={{ padding: '1.5rem', fontSize: '1.25rem', width: '100%' }} 
                            onClick={handleCheckIn}
                        >
                            ✅ {t('i_arrived')}
                        </button>
                    ) : (
                        <button 
                            className="btn btn-danger" 
                            style={{ padding: '1.5rem', fontSize: '1.25rem', width: '100%' }} 
                            onClick={handleCheckOut}
                        >
                            🚪 {t('i_left')}
                        </button>
                    )}
                </div>

                {/* Current Status */}
                <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem', textAlign: 'center' }}>
                        {t('current_status')}: <strong style={{ color: 'var(--primary-color)' }}>{status || t('unknown')}</strong>
                    </p>

                    <div className="status-grid" style={{ marginBottom: 0 }}>
                        {/* "In Protected Area" always visible */}
                        <button 
                            className="btn" 
                            style={{ 
                                background: status === t('in_protected_area') ? 'var(--warning)' : 'transparent',
                                color: status === t('in_protected_area') ? '#000' : 'var(--warning)',
                                border: '2px solid var(--warning)'
                            }} 
                            onClick={() => handleStatusUpdate(t('in_protected_area'), 'IN_PROTECTED_AREA')}
                        >
                            🛡️ {t('in_protected_area')}
                        </button>

                        {/* "Working" only when checked in */}
                        {isCheckedIn && (
                            <button 
                                className="btn" 
                                style={{ 
                                    background: status === t('working') ? 'var(--success)' : 'transparent',
                                    color: status === t('working') ? '#fff' : 'var(--success)',
                                    border: '2px solid var(--success)'
                                }} 
                                onClick={() => handleStatusUpdate(t('working'), 'WORKING')}
                            >
                                💼 {t('working')}
                            </button>
                        )}

                        {/* "At Home" and "On My Way" only when NOT checked in */}
                        {!isCheckedIn && (
                            <>
                                <button 
                                    className="btn" 
                                    style={{ 
                                        background: status === t('at_home') ? 'var(--primary-color)' : 'transparent',
                                        color: status === t('at_home') ? '#fff' : 'var(--primary-color)',
                                        border: '2px solid var(--primary-color)'
                                    }} 
                                    onClick={() => handleStatusUpdate(t('at_home'), 'AT_HOME')}
                                >
                                    🏠 {t('at_home')}
                                </button>
                                
                                <button 
                                    className="btn" 
                                    style={{ 
                                        background: status === t('on_my_way') ? 'var(--success)' : 'transparent',
                                        color: status === t('on_my_way') ? '#fff' : 'var(--success)',
                                        border: '2px solid var(--success)'
                                    }} 
                                    onClick={() => handleStatusUpdate(t('on_my_way'), 'ON_MY_WAY')}
                                >
                                    🚗 {t('on_my_way')}
                                </button>
                            </>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
