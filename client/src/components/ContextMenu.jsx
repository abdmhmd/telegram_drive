import { useCallback } from 'react';
import useStore from '../store/useStore';
import { filesApi } from '../api';
import { Download, Trash2, Edit3, Move, Share2, Eye } from 'lucide-react';

export default function ContextMenu({ menu }) {
  const {
    setContextMenu, deleteItem, setPreviewItem,
    setShowShare, setSelectedItem, renameItem,
    moveItem, currentFolder, navigateToFolder, loadItems,
  } = useStore();

  const handleDownload = useCallback(() => {
    const a = document.createElement('a');
    a.href = filesApi.download(menu.item.id);
    a.download = menu.item.name;
    a.click();
    setContextMenu(null);
  }, [menu, setContextMenu]);

  const handleDelete = useCallback(async () => {
    if (confirm(`Delete "${menu.item.name}"?`)) {
      await deleteItem(menu.item.id);
    }
    setContextMenu(null);
  }, [menu, setContextMenu, deleteItem]);

  const handleRename = useCallback(() => {
    const newName = prompt('Enter new name:', menu.item.name);
    if (newName && newName.trim() && newName !== menu.item.name) {
      renameItem(menu.item.id, newName.trim());
    }
    setContextMenu(null);
  }, [menu, setContextMenu, renameItem]);

  const handleMove = useCallback(async () => {
    const parentId = prompt('Enter destination folder ID (leave empty for root):');
    if (parentId !== null) {
      await moveItem(menu.item.id, parentId === '' ? null : parentId);
      await loadItems(currentFolder);
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
    <div
      className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 py-1 min-w-[180px]"
      style={{ left: menu.x, top: menu.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item, i) => (
        <button
          key={i}
          onClick={item.action}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
            item.danger
              ? 'text-red-600 hover:bg-red-50'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <item.icon className="w-4 h-4" />
          {item.label}
        </button>
      ))}
    </div>
  );
}
