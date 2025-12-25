import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor для добавления токена в запросы
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ========== AUTH ==========
export const login = async (username, password) => {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  const response = await axios.post(`${API_BASE_URL}/auth/login`, formData);
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// ========== CLIENTS ==========
export const getClients = async (skip = 0, limit = 100, search = '', statusFilter = '', sortBy = '', sortOrder = 'asc') => {
  const params = {
    skip,
    limit,
    ...(search && { search }),
    ...(statusFilter && { loyaltystatus: statusFilter }),
    ...(sortBy && { sort_by: sortBy }),
    ...(sortOrder && { sort_order: sortOrder })
  };
  
  const response = await api.get('/clients', { params });
  return response.data;
};

export const createClient = async (clientData) => {
  const response = await api.post('/clients', clientData);
  return response.data;
};

export const updateClient = async (clientId, clientData) => {
  const response = await api.put(`/clients/${clientId}`, clientData);
  return response.data;
};

export const deleteClient = async (clientId) => {
  const response = await api.delete(`/clients/${clientId}`);
  return response.data;
};

// ========== MASTERS ==========
export const getMasters = async () => {
  const response = await api.get('/masters');
  return response.data;
};

export const createMaster = async (masterData) => {
  const response = await api.post('/masters', masterData);
  return response.data;
};

export const updateMaster = async (masterId, masterData) => {
  const response = await api.put(`/masters/${masterId}`, masterData);
  return response.data;
};

export const deleteMaster = async (masterId) => {
  const response = await api.delete(`/masters/${masterId}`);
  return response.data;
};

// ========== SERVICES ==========
export const getServices = async () => {
  const response = await api.get('/services');
  return response.data;
};

export const createService = async (serviceData) => {
  const response = await api.post('/services', serviceData);
  return response.data;
};

export const updateService = async (serviceId, serviceData) => {
  const response = await api.put(`/services/${serviceId}`, serviceData);
  return response.data;
};

export const deleteService = async (serviceId) => {
  const response = await api.delete(`/services/${serviceId}`);
  return response.data;
};

// ========== PRODUCTS ==========
export const getProducts = async () => {
  const response = await api.get('/products');
  return response.data;
};

export const createProduct = async (productData) => {
  const response = await api.post('/products', productData);
  return response.data;
};

export const updateProduct = async (productId, productData) => {
  const response = await api.put(`/products/${productId}`, productData);
  return response.data;
};

export const deleteProduct = async (productId) => {
  const response = await api.delete(`/products/${productId}`);
  return response.data;
};

// ========== APPOINTMENTS ==========
export const getAppointments = async (filters = {}) => {
  const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
  const response = await api.get('/appointments', { params: cleanFilters });
  return response.data;
};

export const getMyAppointments = async (dateFrom = null) => {
  const response = await api.get('/appointments/my', {
    params: dateFrom ? { date_from: dateFrom } : {}
  });
  return response.data;
};

export const createAppointment = async (appointmentData) => {
  const response = await api.post('/appointments', appointmentData);
  return response.data;
};

// ========== PAYMENTS ==========
export const createPayment = async (paymentData) => {
  const response = await api.post('/payments', paymentData);
  return response.data;
};

// ========== REPORTS ==========
export const getRevenueReport = async (dateFrom, dateTo) => {
  const response = await api.get('/reports/revenue', {
    params: { date_from: dateFrom, date_to: dateTo }
  });
  return response.data;
};

export default api;
