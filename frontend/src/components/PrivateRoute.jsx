import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import ExecutiveLayout from './ExecutiveLayout';
import ForcePasswordChange from './ForcePasswordChange';

const PrivateRoute = () => {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.must_change_password) {
        return <ForcePasswordChange />;
    }

    const role = (user?.role_name || user?.role || '').toLowerCase();
    const isManagement = role.includes('admin') || role.includes('direcci') || role.includes('direccion');

    if (isManagement) {
        return (
            <ExecutiveLayout>
                <Outlet />
            </ExecutiveLayout>
        );
    }

    return <Outlet />;
};

export default PrivateRoute;
