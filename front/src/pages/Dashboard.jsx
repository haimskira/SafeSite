import React, { useContext, useState, useEffect } from 'react';
import api from '../api';
import { AuthContext } from '../contexts/AuthContext';
import { LanguageContext } from '../contexts/LanguageContext';
import CustomTimePicker from '../components/CustomTimePicker';

const Dashboard = () => {
    const { user, initAuth } = useContext(AuthContext);
    const { t } = useContext(LanguageContext);

    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');

    // Requests state
    const [reqDate, setReqDate] = useState('');
    const [reqStart, setReqStart] = useState('');
    const [reqEnd, setReqEnd] = useState('');
    const [myRequests, setMyRequests] = useState([]);

    useEffect(() => {
        fetchRequests();
        // Assuming status reset logic would be determined by backend active workers status 
        // For simplicity, we assume checked out state on fresh load unless built into the payload
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/requests/my');
            setMyRequests(res.data);
        } catch (err) {
            console.error(err);
        }
    };

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

    const submitRequest = async (e) => {
        e.preventDefault();
        if (!reqStart || !reqEnd) {
            setError(t('please_select_times') || 'Please select both start and end times');
            return;
        }
        try {
            await api.post('/requests/', { date: reqDate, start_time: reqStart + ":00", end_time: reqEnd + ":00" });
            fetchRequests();
            setReqDate(''); setReqStart(''); setReqEnd('');
            setError('');
        } catch (err) {
            setError('Request submission failed');
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
        <div className="container">
            <h2>{t('welcome_back')}, {user?.first_name}</h2>
            {error && <div className="error-msg">{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>

                {/* Attendance Card */}
                <div className="glass-card">
                    <h3 style={{ marginBottom: '0.5rem' }}>{t('dashboard')}</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        {t('site')}: <strong style={{ color: 'var(--primary-color)' }}>{user.default_site === 'NORTH' ? t('north_site') : t('south_site')}</strong>
                    </p>

                    {!isCheckedIn ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <button className="btn btn-success" style={{ padding: '1.5rem', fontSize: '1.25rem' }} onClick={handleCheckIn}>
                                ✅ {t('i_arrived')}
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>{t('current_status')}: <strong style={{ color: 'var(--primary-color)' }}>{status}</strong></p>

                            <div className="status-grid">
                                <button className="btn" style={{ background: 'var(--warning)', color: '#000' }} onClick={() => handleStatusUpdate(t('in_protected_area'), 'IN_PROTECTED_AREA')}>
                                    {t('in_protected_area')}
                                </button>
                                <button className="btn" style={{ background: 'var(--primary-color)' }} onClick={() => handleStatusUpdate(t('at_home'), 'AT_HOME')}>
                                    {t('at_home')}
                                </button>
                                <button className="btn" style={{ background: 'var(--primary-hover)' }} onClick={() => handleStatusUpdate(t('on_my_way'), 'ON_MY_WAY')}>
                                    {t('on_my_way')}
                                </button>
                            </div>

                            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
                                <button className="btn btn-danger" style={{ padding: '1rem', fontSize: '1.1rem' }} onClick={handleCheckOut}>
                                    🚪 {t('i_left')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Requests Card */}
                <div className="glass-card">
                    <h3>{t('submit_request')}</h3>
                    <form onSubmit={submitRequest}>
                        <div className="input-group">
                            <label className="input-label">{t('date')}</label>
                            <input type="date" className="input-field" value={reqDate} onChange={e => setReqDate(e.target.value)} required />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <CustomTimePicker
                                label={t('start_time')}
                                value={reqStart}
                                onChange={setReqStart}
                            />
                            <CustomTimePicker
                                label={t('end_time')}
                                value={reqEnd}
                                onChange={setReqEnd}
                            />
                        </div>
                        <button type="submit" className="btn">{t('submit_request')}</button>
                    </form>

                    <h4 style={{ marginTop: '2rem' }}>{t('my_requests')}</h4>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {myRequests.map(r => (
                            <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', marginBottom: '0.5rem', borderRadius: '8px' }}>
                                <span>{r.date} ({r.start_time} - {r.end_time})</span>
                                <span className={`badge ${r.status === 'APPROVED' ? 'badge-admin' : r.status === 'REJECTED' ? 'badge-out' : 'badge-user'}`}>
                                    {r.status}
                                </span>
                            </li>
                        ))}
                        {myRequests.length === 0 && <p>{t('no_requests')}</p>}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
