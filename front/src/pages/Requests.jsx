import React, { useContext, useState, useEffect } from 'react';
import api from '../api';
import { AuthContext } from '../contexts/AuthContext';
import { LanguageContext } from '../contexts/LanguageContext';
import CustomTimePicker from '../components/CustomTimePicker';

const Requests = () => {
    const { user } = useContext(AuthContext);
    const { t } = useContext(LanguageContext);
    const [error, setError] = useState('');

    const [reqDate, setReqDate] = useState('');
    const [reqStart, setReqStart] = useState('');
    const [reqEnd, setReqEnd] = useState('');
    const [myRequests, setMyRequests] = useState([]);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await api.get('/requests/my');
            setMyRequests(res.data);
        } catch (err) {
            console.error(err);
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

    return (
        <div className="container">
            <h2>{t('my_requests')}</h2>
            {error && <div className="error-msg">{error}</div>}

            <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
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
    );
};

export default Requests;
