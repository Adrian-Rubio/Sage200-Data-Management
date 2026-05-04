import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const configApi = {
    getModules: async () => {
        const response = await axios.get(`${API_URL}/api/config/modules`, { withCredentials: true });
        return response.data;
    },
    updateModule: async (name, isActive) => {
        const response = await axios.put(`${API_URL}/api/config/modules/${name}`, { is_active: isActive }, { withCredentials: true });
        return response.data;
    },
    initialize: async () => {
        const response = await axios.post(`${API_URL}/api/config/modules/initialize`, {}, { withCredentials: true });
        return response.data;
    }
};

export default configApi;
