import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initAuth();
    }, []);

    const initAuth = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    // Fetch fresh user data
                    const res = await api.get('/auth/me');
                    setUser(res.data);
                }
            } catch (err) {
                logout();
            }
        }
        setLoading(false);
    };

    const updateUser = async () => {
        try {
            const res = await api.get('/auth/me');
            setUser(res.data);
        } catch (err) {
            console.error("Failed to refresh user data:", err);
            // Optionally, log out if user data can't be fetched
            // logout();
        }
    };

    const login = async (username, password) => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const res = await api.post('/auth/login', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (res.data.access_token) {
            localStorage.setItem('token', res.data.access_token);
            const resUser = await api.get('/auth/me');
            setUser(resUser.data);
        }
    };

    const register = async (userData) => {
        await api.post('/auth/register', userData);
        // After successful registration, login automatically
        await login(userData.username, userData.password);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, initAuth }}>
            {children}
        </AuthContext.Provider>
    );
};
