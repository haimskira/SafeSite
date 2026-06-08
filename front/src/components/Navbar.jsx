import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { LanguageContext } from '../contexts/LanguageContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { lang, toggleLang, t } = useContext(LanguageContext);
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setMenuOpen(false);
    };

    const toggleTheme = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    return (
        <nav className="navbar" dir={lang === 'he' ? 'rtl' : 'ltr'}>
            <div className="navbar-brand">
                <Link to="/" style={{ color: 'var(--text-main)', textDecoration: 'none', fontSize: '1.25rem', fontWeight: 'bold' }}>
                    SafeSite
                </Link>
                <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
                    {menuOpen ? '✕' : '☰'}
                </button>
            </div>
            <div className={`nav-links${menuOpen ? ' nav-open' : ''}`}>
                {/* Language Toggle */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', borderInlineEnd: '1px solid var(--border-color)', paddingInlineEnd: '1rem' }}>
                    <button onClick={() => toggleLang('he')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, opacity: lang === 'he' ? 1 : 0.4, transition: 'opacity 0.2s' }}>
                        <img src="https://flagcdn.com/w40/il.png" alt="Hebrew" style={{ width: '24px', borderRadius: '4px', display: 'block' }} />
                    </button>
                    <button onClick={() => toggleLang('en')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, opacity: lang === 'en' ? 1 : 0.4, transition: 'opacity 0.2s' }}>
                        <img src="https://flagcdn.com/w40/us.png" alt="English" style={{ width: '24px', borderRadius: '4px', display: 'block' }} />
                    </button>
                </div>

                <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'grayscale(0.2)' }} title="Toggle Theme">
                    🌓
                </button>

                {user && (
                    <>
                        <Link to="/" className="nav-link" onClick={() => setMenuOpen(false)}>{t('dashboard')}</Link>
                        <Link to="/requests" className="nav-link" onClick={() => setMenuOpen(false)}>{t('my_requests') || 'Arrival Requests'}</Link>
                        {user.role === 'ADMIN' && (
                            <>
                                <Link to="/admin" className="nav-link" onClick={() => setMenuOpen(false)}>{t('admin_panel')}</Link>
                                <Link to="/admin/analytics" className="nav-link" onClick={() => setMenuOpen(false)}>{t('analytics')}</Link>
                            </>
                        )}
                        <Link to="/profile" className="nav-link" onClick={() => setMenuOpen(false)}>{t('profile')}</Link>
                        <span style={{ color: 'var(--text-muted)' }} className="user-greeting">{t('hello')}, {user.first_name}</span>
                        <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '0.5rem 1rem', width: 'auto' }}>{t('logout')}</button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
