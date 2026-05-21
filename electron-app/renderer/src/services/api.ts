import axios from 'axios';

const API_BASE = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      localStorage.removeItem('fullName');
      window.location.hash = '#/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: { username: string; password: string }) => api.post('/api/v1/auth/login', data),
  register: (data: any) => api.post('/api/v1/auth/register', data),
};

export const customerApi = {
  getAll: (params?: any) => api.get('/api/v1/customers', { params }),
  getAllList: () => api.get('/api/v1/customers/all'),
  getById: (id: string) => api.get(`/api/v1/customers/${id}`),
  create: (data: any) => api.post('/api/v1/customers', data),
  update: (id: string, data: any) => api.put(`/api/v1/customers/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/customers/${id}`),
};

export const productApi = {
  getAll: (params?: any) => api.get('/api/v1/products', { params }),
  getAllList: () => api.get('/api/v1/products/all'),
  getById: (id: string) => api.get(`/api/v1/products/${id}`),
  create: (data: any) => api.post('/api/v1/products', data),
  update: (id: string, data: any) => api.put(`/api/v1/products/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/products/${id}`),
  updateStock: (id: string, quantity: number) => api.patch(`/api/v1/products/${id}/stock?quantity=${quantity}`),
};

export const invoiceApi = {
  getAll: (params?: any) => api.get('/api/v1/invoices', { params }),
  getById: (id: string) => api.get(`/api/v1/invoices/${id}`),
  create: (data: any) => api.post('/api/v1/invoices', data),
  cancel: (id: string) => api.put(`/api/v1/invoices/${id}/cancel`),
  getPendingDues: () => api.get('/api/v1/invoices/pending-dues'),
  downloadPdf: (id: number | string) => api.get(`/api/v1/invoices/${id}/pdf`, { responseType: 'blob' }),
  getCustomerInvoices: (customerId: string, params?: any) => api.get(`/api/v1/invoices/customer/${customerId}/filter`, { params }),
};

export const paymentApi = {
  record: (data: any) => api.post('/api/v1/payments', data),
  getByInvoice: (invoiceId: string) => api.get(`/api/v1/payments/invoice/${invoiceId}`),
  getByCustomer: (customerId: string) => api.get(`/api/v1/payments/customer/${customerId}`),
  getAll: (params?: any) => api.get('/api/v1/payments', { params }),
};

export const reportApi = {
  dashboard: () => api.get('/api/v1/reports/dashboard'),
  dailySales: (date?: string) => api.get('/api/v1/reports/sales/daily', { params: { date } }),
  monthlySales: (year: number, month: number) => api.get('/api/v1/reports/sales/monthly', { params: { year, month } }),
  outstandingDues: () => api.get('/api/v1/reports/outstanding-dues'),
  gstReport: (startDate?: string, endDate?: string) => api.get('/api/v1/reports/gst', { params: { startDate, endDate } }),
  paymentAnalytics: (startDate?: string, endDate?: string) => api.get('/api/v1/reports/payment-analytics', { params: { startDate, endDate } }),
  exportInvoicesExcel: () => api.get('/api/v1/reports/export/invoices/excel', { responseType: 'blob' }),
  exportInvoicesCsv: () => api.get('/api/v1/reports/export/invoices/csv', { responseType: 'blob' }),
  exportPaymentsExcel: () => api.get('/api/v1/reports/export/payments/excel', { responseType: 'blob' }),
  exportPaymentsCsv: () => api.get('/api/v1/reports/export/payments/csv', { responseType: 'blob' }),
};

export const notificationApi = {
  getReminders: () => api.get('/api/v1/notifications/reminders'),
  updateReminder: (id: string, data: any) => api.put(`/api/v1/notifications/reminders/${id}`, data),
  createReminder: (data: any) => api.post('/api/v1/notifications/reminders', data),
};

export const backupApi = {
  create: () => api.post('/api/v1/backup'),
  list: () => api.get('/api/v1/backup'),
  restore: (filePath: string) => api.post('/api/v1/backup/restore', { filePath }),
  delete: (fileName: string) => api.delete(`/api/v1/backup/${fileName}`),
};

export const settingsApi = {
  getAll: () => api.get('/api/v1/settings'),
  update: (settings: Record<string, string>) => api.put('/api/v1/settings', settings),
};

export const auditApi = {
  getAll: (params?: any) => api.get('/api/v1/audit-logs', { params }),
};

export const userApi = {
  getAll: () => api.get('/api/v1/users'),
  getMe: () => api.get('/api/v1/users/me'),
  update: (id: number, data: any) => api.put(`/api/v1/users/${id}`, data),
  toggleActive: (id: number) => api.put(`/api/v1/users/${id}/toggle-active`),
  changePassword: (id: number, newPassword: string) => api.put(`/api/v1/users/${id}/password`, { newPassword }),
};

export default api;
