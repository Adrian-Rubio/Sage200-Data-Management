import axios from 'axios';

const API_URL = 'http://192.168.0.70:8000/api';

export const fetchFilterOptions = async () => {
    try {
        const response = await axios.get(`${API_URL}/filters/options`);
        return response.data;
    } catch (error) {
        console.error("Error fetching filter options:", error);
        return { companies: [], reps: [], clients: [], series: [] };
    }
};

export const fetchSalesDashboard = async (filters) => {
    try {
        const response = await axios.post(`${API_URL}/sales/dashboard`, filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching sales dashboard:", error);
        throw error;
    }
};

export const fetchSalesComparison = async (filters) => {
    try {
        const response = await axios.post(`${API_URL}/sales/comparison`, filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching sales comparison:", error);
        throw error;
    }
};

export const fetchPendingOrders = async (filters) => {
    try {
        const response = await axios.post(`${API_URL}/orders/pending`, filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching pending orders:", error);
        throw error;
    }
};
