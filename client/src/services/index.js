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
  markLeft: (id) => api.put(`/renters/${id}/mark-left`),
};

export const paymentService = {
  getAll: (params = {}) => api.get('/payments', { params }),
  getByRenter: (renterId) => api.get(`/payments/renter/${renterId}`),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  getReceiptUrl: (id) => `/api/payments/${id}/receipt`,
  submitScreenshot: (id, file) => {
    const form = new FormData();
    form.append('screenshot', file);
    return api.post(`/payments/${id}/screenshot`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  approve: (id) => api.post(`/payments/${id}/approve`),
  reject: (id) => api.post(`/payments/${id}/reject`),
  sendMessage: (id, type) => api.post(`/payments/${id}/send-message`, { type }),
};

export const dashboardService = {
  getStats: () => api.get('/dashboard'),
};

export const billingService = {
  getAll: (params = {}) => api.get('/billing', { params }),
  getOne: (id) => api.get(`/billing/${id}`),
  create: (data) => api.post('/billing', data),
  update: (id, data) => api.put(`/billing/${id}`, data),
  markPaid: (id) => api.put(`/billing/${id}/mark-paid`),
  remove: (id) => api.delete(`/billing/${id}`),
  getReceiptUrl: (id) => `/api/billing/${id}/receipt`,
  sendWhatsApp: (id) => api.post(`/billing/${id}/whatsapp`),
};
