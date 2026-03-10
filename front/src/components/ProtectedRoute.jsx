import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div>Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Force user to profile page if password reset is required
    if (user.force_password_change === 1 && window.location.pathname !== '/profile') {
        return <Navigate to="/profile" replace />;
    }

    return children;
};

export default ProtectedRoute;
