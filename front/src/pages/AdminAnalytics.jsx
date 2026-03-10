import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { LanguageContext } from '../contexts/LanguageContext';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const AdminAnalytics = () => {
    const { t } = useContext(LanguageContext);
    
    // Default filter to today
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterSite, setFilterSite] = useState('');
    
    const [summary, setSummary] = useState({ total_visitors: 0, peak_hour: 'N/A', peak_count: 0 });
    const [chartData, setChartData] = useState([]);
    const [detailedLogs, setDetailedLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterDate) params.filter_date = filterDate;
            if (filterSite) params.site = filterSite;

            const res = await api.get('/attendance/analytics', { params });
            setSummary(res.data.summary);
            setChartData(res.data.chart_data);
            setDetailedLogs(res.data.detailed_logs);
        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [filterDate, filterSite]);

    // Helper to render beautiful colored badges for statuses/sites
    const renderBadge = (log) => {
        if (log.site) {
            return (
                <span className="badge badge-site">
                    {log.site === 'NORTH' ? t('north_site') : log.site === 'SOUTH' ? t('south_site') : log.site}
                </span>
            );
        }
        if (log.status) {
            if (log.status === 'in_protected_area') {
                return <span className="badge badge-protected">{t('in_protected_area')}</span>;
            }
            return (
                <span className="badge badge-status">
                    {t(log.status)}
                </span>
            );
        }
        return null;
    };

    // Helper for translating action types
    const renderActionType = (actionType) => {
        if (actionType === 'CHECK_IN') return t('i_arrived');
        if (actionType === 'CHECK_OUT') return t('i_left');
        if (actionType === 'STATUS_UPDATE') return t('current_status');
        return actionType;
    };

    return (
        <div className="dashboard-container admin-analytics" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <h1 className="dashboard-title">{t('analytics')}</h1>

            <div className="filters-container glass-card">
                <div className="input-group">
                    <label className="input-label">{t('filter_date')}</label>
                    <input 
                        type="date" 
                        value={filterDate} 
                        onChange={(e) => setFilterDate(e.target.value)} 
                        className="input-field"
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">{t('filter_site')}</label>
                    <select value={filterSite} onChange={(e) => setFilterSite(e.target.value)} className="input-field">
                        <option value="">{t('all_sites')}</option>
                        <option value="NORTH">{t('north_site')}</option>
                        <option value="SOUTH">{t('south_site')}</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">{t('loading')}</div>
            ) : (
                <>
                    <div className="stats-grid">
                        <div className="stat-card glass-card">
                            <h3>{t('total_distinct_visitors')}</h3>
                            <div className="stat-value">{summary.total_visitors}</div>
                        </div>
                        <div className="stat-card glass-card">
                            <h3>{t('peak_hour')}</h3>
                            <div className="stat-value">{summary.peak_hour}</div>
                        </div>
                        <div className="stat-card glass-card">
                            <h3>{t('peak_count')}</h3>
                            <div className="stat-value">{summary.peak_count}</div>
                        </div>
                    </div>

                    <div className="chart-container glass-card" style={{ marginTop: '20px', padding: '20px', height: '400px' }}>
                        <h2 className="section-title">{t('hourly_load')}</h2>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{
                                    top: 20, right: 30, left: 20, bottom: 5,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="hour" stroke="var(--text-color)" />
                                <YAxis stroke="var(--text-color)" allowDecimals={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--primary-color)', color: 'var(--text-color)' }}
                                    itemStyle={{ color: 'var(--primary-color)' }}
                                />
                                <Legend />
                                <Bar dataKey="count" name={t('visitors')} fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="table-container glass-card" style={{ marginTop: '20px' }}>
                        <h2 className="section-title">{t('detailed_flow')}</h2>
                        <div className="table-wrapper">
                            <table className="glass-table custom-analytics-table">
                                <thead>
                                    <tr>
                                        <th>{t('user')}</th>
                                        <th>{t('action')}</th>
                                        <th>{t('site')} / {t('status')}</th>
                                        <th>{t('time')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detailedLogs.map((log) => (
                                        <tr key={log.id} style={{ animation: 'slideIn 0.3s ease-out' }}>
                                            <td>{log.user_name}</td>
                                            <td>{renderActionType(log.action_type)}</td>
                                            <td>{renderBadge(log)}</td>
                                            <td>{new Date(log.timestamp).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {detailedLogs.length === 0 && (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center' }}>{t('no_requests')}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminAnalytics;
