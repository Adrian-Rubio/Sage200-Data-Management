import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or unauthorized
            if (window.location.pathname !== '/login') {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

export const fetchFilterOptions = async () => {
    try {
        const response = await api.get('/filters/options');
        return response.data;
    } catch (error) {
        console.error("Error fetching filter options:", error);
        return { companies: [], reps: [], clients: [], series: [] };
    }
};

export const fetchSalesDashboard = async (filters) => {
    try {
        const response = await api.post('/sales/dashboard', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching sales dashboard:", error);
        throw error;
    }
};

export const fetchSalesComparison = async (filters) => {
    try {
        const response = await api.post('/sales/comparison', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching sales comparison:", error);
        throw error;
    }
};

export const fetchPendingOrders = async (filters) => {
    try {
        const response = await api.post('/orders/pending', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching pending orders:", error);
        throw error;
    }
};

export const fetchPendingPurchases = async (filters = {}) => {
    try {
        const response = await api.post('/purchases/pending', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching pending purchases:", error);
        throw error;
    }
};

export const fetchPurchasesDashboard = async (filters = {}) => {
    try {
        const response = await api.post('/purchases/dashboard', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching purchases dashboard:", error);
        throw error;
    }
};

export const fetchProductionOrders = async (filters = {}) => {
    try {
        const response = await api.post('/production/orders', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching production orders:", error);
        throw error;
    }
};

export const fetchProductionOperations = async (exercise, workNum) => {
    try {
        const response = await api.get(`/production/operations/${exercise}/${workNum}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching production operations:", error);
        return [];
    }
};

export const fetchUsers = async () => {
    try {
        const response = await api.get('/auth/users');
        return response.data;
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
};

export const createUser = async (userData) => {
    try {
        const response = await api.post('/auth/users', userData);
        return response.data;
    } catch (error) {
        console.error("Error creating user:", error);
        throw error;
    }
};

export const fetchRoles = async () => {
    try {
        const response = await api.get('/auth/roles');
        return response.data;
    } catch (error) {
        console.error("Error fetching roles:", error);
        throw error;
    }
};

export const createRole = async (roleData) => {
    try {
        const response = await api.post('/auth/roles', roleData);
        return response.data;
    } catch (error) {
        console.error("Error creating role:", error);
        throw error;
    }
};
export const updateUser = async (userId, userData) => {
    try {
        const response = await api.put(`/auth/users/${userId}`, userData);
        return response.data;
    } catch (error) {
        console.error("Error updating user:", error);
        throw error;
    }
};

export const deleteUser = async (userId) => {
    try {
        const response = await api.delete(`/auth/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting user:", error);
        throw error;
    }
};

export const updateRole = async (roleId, roleData) => {
    try {
        const response = await api.put(`/auth/roles/${roleId}`, roleData);
        return response.data;
    } catch (error) {
        console.error("Error updating role:", error);
        throw error;
    }
};

export const deleteRole = async (roleId) => {
    try {
        const response = await api.delete(`/auth/roles/${roleId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting role:", error);
        throw error;
    }
};

export const fetchAlmacenStats = async (filters) => {
    try {
        const response = await api.post('/almacen/stats', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching almacen stats:", error);
        throw error;
    }
};

export const fetchOperators = async () => {
    try {
        const response = await api.get('/almacen/operators');
        return response.data;
    } catch (error) {
        console.error("Error fetching operators:", error);
        throw error;
    }
};

export const fetchFinancePayments = async (filters) => {
    try {
        const response = await api.post('/finance/payments', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching finance payments:", error);
        throw error;
    }
};

export const fetchFinancePnL = async (filters) => {
    try {
        const response = await api.post('/finance/pnl', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching finance PnL:", error);
        throw error;
    }
};

export const fetchFinancePnLEvolution = async (filters) => {
    try {
        const response = await api.post('/finance/pnl-evolution', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching finance PnL evolution:", error);
        throw error;
    }
};

export const fetchInventoryDashboard = async (filters = {}) => {
    try {
        const response = await api.post('/inventory/dashboard', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching inventory dashboard:", error);
        throw error;
    }
};

export const fetchMonthlyClose = async (filters) => {
    try {
        const response = await api.post('/reports/monthly-close', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching monthly close report:", error);
        throw error;
    }
};
export const fetchFinancePnLDetailed = async (filters) => {
    try {
        const response = await api.post('/finance/pnl-detailed', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching detailed PnL:", error);
        throw error;
    }
};
