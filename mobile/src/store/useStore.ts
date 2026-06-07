import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api, getApiUrl, setToken, clearToken, getApiError } from '../api/client';
import type {
  FileItem,
  FilesResponse,
  Account,
  ShareLink,
  UploadProgress,
  Breadcrumb,
  Stats,
  ViewMode,
  ThemeMode,
} from '../types';

const THEME_KEY = 'theme_mode';
const VIEW_KEY = 'view_mode';

interface AppState {
  // Auth
  token: string | null;
  phone: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  accounts: Account[];

  // Files
  items: FileItem[];
  breadcrumbs: Breadcrumb[];
  stats: Stats | null;
  currentFolderId: number | 'root' | null;
  loading: boolean;
  uploading: boolean;

  // Search
  searchQuery: string;
  searchResults: FileItem[];
  isSearching: boolean;

  // Upload queue
  uploadQueue: UploadProgress[];

  // UI
  viewMode: ViewMode;
  themeMode: ThemeMode;

  // Security
  biometricEnabled: boolean;

  // Actions - Auth
  initialize: () => Promise<void>;
  sendCode: (apiId: number, apiHash: string, phone: string) => Promise<void>;
  verifyCode: (phone: string, code: string) => Promise<{ needPassword?: boolean; phone?: string }>;
  verify2FA: (phone: string, password: string) => Promise<void>;
  loginAccount: (phone: string) => Promise<void>;
  logout: () => Promise<void>;
  loadAccounts: () => Promise<void>;
  setPhone: (phone: string | null) => void;

  // Actions - Files
  loadFolder: (folderId?: number | 'root' | null) => Promise<void>;
  uploadFiles: (files: { uri: string; name: string; mimeType: string }[], parentId?: number | null) => Promise<void>;
  deleteItem: (itemId: number) => Promise<void>;
  renameItem: (itemId: number, name: string) => Promise<void>;
  moveItem: (itemId: number, parentId: number | null) => Promise<void>;
  createFolder: (name: string, parentId?: number | null) => Promise<void>;
  createShareLink: (itemId: number, expiresInHours?: number | null) => Promise<ShareLink>;

  // Actions - Search
  search: (query: string) => Promise<void>;
  clearSearch: () => void;

  // Actions - UI
  setViewMode: (mode: ViewMode) => Promise<void>;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  removeUpload: (id: string) => void;
  cancelUpload: (id: string) => void;

  // Actions - Security
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  token: null,
  phone: null,
  isAuthenticated: false,
  isInitialized: false,
  accounts: [],
  items: [],
  breadcrumbs: [],
  stats: null,
  currentFolderId: 'root',
  loading: false,
  uploading: false,
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  uploadQueue: [],
  viewMode: 'grid',
  themeMode: 'system',
  biometricEnabled: false,

  initialize: async () => {
    console.log('[Store] initialize() — loading persisted state');
    try {
      const [token, phone, themeRaw, viewRaw] = await Promise.all([
        SecureStore.getItemAsync('auth_token'),
        SecureStore.getItemAsync('auth_phone'),
        SecureStore.getItemAsync(THEME_KEY),
        SecureStore.getItemAsync(VIEW_KEY),
      ]);
      console.log('[Store] initialize() — loaded:', { hasToken: !!token, phone, themeRaw, viewRaw });

      set({
        token,
        phone,
        isAuthenticated: !!token,
        themeMode: (themeRaw as ThemeMode) || 'system',
        viewMode: (viewRaw as ViewMode) || 'grid',
        isInitialized: true,
      });
    } catch (err) {
      console.error('[Store] initialize() — error:', err);
      set({ isInitialized: true });
    }
  },

  sendCode: async (apiId: number, apiHash: string, phone: string) => {
    console.log('[Store] sendCode() — sending code to phone:', { phone: phone.slice(0, 5) + '***', apiId });
    const { data } = await api.post('/auth/send-code', { api_id: apiId, api_hash: apiHash, phone });
    console.log('[Store] sendCode() — response:', data);
    if (!data.success) throw new Error(data.error || 'Failed to send code');
  },

  verifyCode: async (phone: string, code: string) => {
    console.log('[Store] verifyCode() — verifying code for:', phone.slice(0, 5) + '***');
    const { data } = await api.post('/auth/verify-code', { phone, code });
    console.log('[Store] verifyCode() — response:', data);
    if (data.needPassword) {
      console.log('[Store] verifyCode() — 2FA password required');
      return { needPassword: true, phone: data.phone };
    }
    if (data.success && data.token) {
      console.log('[Store] verifyCode() — token received, persisting');
      await setToken(data.token);
      await SecureStore.setItemAsync('auth_phone', data.phone);
      set({ token: data.token, phone: data.phone, isAuthenticated: true });
    }
    return {};
  },

