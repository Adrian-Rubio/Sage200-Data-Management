import api from './api';

export const fetchSaraturDashboard = async (filters) => {
    try {
        const response = await api.post('/saratur/dashboard', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching Saratur dashboard:", error);
        throw error;
    }
};
