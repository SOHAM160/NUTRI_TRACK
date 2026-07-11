import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  uploadProfileImage: (formData) =>
    api.put('/auth/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const mealService = {
  getMeals: (params) => api.get('/meals', { params }),
  getMeal: (id) => api.get(`/meals/${id}`),
  getTodayMeals: () => api.get('/meals/today'),
  createMeal: (formData) =>
    api.post('/meals', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateMeal: (id, formData) =>
    api.put(`/meals/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteMeal: (id) => api.delete(`/meals/${id}`),
  getSuggestions: (query) => api.get(`/meals/suggestions?query=${query}`),
};

export const analyticsService = {
  getAnalytics: (params) => api.get('/analytics', { params }),
  getDashboardSummary: () => api.get('/analytics/dashboard'),
  getStreakData: () => api.get('/analytics/streaks'),
};

export const uploadService = {
  uploadImage: (formData) =>
    api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export const aiService = {
  chat: (message, chatId) => api.post('/ai/chat', { message, chatId }),
  getChats: () => api.get('/ai/chats'),
  getChat: (id) => api.get(`/ai/chats/${id}`),
  deleteChat: (id) => api.delete(`/ai/chats/${id}`),
};

export const barcodeService = {
  search: (barcode) => api.post('/barcode/search', { barcode }),
};
