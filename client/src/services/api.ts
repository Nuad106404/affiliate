import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001') + '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials: { phone: string; password: string }) => {
    console.log('API: Using endpoint /auth/client/login');
    return api.post('/auth/client/login', credentials);
  },
  register: (userData: any) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
  validateReferralCode: (code: string) => api.get(`/referral-codes/validate?code=${code}`),
};

export const productsAPI = {
  getAll: (params?: any) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

export const ordersAPI = {
  getAll: (params = {}) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (orderData) => api.post('/orders', orderData),
  update: (id, orderData) => api.put(`/orders/${id}`, orderData),
  delete: (id) => api.delete(`/orders/${id}`),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status })
};

export const earningsAPI = {
  getBreakdown: () => api.get('/earnings/breakdown')
};

export const affiliateProductsAPI = {
  getAll: () => api.get('/affiliate-products'),
  add: (productId: string) => api.post('/affiliate-products', { productId }),
  remove: (id: string) => api.delete(`/affiliate-products/${id}`),
  getStats: () => api.get('/affiliate-products/stats'),
  trackClick: (id: string) => api.post(`/affiliate-products/${id}/track-click`),
};

export const usersAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  getAll: (params?: any) => api.get('/users/admin/users', { params }),
  getById: (id: string) => api.get(`/users/admin/users/${id}`),
  update: (id: string, data: any) => api.put(`/users/admin/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/admin/users/${id}`),
  updateCredits: (id: string, credits: number) =>
    api.post(`/users/admin/users/${id}/credits`, { credits }),
  withdraw: (amount: number) => api.post('/users/withdraw', { amount }),
  getWithdrawals: (params?: any) => api.get('/users/withdrawals', { params }),
};

export const affiliatesAPI = {
  apply: (data: { productId: string; applicationNotes?: string; experienceLevel: string; marketingChannels: string[] }) =>
    api.post('/affiliates/apply', data),
  getMyAffiliates: () => api.get('/affiliates/my-affiliates'),
  getEarnings: (params?: any) => api.get('/affiliates/earnings', { params }),
  trackClick: (code: string, productId: string) => api.get(`/affiliates/track/${code}?productId=${productId}`),
};


export default api;