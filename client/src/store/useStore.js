import { create } from 'zustand';
import { filesApi, foldersApi } from '../api';
import toast from 'react-hot-toast';

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

  // Move picker
  showMoveFolderPicker: false,
  moveTargetItem: null,
  movePickerOriginalFolder: null,

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
      const status = err.response?.status;
      const msg = err.response?.data?.error || 'Failed to load files';
      console.error(`[loadItems] Failed (parentId=${parentId}, status=${status}):`, {
        parentId, status, data: err.response?.data, message: err.message, error: err,
      });
      set({ error: msg, isLoading: false });
    }
  },

  uploadFiles: async (files, parentId, onProgress) => {
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      if (parentId) formData.append('parent_id', parentId);

      try {
        await filesApi.upload(formData, onProgress);
        toast.success(`${file.name} uploaded`);
        await get().loadItems(parentId);
      } catch (err) {
        const status = err.response?.status;
        const msg = `Failed to upload ${file.name}: ${err.response?.data?.error || err.message}`;
        toast.error(`Upload failed: ${err.response?.data?.error || err.message}`);
        console.error(`[uploadFiles] Failed (file=${file.name}, status=${status}):`, {
          fileName: file.name, status, data: err.response?.data, message: err.message, error: err,
        });
        set({ error: msg });
      }
    }
  },

  deleteItem: async (itemId) => {
    try {
      await filesApi.delete(itemId);
      toast.success('File deleted');
      await get().loadItems(get().currentFolder);
    } catch (err) {
      const status = err.response?.status;
      let msg = err.response?.data?.error || 'Failed to delete';
      if (status === 403) msg = 'You do not have permission to delete this file';
      else if (status === 404) msg = 'File not found';
      else if (!err.response) msg = 'Delete failed: Network error. Please check your connection.';
      toast.error(msg);
      console.error(`[deleteItem] Failed (itemId=${itemId}, status=${status}):`, {
        itemId, status, data: err.response?.data, message: err.message, error: err,
      });
      set({ error: msg });
    }
  },

  renameItem: async (itemId, name) => {
    try {
      await filesApi.update(itemId, { name });
      toast.success('Renamed successfully');
      await get().loadItems(get().currentFolder);
    } catch (err) {
      const status = err.response?.status;
      let msg = err.response?.data?.error || 'Failed to rename';
      if (status === 403) msg = 'You do not have permission to rename this file';
      else if (status === 404) msg = 'File not found';
      else if (!err.response) msg = 'Rename failed: Network error. Please check your connection.';
      toast.error(msg);
      console.error(`[renameItem] Failed (itemId=${itemId}, name=${name}, status=${status}):`, {
        itemId, newName: name, status, data: err.response?.data, message: err.message, error: err,
      });
      set({ error: msg });
    }
  },

  moveItem: async (itemId, parentId) => {
    try {
      await filesApi.update(itemId, { parent_id: parentId });
      toast.success('Moved successfully');
      await get().loadItems(get().currentFolder);
    } catch (err) {
      const status = err.response?.status;
      let msg = err.response?.data?.error || 'Failed to move';
      if (status === 403) msg = 'You do not have permission to move this file';
      else if (status === 404) msg = 'File not found';
      else if (!err.response) msg = 'Move failed: Network error. Please check your connection.';
      toast.error(msg);
      console.error(`[moveItem] Failed (itemId=${itemId}, parentId=${parentId}, status=${status}):`, {
        itemId, parentId, status, data: err.response?.data, message: err.message, error: err,
      });
      set({ error: msg });
    }
  },

  createFolder: async (name, parentId) => {
    try {
      await foldersApi.create({ name, parent_id: parentId });
      toast.success('Folder created');
      await get().loadItems(parentId);
      set({ showCreateFolder: false });
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || 'Failed to create folder';
      toast.error(msg);
      console.error(`[createFolder] Failed (name=${name}, parentId=${parentId}, status=${status}):`, {
        name, parentId, status, data: err.response?.data, message: err.message, error: err,
      });
      set({ error: msg });
    }
  },

  createShareLink: async (fileId, expiresInHours) => {
    try {
      const res = await filesApi.share(fileId, expiresInHours);
      toast.success('Share link created');
      return res.data;
    } catch (err) {
      const status = err.response?.status;
      let msg = err.response?.data?.error || 'Failed to create share link';
      if (status === 403) msg = 'You do not have permission to share this file';
      else if (status === 404) msg = 'File not found';
      else if (!err.response) msg = 'Share failed: Network error. Please check your connection.';
      toast.error(msg);
      console.error(`[createShareLink] Failed (fileId=${fileId}, status=${status}):`, {
        fileId, expiresInHours, status, data: err.response?.data, message: err.message, error: err,
      });
      set({ error: msg });
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

  // Move picker
  setShowMoveFolderPicker: (show) => set({ showMoveFolderPicker: show }),
  setMoveTargetItem: (item) => set({ moveTargetItem: item }),

  navigateToFolder: async (folderId) => {
    const pickerOpen = get().showMoveFolderPicker;
    if (folderId === 'root' || folderId === null || folderId === undefined) {
      await get().loadItems(null);
      if (pickerOpen) set({ movePickerOriginalFolder: null });
    } else {
      await get().loadItems(folderId);
      if (pickerOpen) set({ movePickerOriginalFolder: folderId });
    }
  },

  restoreMovePickerFolder: async () => {
    const original = get().movePickerOriginalFolder;
    if (original !== undefined && original !== null) {
      await get().loadItems(original);
    } else {
      await get().loadItems(null);
    }
    set({ showMoveFolderPicker: false, moveTargetItem: null, movePickerOriginalFolder: null });
  },
}));

export default useStore;