  verify2FA: async (phone: string, password: string) => {
    console.log('[Store] verify2FA() — verifying 2FA for:', phone.slice(0, 5) + '***');
    const { data } = await api.post('/auth/verify-2fa', { phone, password });
    console.log('[Store] verify2FA() — response:', data);
    if (data.success && data.token) {
      console.log('[Store] verify2FA() — token received, persisting');
      await setToken(data.token);
      await SecureStore.setItemAsync('auth_phone', data.phone);
      set({ token: data.token, phone: data.phone, isAuthenticated: true });
    }
  },

  loginAccount: async (phone: string) => {
    console.log('[Store] loginAccount() — logging in:', phone.slice(0, 5) + '***');
    const { data } = await api.post('/auth/login', { phone });
    console.log('[Store] loginAccount() — response:', data);
    if (data.success && data.token) {
      console.log('[Store] loginAccount() — token received, persisting');
      await setToken(data.token);
      await SecureStore.setItemAsync('auth_phone', data.phone);
      set({ token: data.token, phone: data.phone, isAuthenticated: true });
    }
  },

  logout: async () => {
    console.log('[Store] logout() — clearing session');
    try {
      await api.post('/auth/logout');
      console.log('[Store] logout() — server session cleared');
    } catch (err) {
      console.warn('[Store] logout() — server logout failed, proceeding:', err);
    }
    await clearToken();
    await SecureStore.deleteItemAsync('auth_phone');
    set({ token: null, phone: null, isAuthenticated: false, items: [], breadcrumbs: [], stats: null });
    console.log('[Store] logout() — done');
  },

  loadAccounts: async () => {
    console.log('[Store] loadAccounts()');
    try {
      const { data } = await api.get('/auth/accounts');
      console.log('[Store] loadAccounts() — loaded:', data.accounts?.length || 0, 'accounts');
      set({ accounts: data.accounts || [] });
    } catch (err) {
      console.error('[Store] loadAccounts() — failed:', err);
      set({ accounts: [] });
    }
  },

  setPhone: (phone: string | null) => {
    console.log('[Store] setPhone()', { phone: phone?.slice(0, 5) + '***' || null });
    set({ phone });
  },

  loadFolder: async (folderId?: number | 'root' | null) => {
    const id = folderId === undefined ? get().currentFolderId : folderId;
    console.log('[Store] loadFolder() — loading folder:', id);
    set({ loading: true });
    try {
      const params = id && id !== 'root' ? { parent_id: id } : {};
      console.log('[Store] loadFolder() — params:', params);
      const { data } = await api.get<FilesResponse>('/files', { params });
      console.log('[Store] loadFolder() — loaded', data.items?.length || 0, 'items, breadcrumbs:', data.breadcrumbs?.length || 0);
      set({
        items: data.items || [],
        breadcrumbs: data.breadcrumbs || [],
        stats: data.stats || null,
        currentFolderId: id ?? 'root',
        loading: false,
      });
    } catch (err) {
      console.error('[Store] loadFolder() — failed:', err);
      set({ loading: false });
      throw err;
    }
  },

