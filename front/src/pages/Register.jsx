import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LanguageContext } from '../contexts/LanguageContext';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        department: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { register } = useContext(AuthContext);
    const { t } = useContext(LanguageContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(formData);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed');
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
            <div className="glass-card" style={{ maxWidth: '450px', width: '100%' }}>
                <h2>{t('register')}</h2>
                {error && <div className="error-msg">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">{t('username')} *</label>
                        <input className="input-field" type="text" name="username" value={formData.username} onChange={handleChange} required />
                    </div>
                    <div className="input-group" style={{ position: 'relative' }}>
                        <label className="input-label">{t('password')} *</label>
                        <input className="input-field" type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} required style={{ paddingRight: '2.5rem' }} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.75rem', top: '2.25rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}>
                            {showPassword ? '👁️' : '👁️‍🗨️'}
                        </button>
                    </div>
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
                    <button type="submit" className="btn">{t('sign_up')}</button>
                </form>
                <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                    {t('has_account')} <Link to="/login" style={{ color: 'var(--primary-color)' }}>{t('login')}</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
