import { create } from 'zustand';
import { filesApi, foldersApi } from '../api';

function getInitialTheme() {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const useStore = create((set, get) => ({
  // Auth
  token: localStorage.getItem('token') || null,
  phone: localStorage.getItem('phone') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  accounts: [],

  // Files
  items: [],
  currentFolder: null,
  breadcrumbs: [{ id: 'root', name: 'Root' }],
  stats: { files: 0, folders: 0, usedSpace: 0 },
  viewMode: 'grid',
  selectedItem: null,
  contextMenu: null,
  previewItem: null,
  isLoading: false,
  error: null,

  // Modals
  showUpload: false,
  showCreateFolder: false,
  showShare: false,
  sidebarOpen: false,

  // Theme
  theme: getInitialTheme(),

  // Auth actions
  setAuth: (token, phone) => {
    localStorage.setItem('token', token);
    localStorage.setItem('phone', phone);
    set({ token, phone, isAuthenticated: true });
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('phone');
    set({ token: null, phone: null, isAuthenticated: false, items: [], currentFolder: null });
  },

  setAccounts: (accounts) => set({ accounts }),

  // File actions
  loadItems: async (parentId = null) => {
    set({ isLoading: true, error: null });
    try {
      const res = await filesApi.list(parentId);
      set({
        items: res.data.items,
        currentFolder: parentId,
        breadcrumbs: res.data.breadcrumbs || [{ id: 'root', name: 'Root' }],
        stats: res.data.stats,
        isLoading: false,
      });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to load files', isLoading: false });
    }
  },

  uploadFiles: async (files, parentId, onProgress) => {
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      if (parentId) formData.append('parent_id', parentId);

      try {
        await filesApi.upload(formData, onProgress);
        await get().loadItems(parentId);
      } catch (err) {
        set({ error: `Failed to upload ${file.name}: ${err.response?.data?.error || err.message}` });
      }
    }
  },

  deleteItem: async (itemId) => {
    try {
      await filesApi.delete(itemId);
      await get().loadItems(get().currentFolder);
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to delete' });
    }
  },

  renameItem: async (itemId, name) => {
    try {
      await filesApi.update(itemId, { name });
      await get().loadItems(get().currentFolder);
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to rename' });
    }
  },

  moveItem: async (itemId, parentId) => {
    try {
      await filesApi.update(itemId, { parent_id: parentId });
      await get().loadItems(get().currentFolder);
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to move' });
    }
  },

  createFolder: async (name, parentId) => {
    try {
      await foldersApi.create({ name, parent_id: parentId });
      await get().loadItems(parentId);
      set({ showCreateFolder: false });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to create folder' });
    }
  },

  createShareLink: async (fileId, expiresInHours) => {
    try {
      const res = await filesApi.share(fileId, expiresInHours);
      return res.data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to create share link' });
      return null;
    }
  },

  // UI actions
  setViewMode: (mode) => set({ viewMode: mode }),
  setSelectedItem: (item) => set({ selectedItem: item }),
  setContextMenu: (menu) => set({ contextMenu: menu }),
  setPreviewItem: (item) => set({ previewItem: item }),
  setShowUpload: (show) => set({ showUpload: show }),
  setShowCreateFolder: (show) => set({ showCreateFolder: show }),
  setShowShare: (show) => set({ showShare: show }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Theme actions
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return { theme: next };
    }),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    set({ theme });
  },

  clearError: () => set({ error: null }),

  navigateToFolder: async (folderId) => {
    if (folderId === 'root') {
      await get().loadItems(null);
    } else {
      await get().loadItems(folderId);
    }
  },
}));

export default useStore;