  uploadFiles: async (files, parentId) => {
    console.log('[Store] uploadFiles() — uploading', files.length, 'files to parent:', parentId, files.map(f => ({ name: f.name, size: f.mimeType })));
    const uploads: UploadProgress[] = files.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      fileName: f.name,
      progress: 0,
      speed: '',
      status: 'pending' as const,
    }));
    set({ uploading: true });
    const currentQueue = get().uploadQueue;
    set({ uploadQueue: [...currentQueue, ...uploads] });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadId = uploads[i].id;
      console.log('[Store] uploadFiles() — starting upload', i + 1 + '/' + files.length, file.name);

      set((s) => ({
        uploadQueue: s.uploadQueue.map((u) =>
          u.id === uploadId ? { ...u, status: 'uploading' as const } : u
        ),
      }));

      try {
        const formData = new FormData();
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType,
        } as any);
        if (parentId != null) {
          formData.append('parent_id', String(parentId));
        }

        await api.post('/files/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (event) => {
            if (event.total) {
              const pct = Math.round((event.loaded * 100) / event.total);
              const speed = `${(event.loaded / 1024 / 1024).toFixed(1)} MB`;
              if (pct % 25 === 0 || pct === 100) {
                console.log('[Store] uploadFiles() — progress', file.name, pct + '%');
              }
              set((s) => ({
                uploadQueue: s.uploadQueue.map((u) =>
                  u.id === uploadId ? { ...u, progress: pct, speed } : u
                ),
              }));
            }
          },
        });

        console.log('[Store] uploadFiles() — upload complete:', file.name);
        set((s) => ({
          uploadQueue: s.uploadQueue.map((u) =>
            u.id === uploadId ? { ...u, progress: 100, status: 'done' as const } : u
          ),
        }));
      } catch (err) {
        console.error('[Store] uploadFiles() — upload failed:', file.name, getApiError(err));
        set((s) => ({
          uploadQueue: s.uploadQueue.map((u) =>
            u.id === uploadId
              ? { ...u, status: 'error' as const, error: getApiError(err) }
              : u
          ),
        }));
      }
    }

    set({ uploading: false });
    try {
      await get().loadFolder();
    } catch {
      // Silently fail refresh
    }
    console.log('[Store] uploadFiles() — all uploads done');
  },

  deleteItem: async (itemId: number) => {
    console.log('[Store] deleteItem() — deleting:', itemId);
    try {
      await api.delete(`/files/${itemId}`);
      set((s) => ({ items: s.items.filter((i) => i.id !== itemId) }));
      console.log('[Store] deleteItem() — deleted:', itemId);
    } catch (err) {
      console.error('[Store] deleteItem() — failed:', itemId, err);
      throw err;
    }
  },

  renameItem: async (itemId: number, name: string) => {
    console.log('[Store] renameItem() — renaming:', { itemId, name });
    try {
      const { data } = await api.put(`/files/${itemId}`, { name });
      set((s) => ({
        items: s.items.map((i) => (i.id === itemId ? { ...i, name: data.item.name, updated_at: data.item.updated_at } : i)),
      }));
      console.log('[Store] renameItem() — done:', data);
    } catch (err) {
      console.error('[Store] renameItem() — failed:', err);
      throw err;
    }
  },

  moveItem: async (itemId: number, parentId: number | null) => {
    console.log('[Store] moveItem() — moving:', { itemId, parentId });
    try {
      await api.put(`/files/${itemId}`, { parent_id: parentId });
      set((s) => ({ items: s.items.filter((i) => i.id !== itemId) }));
      console.log('[Store] moveItem() — done');
    } catch (err) {
      console.error('[Store] moveItem() — failed:', err);
      throw err;
    }
  },

  createFolder: async (name: string, parentId?: number | null) => {
    console.log('[Store] createFolder() — creating:', { name, parentId });
    try {
      const body: Record<string, any> = { name };
      if (parentId != null) body.parent_id = parentId;
      const { data } = await api.post('/folders', body);
      set((s) => ({ items: [data.item, ...s.items] }));
      console.log('[Store] createFolder() — done:', data.item);
    } catch (err) {
      console.error('[Store] createFolder() — failed:', err);
      throw err;
    }
  },

  createShareLink: async (itemId: number, expiresInHours?: number | null) => {
    console.log('[Store] createShareLink() — for item:', { itemId, expiresInHours });
    try {
      const body: Record<string, any> = {};
      if (expiresInHours != null) body.expires_in_hours = expiresInHours;
      const { data } = await api.post<ShareLink>(`/files/${itemId}/share`, body);
      console.log('[Store] createShareLink() — done:', data);
      return data;
    } catch (err) {
      console.error('[Store] createShareLink() — failed:', err);
      throw err;
    }
  },

  search: async (query: string) => {
    console.log('[Store] search() — query:', query);
    set({ isSearching: true, searchQuery: query });
    try {
      const { data } = await api.get('/files/semantic-search', {
        params: { q: query },
        timeout: 30000,
      });
      console.log('[Store] search() — results:', data.items?.length || data.results?.length || 0, 'items');
      set({ searchResults: data.items || data.results || [], isSearching: false });
    } catch (err) {
      console.error('[Store] search() — failed, falling back:', err);
      set({ searchResults: [], isSearching: false });
    }
  },

  clearSearch: () => {
    console.log('[Store] clearSearch()');
    set({ searchQuery: '', searchResults: [], isSearching: false });
  },

  setViewMode: async (mode: ViewMode) => {
    await SecureStore.setItemAsync(VIEW_KEY, mode);
    set({ viewMode: mode });
  },

  setThemeMode: async (mode: ThemeMode) => {
    await SecureStore.setItemAsync(THEME_KEY, mode);
    set({ themeMode: mode });
  },

  removeUpload: (id: string) => {
    set((s) => ({ uploadQueue: s.uploadQueue.filter((u) => u.id !== id) }));
  },

  cancelUpload: (id: string) => {
    // Note: true cancel requires axios CancelToken; simplified here
    set((s) => ({
      uploadQueue: s.uploadQueue.filter((u) => u.id !== id),
    }));
  },

  setBiometricEnabled: async (enabled: boolean) => {
    set({ biometricEnabled: enabled });
  },
}));
