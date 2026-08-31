import axios from 'axios';

// Hard fallback so the URL can never be undefined even if the env var is missing.
const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  '/api';

// eslint-disable-next-line no-console
console.log('[API] BASE_URL =', BASE_URL);
console.log('[API] VITE_API_BASE_URL =', import.meta.env.VITE_API_BASE_URL);

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
  // Log the exact full URL axios will hit (method + baseURL + relative url).
  console.log(
    `[API REQUEST] ${(config.method || 'GET').toUpperCase()} ${
      config.baseURL || ''
    }${config.url || ''}`
  );
  return config;
});

function getErrorStatusMessage(status) {
  if (status === 403) return 'Forbidden — you do not have permission';
  if (status === 404) return 'Not found';
  if (status === 409) return 'Conflict';
  if (status === 413) return 'File too large';
  if (status === 429) return 'Too many requests';
  return '';
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const reqUrl = error.config?.url || '(unknown)';
    const reqMethod = error.config?.method?.toUpperCase() || '?';
    const status = error.response?.status;
    const respData = error.response?.data;

    console.error(
      `[API Error] ${reqMethod} ${reqUrl} → ${status || 'NO RESPONSE'}`,
      {
        url: reqUrl,
        method: reqMethod,
        status,
        statusText: error.response?.statusText,
        responseData: respData,
        message: error.message,
        fullError: error,
      }
    );

    if (status === 401) {
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
  download: (fileId) => {
    const token = localStorage.getItem('token');
    return `${BASE_URL}/files/download/${fileId}?token=${token}`;
  },
  preview: (fileId) => {
    const token = localStorage.getItem('token');
    return `${BASE_URL}/files/preview/${fileId}?token=${token}`;
  },
  delete: (fileId) => api.delete(`/files/${fileId}`),
  update: (fileId, data) => api.put(`/files/${fileId}`, data),
  share: (fileId, expiresInHours) =>
    api.post(`/files/${fileId}/share`, { expires_in_hours: expiresInHours }),
  async downloadWithError(fileId) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/files/download/${fileId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      let errData;
      try { errData = await res.json(); } catch { errData = { error: res.statusText }; }
      const err = new Error(errData.error || `Download failed (${res.status})`);
      err.status = res.status;
      err.data = errData;
      throw err;
    }
    return res;
  },
};

export const foldersApi = {
  create: (data) => api.post('/folders', data),
};

export default api;
