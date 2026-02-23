import { create } from 'zustand';
import { getCurrentUser, login, logout, getToken } from '../services/auth';

const useAuthStore = create((set) => ({
    user: getCurrentUser(),
    token: getToken(),
    isAuthenticated: !!getToken(),
    error: null,

    loginUser: async (username, password) => {
        try {
            const user = await login(username, password);
            set({ user, token: getToken(), isAuthenticated: true, error: null });
        } catch (err) {
            set({ error: err.response?.data?.detail || 'Error logging in' });
        }
    },

    logoutUser: () => {
        logout();
        set({ user: null, token: null, isAuthenticated: false, error: null });
    }
}));

export default useAuthStore;
