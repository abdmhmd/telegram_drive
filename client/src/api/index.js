import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
      localStorage.removeItem('phone');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  sendCode: (data) => api.post('/auth/send-code', data),
  verifyCode: (data) => api.post('/auth/verify-code', data),
  verify2FA: (data) => api.post('/auth/verify-2fa', data),
  login: (data) => api.post('/auth/login', data),
  getAccounts: () => api.get('/auth/accounts'),
  logout: () => api.post('/auth/logout'),
};

export const filesApi = {
  list: (parentId = null) => api.get('/files', { params: { parent_id: parentId } }),
  upload: (formData, onProgress) =>
    api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    }),
  download: (fileId) => `${BASE_URL}/files/download/${fileId}`,
  preview: (fileId) => `${BASE_URL}/files/preview/${fileId}`,
  delete: (fileId) => api.delete(`/files/${fileId}`),
  update: (fileId, data) => api.put(`/files/${fileId}`, data),
  share: (fileId, expiresInHours) =>
    api.post(`/files/${fileId}/share`, { expires_in_hours: expiresInHours }),
};

export const foldersApi = {
  create: (data) => api.post('/folders', data),
};

export default api;
