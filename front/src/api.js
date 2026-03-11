import axios from 'axios';

// Using relative path handles both Docker (via nginx proxy) and local dev (via Vite proxy)
const apiURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
    baseURL: apiURL,
});

// Request interceptor to add the JWT token to headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
