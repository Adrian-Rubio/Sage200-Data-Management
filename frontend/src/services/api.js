import axios from 'axios';

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
            localStorage.removeItem('token');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// --- Authentication & User Management ---
export const loginUser = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    try {
        const response = await api.post('/auth/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        return response.data;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
};

export const fetchCurrentUser = async () => {
    try {
        const response = await api.get('/auth/users/me');
        return response.data;
    } catch (error) {
        console.error("Error fetching current user:", error);
        throw error;
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

// --- Filters ---
export const fetchFilterOptions = async () => {
    try {
        const response = await api.get('/filters/options');
        return response.data;
    } catch (error) {
        console.error("Error fetching filter options:", error);
        throw error;
    }
};

// --- Sales ---
export const fetchSalesDashboard = async (filters) => {
    try {
        const response = await api.post('/sales/dashboard', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching sales dashboard:", error);
        throw error;
    }
};

export const fetchSalesInvoices = async (filters) => {
    try {
        const response = await api.post('/sales/invoices', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching sales invoices:", error);
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

export const fetchSalesByGeography = async (filters, scope = 'nacional') => {
    try {
        const response = await api.post('/sales/by-geography', { ...filters, scope });
        return response.data;
    } catch (error) {
        console.error("Error fetching geography data:", error);
        throw error;
    }
};

export const fetchRegionDetail = async (filters, scope, region) => {
    try {
        const response = await api.post('/sales/region-detail', { ...filters, scope, region });
        return response.data;
    } catch (error) {
        console.error("Error fetching region detail:", error);
        throw error;
    }
};

// --- Orders ---
export const fetchOrders = async (filters) => {
    try {
        const response = await api.post('/orders/list', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching orders:", error);
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

// --- Finance ---
export const fetchFinanceDashboard = async (filters) => {
    try {
        const response = await api.post('/finance/dashboard', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching finance dashboard:", error);
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

export const fetchFinancePnl = async (filters) => {
    try {
        const response = await api.post('/finance/pnl', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching P&L:", error);
        throw error;
    }
};

export const fetchFinancePnlEvolution = async (filters) => {
    try {
        const response = await api.post('/finance/pnl-evolution', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching P&L evolution:", error);
        throw error;
    }
};

export const fetchFinancePnLDetailed = async (filters) => {
    try {
        const response = await api.post('/finance/pnl-detailed', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching detailed P&L:", error);
        throw error;
    }
};

// --- Production ---
export const fetchProductionDashboard = async (filters) => {
    try {
        const response = await api.post('/production/dashboard', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching production dashboard:", error);
        throw error;
    }
};

export const fetchProductionOrders = async (filters) => {
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
        throw error;
    }
};

// --- Purchases ---
export const fetchPurchasesDashboard = async (filters) => {
    try {
        const response = await api.post('/purchases/dashboard', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching purchases dashboard:", error);
        throw error;
    }
};

export const fetchPendingPurchases = async (filters) => {
    try {
        const response = await api.post('/purchases/pending', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching pending purchases:", error);
        throw error;
    }
};

// --- Inventory ---
export const fetchInventoryDashboard = async (filters) => {
    try {
        const response = await api.post('/inventory/dashboard', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching inventory dashboard:", error);
        throw error;
    }
};

// --- Almacen ---
export const fetchAlmacenStock = async () => {
    try {
        const response = await api.get('/almacen/stock-by-warehouse');
        return response.data;
    } catch (error) {
        console.error("Error fetching warehouse stock:", error);
        throw error;
    }
};

export const fetchAlmacenStats = async (filters) => {
    try {
        const response = await api.post('/almacen/stats', filters);
        return response.data;
    } catch (error) {
        console.error("Error fetching warehouse stats:", error);
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

// --- Reports ---
export const fetchReportsList = async () => {
    try {
        const response = await api.get('/reports/list');
        return response.data;
    } catch (error) {
        console.error("Error fetching reports list:", error);
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

// --- RMA ---
export const fetchRmaData = async () => {
    try {
        const response = await api.get('/rma');
        return response.data;
    } catch (error) {
        console.error("Error fetching RMA data:", error);
        throw error;
    }
};

// --- Inventory Tracking (New Feature) ---
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
