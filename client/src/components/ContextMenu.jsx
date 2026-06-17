import { useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import useStore from '../store/useStore';
import { filesApi } from '../api';
import { Download, Trash2, Edit3, Move, Share2, Eye } from 'lucide-react';

export default function ContextMenu({ menu }) {
  const {
    setContextMenu, deleteItem, setPreviewItem,
    setShowShare, setSelectedItem, renameItem,
    moveItem, currentFolder, navigateToFolder, loadItems,
  } = useStore();

  const handleDownload = useCallback(async () => {
    setContextMenu(null);
    toast('Starting download...');
    try {
      const res = await filesApi.downloadWithError(menu.item.id);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = menu.item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Download complete');
    } catch (err) {
      const msg = err.data?.error || err.message || 'Download failed';
      console.error(`[ContextMenu] Download failed:`, { fileId: menu.item.id, status: err.status, data: err.data, message: err.message });
      toast.error(`Download failed: ${msg}`);
    }
  }, [menu, setContextMenu]);

  const handleDelete = useCallback(async () => {
    if (!confirm(`Delete "${menu.item.name}"?`)) {
      setContextMenu(null);
      return;
    }
    try {
      await deleteItem(menu.item.id);
    } catch (err) {
      toast.error(`Delete failed: ${err.response?.data?.error || err.message || 'Unknown error'}`);
    }
    setContextMenu(null);
  }, [menu, setContextMenu, deleteItem]);

  const handleRename = useCallback(async () => {
    const newName = prompt('Enter new name:', menu.item.name);
    if (!newName || !newName.trim() || newName === menu.item.name) {
      setContextMenu(null);
      return;
    }
    try {
      await renameItem(menu.item.id, newName.trim());
    } catch (err) {
      toast.error(`Rename failed: ${err.response?.data?.error || err.message || 'Unknown error'}`);
    }
    setContextMenu(null);
  }, [menu, setContextMenu, renameItem]);

  const handleMove = useCallback(async () => {
    const parentId = prompt('Enter destination folder ID (leave empty for root):');
    if (parentId !== null) {
      try {
        await moveItem(menu.item.id, parentId === '' ? null : parentId);
        await loadItems(currentFolder);
      } catch (err) {
        toast.error(`Move failed: ${err.response?.data?.error || err.message || 'Unknown error'}`);
      }
    }
    setContextMenu(null);
  }, [menu, setContextMenu, moveItem, loadItems, currentFolder]);

  const handleShare = useCallback(() => {
    setSelectedItem(menu.item);
    setShowShare(true);
    setContextMenu(null);
  }, [menu, setSelectedItem, setShowShare, setContextMenu]);

  const handlePreview = useCallback(() => {
    setPreviewItem(menu.item);
    setContextMenu(null);
  }, [menu, setPreviewItem, setContextMenu]);

  const menuItems = [
    ...(menu.item.is_folder
      ? [{ icon: Eye, label: 'Open', action: () => { navigateToFolder(menu.item.id); setContextMenu(null); } }]
      : [
          { icon: Eye, label: 'Preview', action: handlePreview },
          { icon: Download, label: 'Download', action: handleDownload },
        ]),
    { icon: Edit3, label: 'Rename', action: handleRename },
    { icon: Move, label: 'Move', action: handleMove },
    { icon: Share2, label: 'Share', action: handleShare },
    { icon: Trash2, label: 'Delete', action: handleDelete, danger: true },
  ];

  return (
    <motion.div
      className="fixed z-50 bg-white dark:bg-surface-card rounded-xl shadow-xl border border-gray-200 dark:border-surface-border py-1 min-w-[180px]"
      style={{ left: Math.min(menu.x, window.innerWidth - 200), top: menu.y }}
      onClick={(e) => e.stopPropagation()}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.12 }}
    >
      {menuItems.map((item, i) => (
        <motion.button
          key={i}
          onClick={item.action}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors min-h-[44px] ${
            item.danger
              ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-hover'
          }`}
          whileHover={{ x: 4 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <item.icon className="w-4 h-4" />
          {item.label}
        </motion.button>
      ))}
    </motion.div>
  );
}
