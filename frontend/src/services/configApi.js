import api from './api';

const configApi = {
    getModules: async () => {
        const response = await api.get('/config/modules');
        return response.data;
    },
    updateModule: async (name, isActive) => {
        const response = await api.put(`/config/modules/${name}`, { is_active: isActive });
        return response.data;
    },
    initialize: async () => {
        const response = await api.post('/config/modules/initialize');
        return response.data;
    }
};

export default configApi;
