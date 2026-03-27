import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ProtectedRoute = ({ allowedRoles }) => {
    const { isAuthenticated, hasRole } = useAuthStore();

    if (!isAuthenticated) {
        // Not logged in, redirect to login page
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        // Check if user has any of the allowed roles
        const hasRequiredRole = allowedRoles.some((role) => hasRole(role));
        
        if (!hasRequiredRole) {
            // Logged in but doesn't have required role, maybe redirect to a generic page or dashboard
            return <Navigate to="/dashboard" replace />; 
        }
    }

    // Wrap child routes in an Outlet
    return <Outlet />;
};

export default ProtectedRoute;
