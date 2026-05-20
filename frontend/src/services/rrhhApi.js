import api from './api';

export const fetchVacations = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.company_id) params.append('company_id', filters.company_id);
    if (filters.department_id) params.append('department_id', filters.department_id);
    if (filters.user_id) params.append('user_id', filters.user_id);
    
    const response = await api.get(`/rrhh/vacations?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching vacations:", error);
    throw error;
  }
};

export const createVacation = async (vacationData) => {
  try {
    const response = await api.post('/rrhh/vacations', vacationData);
    return response.data;
  } catch (error) {
    console.error("Error creating vacation:", error);
    throw error;
  }
};

export const updateVacation = async (id, vacationData) => {
  try {
    const response = await api.put(`/rrhh/vacations/${id}`, vacationData);
    return response.data;
  } catch (error) {
    console.error("Error updating vacation:", error);
    throw error;
  }
};

export const deleteVacation = async (id) => {
  try {
    const response = await api.delete(`/rrhh/vacations/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting vacation:", error);
    throw error;
  }
};

export const fetchCompanies = async () => {
  try {
    const response = await api.get('/rrhh/companies');
    return response.data;
  } catch (error) {
    console.error("Error fetching companies:", error);
    throw error;
  }
};

export const fetchDepartments = async (companyId = null) => {
  try {
    const url = companyId ? `/rrhh/departments?company_id=${companyId}` : '/rrhh/departments';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw error;
  }
};

export const fetchEmployees = async (companyId = null, departmentId = null) => {
  try {
    const params = new URLSearchParams();
    if (companyId) params.append('company_id', companyId);
    if (departmentId) params.append('department_id', departmentId);
    
    const response = await api.get(`/rrhh/employees?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
};
