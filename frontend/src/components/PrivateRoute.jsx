import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import MainLayout from './MainLayout';
import ForcePasswordChange from './ForcePasswordChange';

const PrivateRoute = () => {
    const { isAuthenticated, user } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.must_change_password) {
        return <ForcePasswordChange />;
    }

    return (
        <MainLayout>
            <Outlet />
        </MainLayout>
    );
};

export default PrivateRoute;
