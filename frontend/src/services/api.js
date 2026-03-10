import axios from 'axios';

// Create an instance of axios with base URL
// Use the relative path to be handled by the development server proxy or environment variable
const api = axios.create({
    baseURL: '/api',
});

// Add a request interceptor to include the bearer token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Clear token and redirect to login if not already there
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Sales endpoints
export const fetchSalesDashboard = async (filters) => {
    try {
        const response = await api.post('/sales/dashboard', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching sales dashboard:", error);
        throw error;
    }
};

// Filter options endpoints
export const fetchFilterOptions = async () => {
    try {
        const response = await api.get('/filters/options');
        return response.data;
    } catch (error) {
        console.error("Error fetching filter options:", error);
        throw error;
    }
};

// Orders endpoints
export const fetchOrders = async (filters) => {
    try {
        const response = await api.post('/orders/list', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching orders:", error);
        throw error;
    }
};

// Authentication endpoints
export const loginUser = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
        const response = await api.post('/token', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
};

// User info
export const fetchCurrentUser = async () => {
    try {
        const response = await api.get('/users/me');
        return response.data;
    } catch (error) {
        console.error("Error fetching current user:", error);
        throw error;
    }
};

// Finance endpoints
export const fetchFinanceDashboard = async (filters) => {
    try {
        const response = await api.post('/finance/dashboard', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching finance dashboard:", error);
        throw error;
    }
};

// Production endpoints
export const fetchProductionDashboard = async (filters) => {
    try {
        const response = await api.post('/production/dashboard', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching production dashboard:", error);
        throw error;
    }
};

// Inventory endpoints
export const fetchInventoryDashboard = async (filters) => {
    try {
        const response = await api.post('/inventory/dashboard', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching inventory dashboard:", error);
        throw error;
    }
};

// Almacen endpoints
export const fetchAlmacenStock = async () => {
    try {
        const response = await api.get('/almacen/stock-by-warehouse');
        return response.data;
    } catch (error) {
        console.error("Error fetching warehouse stock:", error);
        throw error;
    }
};

// Purchases endpoints
export const fetchPurchasesDashboard = async (filters) => {
    try {
        const response = await api.post('/purchases/dashboard', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching purchases dashboard:", error);
        throw error;
    }
};

// Reports endpoints
export const fetchReportsList = async () => {
    try {
        const response = await api.get('/reports/list');
        return response.data;
    } catch (error) {
        console.error("Error fetching reports list:", error);
        throw error;
    }
};

// RMA endpoints
export const fetchRMAData = async () => {
    try {
        const response = await api.get('/rma');
        return response.data;
    } catch (error) {
        console.error("Error fetching RMA data:", error);
        throw error;
    }
};

// Inventory Tracking
export const searchArticles = async (query) => {
    try {
        const response = await api.get(`/inventory-tracking/search?q=${encodeURIComponent(query)}`);
        return response.data;
    } catch (error) {
        console.error("Error searching articles:", error);
        throw error;
    }
};

export const fetchArticleInfo = async (code) => {
    try {
        const response = await api.get(`/inventory-tracking/article-info?code=${encodeURIComponent(code)}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching article info:", error);
        throw error;
    }
};

export const fetchArticleStock = async (code) => {
    try {
        const response = await api.get(`/inventory-tracking/article-stock?code=${encodeURIComponent(code)}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching article stock:", error);
        throw error;
    }
};

export const fetchArticleSales = async (code) => {
    try {
        const response = await api.get(`/inventory-tracking/article-sales?code=${encodeURIComponent(code)}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching article sales:", error);
        throw error;
    }
};

export const fetchArticlePurchases = async (code) => {
    try {
        const response = await api.get(`/inventory-tracking/article-purchases?code=${encodeURIComponent(code)}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching article purchases:", error);
        throw error;
    }
};

export const fetchArticleProduction = async (code) => {
    try {
        const response = await api.get(`/inventory-tracking/article-production?code=${encodeURIComponent(code)}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching article production:", error);
        throw error;
    }
};

export default api;
