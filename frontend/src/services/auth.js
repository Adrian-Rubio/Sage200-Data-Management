import api from './api';
import { jwtDecode } from 'jwt-decode';

export const login = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await api.post('/auth/login', formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    const token = response.data.access_token;
    localStorage.setItem('token', token);
    return jwtDecode(token);
};

export const logout = () => {
    localStorage.removeItem('token');
};

export const getCurrentUser = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const decoded = jwtDecode(token);
        // Optional: check expiration
        if (decoded.exp * 1000 < Date.now()) {
            logout();
            return null;
        }
        return decoded;
    } catch {
        return null;
    }
};

export const getToken = () => localStorage.getItem('token');
