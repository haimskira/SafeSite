import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { LanguageContext } from '../contexts/LanguageContext';

const AdminDashboard = () => {
    const { t } = useContext(LanguageContext);
    const [activeWorkers, setActiveWorkers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [requests, setRequests] = useState([]);
    const [users, setUsers] = useState([]);
    const [latestStatus, setLatestStatus] = useState([]);
    const [filterDate, setFilterDate] = useState('');
    const [filterSite, setFilterSite] = useState('');

    const fetchData = async () => {
        try {
            const workersRes = await api.get('/attendance/active');
            setActiveWorkers(workersRes.data);

            const logsRes = await api.get('/attendance/logs', {
                params: {
                    filter_date: filterDate || undefined,
                    site: filterSite || undefined,
                }
            });
            setLogs(logsRes.data);

            const reqRes = await api.get('/requests/all?status=PENDING');
            setRequests(reqRes.data);

            const usersRes = await api.get('/users/');
            setUsers(usersRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filterDate, filterSite]);

    const fetchLatestStatus = async () => {
        try {
            const res = await api.get('/attendance/latest-status');
            setLatestStatus(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchLatestStatus();
        const interval = setInterval(fetchLatestStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let ws;
        let reconnectTimer;
        let reconnectDelay = 1000;
        let isMounted = true;

        const connect = () => {
            // Use the same origin (proxied by Vite in dev, Nginx in prod)
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            // Important: we proxy `/ws` via nginx/vite to `ws://backend:8080/ws`
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            
            ws = new WebSocket(wsUrl);

            ws.onmessage = (event) => {
                if (event.data === "refresh") {
                    console.log("WebSocket refresh signal received. Fetching new data...");
                    fetchData();
                    fetchLatestStatus();
                }
            };

            ws.onopen = () => {
                console.log("WebSocket connected for real-time updates");
                reconnectDelay = 1000; // Reset delay on successful connection
            };
            ws.onerror = (error) => console.error("WebSocket error:", error);
            ws.onclose = () => {
                console.log("WebSocket disconnected");
                if (isMounted) {
                    reconnectTimer = setTimeout(() => {
                        console.log(`Reconnecting WebSocket in ${reconnectDelay / 1000}s...`);
                        connect();
                        reconnectDelay = Math.min(reconnectDelay * 2, 30000);
                    }, reconnectDelay);
                }
            };
        };

        connect();

        return () => {
            isMounted = false;
            clearTimeout(reconnectTimer);
            if (ws) ws.close();
        };
    }, []); // Only run once on mount

    const handleRequestStatus = async (id, status) => {
        try {
            await api.put(`/requests/${id}/status`, null, { params: { status } });
            fetchData();
        } catch (err) {
            console.error("Failed to update request status");
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await api.put(`/users/${userId}/role`, null, { params: { role: newRole } });
            fetchData();
        } catch (err) {
            console.error("Failed to change user role");
        }
    };

    const handlePasswordReset = async (userId) => {
        if (window.confirm("Are you sure you want to reset this user's password? The new password will be SafeSite2026")) {
            try {
                await api.put(`/users/${userId}/reset-password`);
                alert("Password reset successfully!");
            } catch (err) {
                console.error("Failed to reset password");
                alert("Failed to reset password");
            }
        }
    };

    const handleDeleteUser = async (userId, username) => {
        if (window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
            try {
                await api.delete(`/users/${userId}`);
                fetchData();
                fetchLatestStatus();
            } catch (err) {
                console.error("Failed to delete user");
                alert(err.response?.data?.detail || "Failed to delete user");
            }
        }
    };

    const onSiteCount = activeWorkers.length;
    // Approximation based on total known users vs active workers
    const offSiteCount = Math.max(0, users.length - onSiteCount);

    const onNorthSiteCount = activeWorkers.filter(w => w.site === 'NORTH').length;
    const onSouthSiteCount = activeWorkers.filter(w => w.site === 'SOUTH').length;

    const renderStatusBadge = (status) => {
        if (!status) return null;
        const s = status.toUpperCase();
        let badgeClass = 'badge-user';
        if (s === 'WORKING') badgeClass = 'badge-working';
        else if (s === 'AT_HOME') badgeClass = 'badge-home';
        else if (s === 'ON_MY_WAY') badgeClass = 'badge-way';
        else if (s === 'CHECKED_OUT') badgeClass = 'badge-out';
        else if (s === 'IN_PROTECTED_AREA') badgeClass = 'badge-protected';

        // we use t(status.toLowerCase()) directly so it matches the keys in LanguageContext
        return <span className={`badge ${badgeClass}`}>{t(status.toLowerCase())}</span>;
    };

    const renderSiteOrStatusBadge = (log) => {
        if (log.action_type === 'CHECK_IN' && log.site) {
            const siteKey = log.site === 'NORTH' ? 'north_site' : log.site === 'SOUTH' ? 'south_site' : log.site;
            return <span className="badge badge-site">{t(siteKey.toLowerCase())}</span>;
        }
        if (log.status) {
            return renderStatusBadge(log.status);
        }
        return 'N/A';
    };

    return (
        <div className="container">
            <h2>{t('admin_dashboard')}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
                <div className="glass-card" style={{ textAlign: 'center', padding: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{t('total_headcount')}</h3>
                    <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>{users.length}</h2>
                </div>
                <div className="glass-card" style={{ textAlign: 'center', padding: '1rem', borderTop: '4px solid var(--success)' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{t('on_site')}</h3>
                    <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>{onSiteCount}</h2>
                </div>
                <div className="glass-card" style={{ textAlign: 'center', padding: '1rem', borderTop: '4px solid var(--info)' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{t('north_site')}</h3>
                    <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>{onNorthSiteCount}</h2>
                </div>
                <div className="glass-card" style={{ textAlign: 'center', padding: '1rem', borderTop: '4px solid var(--primary)' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{t('south_site')}</h3>
                    <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>{onSouthSiteCount}</h2>
                </div>
                <div className="glass-card" style={{ textAlign: 'center', padding: '1rem', borderTop: '4px solid var(--warning)' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{t('off_site')}</h3>
                    <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem' }}>{offSiteCount}</h2>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '2rem', marginTop: '2rem' }}>

                {/* Live User Status */}
                <div className="glass-card" style={{ border: '1px solid var(--primary-color)', boxShadow: '0 4px 24px rgba(56, 189, 248, 0.15)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                            Live User Status (Latest)
                        </h3>
                        <span className="badge badge-admin" style={{ fontSize: '0.7rem' }}>Updates every 3s</span>
                    </div>
                    <div className="table-container">
                        <table className="glass-table">
                            <thead>
                                <tr>
                                    <th>{t('user')}</th>
                                    <th>{t('department')}</th>
                                    <th>{t('site')}</th>
                                    <th>{t('status')}</th>
                                    <th>{t('time')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {latestStatus.map(log => (
                                    <tr key={`latest-${log.id}`}>
                                        <td>{log.user?.first_name} {log.user?.last_name}</td>
                                        <td>{log.user?.department || 'N/A'}</td>
                                        <td>{log.site === 'NORTH' ? t('north_site') : log.site === 'SOUTH' ? t('south_site') : log.site || 'N/A'}</td>
                                        <td>{renderSiteOrStatusBadge(log)}</td>
                                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {latestStatus.length === 0 && <tr><td colSpan="5">No data available.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Active Workers */}
                <div className="glass-card">
                    <h3>{t('active_workers')}</h3>
                    <div className="table-container">
                        <table className="glass-table">
                            <thead>
                                <tr>
                                    <th>{t('user')}</th>
                                    <th>{t('department')}</th>
                                    <th>{t('site')}</th>
                                    <th>{t('status')}</th>
                                    <th>{t('since')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeWorkers.map(log => (
                                    <tr key={log.id}>
                                        <td>{log.user?.first_name} {log.user?.last_name}</td>
                                        <td>{log.user?.department || 'N/A'}</td>
                                        <td>{log.site === 'NORTH' ? t('north_site') : log.site === 'SOUTH' ? t('south_site') : log.site}</td>
                                        <td>{renderStatusBadge(log.status)}</td>
                                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {activeWorkers.length === 0 && <tr><td colSpan="5">No active workers right now.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* User Management */}
                <div className="glass-card">
                    <h3>{t('manage_users')}</h3>
                    <div className="table-container">
                        <table className="glass-table">
                            <thead>
                                <tr>
                                    <th>{t('user')}</th>
                                    <th>{t('department')}</th>
                                    <th>{t('role')}</th>
                                    <th>{t('action')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td>{u.first_name} {u.last_name} ({u.username})</td>
                                        <td>{u.department || 'N/A'}</td>
                                        <td><span className={`badge ${u.role === 'ADMIN' ? 'badge-admin' : 'badge-user'}`}>{u.role}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                {u.role === 'USER' ? (
                                                    <button className="btn btn-success" style={{ padding: '0.25rem 0.5rem', width: 'auto' }} onClick={() => handleRoleChange(u.id, 'ADMIN')}>{t('make_admin')}</button>
                                                ) : (
                                                    <button className="btn" style={{ padding: '0.25rem 0.5rem', background: 'var(--warning)', color: '#000', width: 'auto' }} onClick={() => handleRoleChange(u.id, 'USER')}>{t('make_user')}</button>
                                                )}
                                                <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', width: 'auto' }} onClick={() => handlePasswordReset(u.id)}>{t('reset_password')}</button>
                                                <button className="btn" style={{ padding: '0.25rem 0.5rem', background: 'var(--danger)', width: 'auto' }} onClick={() => handleDeleteUser(u.id, u.username)}>{t('delete_user')}</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Requests */}
                <div className="glass-card">
                    <h3>{t('pending_requests')}</h3>
                    <div className="table-container">
                        <table className="glass-table">
                            <thead>
                                <tr>
                                    <th>{t('user')}</th>
                                    <th>{t('date')}</th>
                                    <th>{t('time')}</th>
                                    <th>{t('action')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(r => (
                                    <tr key={r.id}>
                                        <td>User ID: {r.user_id}</td>
                                        <td>{r.date}</td>
                                        <td>{r.start_time} - {r.end_time}</td>
                                        <td>
                                            <button className="btn btn-success" style={{ padding: '0.25rem 0.5rem', marginInlineEnd: '0.5rem' }} onClick={() => handleRequestStatus(r.id, 'APPROVED')}>{t('approve')}</button>
                                            <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => handleRequestStatus(r.id, 'REJECTED')}>{t('reject')}</button>
                                        </td>
                                    </tr>
                                ))}
                                {requests.length === 0 && <tr><td colSpan="4">{t('no_requests')}</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Attendance Logs */}
                <div className="glass-card">
                    <h3>{t('attendance_logs')}</h3>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <div className="input-group">
                            <label className="input-label">{t('filter_date')}</label>
                            <input type="date" className="input-field" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label className="input-label">{t('filter_site')}</label>
                            <select className="input-field" value={filterSite} onChange={e => setFilterSite(e.target.value)}>
                                <option value="">{t('all_sites')}</option>
                                <option value="NORTH">{t('north_site')}</option>
                                <option value="SOUTH">{t('south_site')}</option>
                            </select>
                        </div>
                    </div>
                    <div className="table-container">
                        <table className="glass-table">
                            <thead>
                                <tr>
                                    <th>{t('user')}</th>
                                    <th>{t('action')}</th>
                                    <th>{t('site')}/{t('status')}</th>
                                    <th>{t('time')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td>{log.user?.first_name} {log.user?.last_name}</td>
                                        <td>{log.action_type === 'CHECK_IN' ? t('i_arrived') : log.action_type === 'CHECK_OUT' ? t('i_left') : log.action_type === 'STATUS_UPDATE' ? t('current_status') : log.action_type}</td>
                                        <td>{renderSiteOrStatusBadge(log)}</td>
                                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {logs.length === 0 && <tr><td colSpan="4">No logs found.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;
