import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LanguageContext } from '../contexts/LanguageContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { lang, toggleLang, t } = useContext(LanguageContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    return (
        <nav className="navbar" dir="ltr">
            <div>
                <Link to="/" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '1.25rem', fontWeight: 'bold' }}>
                    SafeSite
                </Link>
            </div>
            <div className="nav-links">
                {/* Language Toggle */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', borderRight: '1px solid var(--border-color)', paddingRight: '1rem' }}>
                    <button onClick={() => toggleLang('he')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, opacity: lang === 'he' ? 1 : 0.4, transition: 'opacity 0.2s' }}>
                        <img src="https://flagcdn.com/w40/il.png" alt="Hebrew" style={{ width: '24px', borderRadius: '4px', display: 'block' }} />
                    </button>
                    <button onClick={() => toggleLang('en')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, opacity: lang === 'en' ? 1 : 0.4, transition: 'opacity 0.2s' }}>
                        <img src="https://flagcdn.com/w40/us.png" alt="English" style={{ width: '24px', borderRadius: '4px', display: 'block' }} />
                    </button>
                </div>

                <button onClick={toggleTheme} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '0.2rem 0.6rem', fontSize: '1rem' }}>
                    🌓
                </button>

                {user && (
                    <>
                        <Link to="/" className="nav-link">{t('dashboard')}</Link>
                        {user.role === 'ADMIN' && (
                            <Link to="/admin" className="nav-link">{t('admin_panel')}</Link>
                        )}
                        <Link to="/profile" className="nav-link">{t('profile')}</Link>
                        <span style={{ color: 'var(--text-muted)' }} className="user-greeting">{t('hello')}, {user.first_name}</span>
                        <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '0.5rem 1rem', width: 'auto' }}>{t('logout')}</button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
