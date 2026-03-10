import React, { useState, useRef, useEffect } from 'react';

const CustomTimePicker = ({ value, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = ['00', '15', '30', '45'];

    const [selHour, selMin] = value ? value.split(':') : ['09', '00'];

    const handleHourSelect = (h) => {
        onChange(`${h}:${selMin}`);
    };

    const handleMinSelect = (m) => {
        onChange(`${selHour}:${m}`);
        setIsOpen(false);
    };

    return (
        <div className="input-group" style={{ position: 'relative', flex: 1, marginBottom: 0 }} ref={containerRef}>
            <label className="input-label">{label}</label>
            <div
                className="input-field"
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{value || '--:--'}</span>
                <span>🕒</span>
            </div>

            {isOpen && (
                <div className="glass-card" style={{
                    position: 'absolute', top: '100%', left: 0, minWidth: '200px', zIndex: 100,
                    padding: '1rem', marginTop: '0.5rem', display: 'flex', gap: '1rem',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ flex: 1, maxHeight: '200px', overflowY: 'auto', paddingRight: '0.5rem' }} className="custom-scrollbar">
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textAlign: 'center' }}>H</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {hours.map(h => (
                                <div
                                    key={h}
                                    className={`time-item ${selHour === h ? 'selected' : ''}`}
                                    onClick={() => handleHourSelect(h)}
                                >
                                    {h}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ width: '1px', background: 'var(--border-color)' }}></div>

                    <div style={{ flex: 1, paddingLeft: '0.5rem' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textAlign: 'center' }}>M</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {minutes.map(m => (
                                <div
                                    key={m}
                                    className={`time-item ${selMin === m ? 'selected' : ''}`}
                                    onClick={() => handleMinSelect(m)}
                                >
                                    {m}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomTimePicker;
