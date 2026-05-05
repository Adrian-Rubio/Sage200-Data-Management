import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 20000,
});

export const dashboardService = {
  getLocals: () => api.get('/api/dubes/locals'),
  getKpiSummary: (start, end, localId) => {
    let url = '/api/dubes/kpis/summary?';
    if (start) url += `start_date=${start}&end_date=${end}&`;
    if (localId && localId !== 'all') url += `local_id=${localId}`;
    return api.get(url);
  },
  getRevenueTrends: (start, end, localId) => {
    let url = '/api/dubes/trends/revenue?';
    if (start) url += `start_date=${start}&end_date=${end}&`;
    if (localId && localId !== 'all') url += `local_id=${localId}`;
    return api.get(url);
  },
  getHourlyDistribution: (start, end, localId) => {
    let url = '/api/dubes/hours/distribution?';
    if (start) url += `start_date=${start}&end_date=${end}&`;
    if (localId && localId !== 'all') url += `local_id=${localId}`;
    return api.get(url);
  },
  getRecentTickets: (page = 1, limit = 10, start, end, localId) => {
    let url = `/api/dubes/tickets/recent?page=${page}&limit=${limit}`;
    if (start && end) url += `&start_date=${start}&end_date=${end}`;
    if (localId && localId !== 'all') url += `&local_id=${localId}`;
    return api.get(url);
  },
  getInvitationDetails: (start, end) => api.get(`/api/dubes/invitations/details${start ? `?start_date=${start}&end_date=${end}` : ''}`),
  getClosures: (start, end, localId) => {
    let url = '/api/dubes/closures?';
    if (start) url += `start_date=${start}&end_date=${end}&`;
    if (localId && localId !== 'all') url += `local_id=${localId}`;
    return api.get(url);
  }
};

export default api;
