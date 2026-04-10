import api from './api';

export const authService = {
  login: (data) => api.post('/auth/login', data),
};

export const renterService = {
  getAll: (search = '') => api.get(`/renters?search=${search}`),
  getOne: (id) => api.get(`/renters/${id}`),
  create: (data) => api.post('/renters', data),
  update: (id, data) => api.put(`/renters/${id}`, data),
  remove: (id) => api.delete(`/renters/${id}`),
};

export const paymentService = {
  getAll: (params = {}) => api.get('/payments', { params }),
  getByRenter: (renterId) => api.get(`/payments/renter/${renterId}`),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  getReceiptUrl: (id) => `/api/payments/${id}/receipt`,
};

export const dashboardService = {
  getStats: () => api.get('/dashboard'),
};
