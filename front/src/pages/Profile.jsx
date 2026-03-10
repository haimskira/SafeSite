import React, { useState, useContext, useEffect } from 'react';
import api from '../api';
import { AuthContext } from '../contexts/AuthContext';
import { LanguageContext } from '../contexts/LanguageContext';

const Profile = () => {
    const { user, initAuth } = useContext(AuthContext);
    const { t } = useContext(LanguageContext);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        department: '',
        default_site: ''
    });
    const [msg, setMsg] = useState({ type: '', text: '' });

    const [pwdData, setPwdData] = useState({
        current_password: '',
        new_password: ''
    });
    const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                department: user.department || '',
                default_site: user.default_site || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put('/users/me', formData);
            await initAuth(); // Refresh global user object
            setMsg({ type: 'success', text: 'Profile updated successfully!' });
            setTimeout(() => setMsg({ type: '', text: '' }), 3000);
        } catch (err) {
            setMsg({ type: 'error', text: 'Failed to update profile.' });
        }
    };

    const handlePwdChange = (e) => {
        setPwdData({ ...pwdData, [e.target.name]: e.target.value });
    };

    const handlePwdSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.put('/users/me/password', pwdData);
            setPwdMsg({ type: 'success', text: 'Password updated successfully!' });
            setPwdData({ current_password: '', new_password: '' });
            setTimeout(() => setPwdMsg({ type: '', text: '' }), 3000);
        } catch (err) {
            setPwdMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to update password.' });
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
            <div className="glass-card" style={{ maxWidth: '450px', width: '100%' }}>
                <h2>{t('update_profile')}</h2>
                {msg.text && (
                    <div className={msg.type === 'error' ? 'error-msg' : 'success-msg'} style={{ color: msg.type === 'success' ? 'var(--success)' : 'inherit' }}>
                        {msg.text}
                    </div>
                )}
                <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
                    <div className="input-group">
                        <label className="input-label">{t('first_name')} *</label>
                        <input className="input-field" type="text" name="first_name" value={formData.first_name} onChange={handleChange} required />
                    </div>
                    <div className="input-group">
                        <label className="input-label">{t('last_name')} *</label>
                        <input className="input-field" type="text" name="last_name" value={formData.last_name} onChange={handleChange} required />
                    </div>
                    <div className="input-group">
                        <label className="input-label">{t('department')}</label>
                        <input className="input-field" type="text" name="department" value={formData.department} onChange={handleChange} />
                    </div>
                    <div className="input-group">
                        <label className="input-label">{t('choose_default_site')}</label>
                        <select className="input-field" name="default_site" value={formData.default_site} onChange={handleChange}>
                            <option value="">-- {t('select_site')} --</option>
                            <option value="NORTH">{t('north_site')}</option>
                            <option value="SOUTH">{t('south_site')}</option>
                        </select>
                    </div>
                    <button type="submit" className="btn" style={{ marginTop: '1rem' }}>{t('save_changes')}</button>
                </form>

                <h2 style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>{t('change_password')}</h2>
                {user?.force_password_change === 1 && (
                    <div className="error-msg" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                        {t('must_change_password')}
                    </div>
                )}
                {pwdMsg.text && (
                    <div className={pwdMsg.type === 'error' ? 'error-msg' : 'success-msg'} style={{ color: pwdMsg.type === 'success' ? 'var(--success)' : 'inherit', marginBottom: '1rem' }}>
                        {pwdMsg.text}
                    </div>
                )}
                <form onSubmit={handlePwdSubmit} style={{ marginTop: '1.5rem' }}>
                    <div className="input-group" style={{ position: 'relative' }}>
                        <label className="input-label">{t('current_password')} *</label>
                        <input className="input-field" type={showCurrentPassword ? "text" : "password"} name="current_password" value={pwdData.current_password} onChange={handlePwdChange} required style={{ paddingRight: '2.5rem' }} />
                        <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} style={{ position: 'absolute', right: '0.75rem', top: '2.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}>
                            {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>
                    <div className="input-group" style={{ position: 'relative' }}>
                        <label className="input-label">{t('new_password')} *</label>
                        <input className="input-field" type={showNewPassword ? "text" : "password"} name="new_password" value={pwdData.new_password} onChange={handlePwdChange} required style={{ paddingRight: '2.5rem' }} />
                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: '0.75rem', top: '2.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}>
                            {showNewPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>
                    <button type="submit" className="btn btn-danger" style={{ marginTop: '1rem' }}>{t('change_password')}</button>
                </form>
            </div>
        </div>
    );
};

export default Profile;
