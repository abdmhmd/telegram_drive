import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const API_URL_KEY = 'api_url';

let cachedApiUrl: string | null = null;

export const getApiUrl = async (): Promise<string> => {
  if (cachedApiUrl) return cachedApiUrl;
  try {
    const stored = await SecureStore.getItemAsync(API_URL_KEY);
    if (stored && /^https?:\/\//i.test(stored)) {
      cachedApiUrl = stored;
    } else {
      if (stored) {
        console.warn('[API] Ignoring stored API URL without protocol:', stored);
      }
      cachedApiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:3001/api';
    }
  } catch {
    cachedApiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.100:3001/api';
  }
  return cachedApiUrl!;
};

export const clearApiUrl = async (): Promise<void> => {
  cachedApiUrl = null;
  await SecureStore.deleteItemAsync(API_URL_KEY);
};

export const resetStoredApiUrl = clearApiUrl;

export const setApiUrl = async (url: string): Promise<void> => {
  let normalized = url.replace(/\/+$/, '');
  if (normalized && !/^https?:\/\//i.test(normalized)) {
    normalized = 'http://' + normalized;
  }
  cachedApiUrl = normalized;
  await SecureStore.setItemAsync(API_URL_KEY, cachedApiUrl);
};

export const getToken = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const clearToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

const createClient = () => {
  const instance = axios.create({
    timeout: 60000,
    headers: {
      'Accept': 'application/json',
    },
  });

  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      const url = await getApiUrl();
      config.baseURL = url;
      const token = await getToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log(`[API] ➡ ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
        headers: config.headers,
        body: config.data ? (typeof config.data === 'string' ? config.data.substring(0, 500) : '[FormData]') : undefined,
      });
      return config;
    },
    (error) => {
      console.error('[API] ❌ Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  instance.interceptors.response.use(
    (response) => {
      console.log(`[API] ✓ ${response.config.method?.toUpperCase()} ${response.config.url} -> ${response.status}`, {
        data: typeof response.data === 'object' ? JSON.stringify(response.data).substring(0, 500) : response.data,
      });
      return response;
    },
    async (error: AxiosError<{ error?: string }>) => {
      if (error.response) {
        console.error(`[API] ✗ ${error.config?.method?.toUpperCase()} ${error.config?.url} -> ${error.response.status}`, {
          data: error.response.data,
          headers: error.response.headers,
        });
        if (error.response.status === 401) {
          await clearToken();
        }
      } else if (error.request) {
        console.error('[API] ✗ No response received:', {
          message: error.message,
          code: error.code,
          config: { url: error.config?.url, baseURL: error.config?.baseURL, method: error.config?.method },
        });
      } else {
        console.error('[API] ✗ Request setup error:', error.message, error.stack);
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export const api = createClient();

export const getApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error || error.message || 'Network error';
  }
  return 'An unexpected error occurred';
};
