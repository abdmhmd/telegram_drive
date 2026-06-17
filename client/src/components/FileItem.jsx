import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import {
  File, FileText, FileImage, FileVideo, FileArchive, FileAudio, Folder, Code,
  MoreVertical, Loader2, X, Copy, Check,
} from 'lucide-react';

function getFileIcon(mimeType, name) {
  if (!mimeType && !name) return File;
  const ext = name?.split('.').pop()?.toLowerCase();
  if (mimeType?.startsWith('image/')) return FileImage;
  if (mimeType?.startsWith('video/')) return FileVideo;
  if (mimeType?.startsWith('audio/')) return FileAudio;
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) return FileArchive;
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'go', 'rs', 'css', 'html'].includes(ext)) return Code;
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'json', 'xml', 'csv'].includes(ext)) return FileText;
  return File;
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function FileItem({ item, viewMode, onContextMenu, config }) {
  const {
    navigateToFolder, setPreviewItem, deleteItem, renameItem, moveItem,
    createShareLink, currentFolder, breadcrumbs, items, loadItems,
    showMoveFolderPicker, setShowMoveFolderPicker, moveTargetItem,
    setMoveTargetItem, movePickerOriginalFolder, setMovePickerOriginalFolder,
  } = useStore();

  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState({ delete: false, rename: false, move: false, share: false });

  const fallbackConfig = {
    selectDestination: () => {
      const id = window.prompt('Enter destination folder ID (leave empty for root):');
      if (id === null) return null;
      return { id: id ? Number(id) : null, name: id ? 'Folder' : 'Root' };
    },
    onAfterDelete: async () => await loadItems(currentFolder),
    onAfterRename: async () => await loadItems(currentFolder),
    onAfterMove: async () => await loadItems(currentFolder),
    onShareResult: ({ url }) => {
      if (url) {
        setShareLink(url);
        setShowShareModal(true);
      }
    },
  };
  const filesApi = {
    delete: (id) => deleteItem(id),
    update: (id, data) => renameItem(id, data.name ?? data.parent_id ?? null),
    share: (id, expiresInHours) => createShareLink(id, expiresInHours),
  };
  const cfg = { ...fallbackConfig, ...(config || {}) };

  const menuRef = useRef(null);
  const Icon = item.is_folder ? Folder : getFileIcon(item.mime_type, item.name);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMenu]);

  const handlePress = useCallback(() => {
    if (item.is_folder) {
      navigateToFolder(item.id);
    } else {
      setPreviewItem(item);
    }
  }, [item, navigateToFolder, setPreviewItem]);

  const handleToggleMenu = useCallback((e) => {
    e.stopPropagation();
    setShowMenu((prev) => !prev);
  }, []);

  const handleAction = useCallback(
    async (action) => {
      setShowMenu(false);
      try {
        switch (action) {
          case 'delete': {
            const confirmed = window.confirm(`Delete "${item.name}"?`);
            if (!confirmed) return;
            setLoading((l) => ({ ...l, delete: true }));
            await filesApi.delete(item.id);
            await config.onAfterDelete?.(item);
            break;
          }
          case 'rename': {
            const newName = window.prompt('Enter new name:', item.name);
            if (!newName || !newName.trim() || newName === item.name) return;
            setLoading((l) => ({ ...l, rename: true }));
            await filesApi.update(item.id, { name: newName.trim() });
            await config.onAfterRename?.(item, newName.trim());
            break;
          }
          case 'move': {
            const target = await config.selectDestination?.();
            if (target) {
              setLoading((l) => ({ ...l, move: true }));
              await filesApi.update(item.id, { parent_id: target.id });
              await config.onAfterMove?.(item, target);
            }
            break;
          }
          case 'share': {
            setLoading((l) => ({ ...l, share: true }));
            const res = await filesApi.share(item.id, 24);
            await config.onShareResult?.(res.data);
            break;
          }
          default:
            break;
        }
      } catch (err) {
        alert(`${action.charAt(0).toUpperCase()}${action.slice(1)} failed: ${err?.response?.data?.error || 'Network error'}`);
      } finally {
        setLoading((l) => ({ ...l, [action]: false }));
      }
    },
    [item, config]
  );

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Failed to copy link');
    }
  }, [shareLink]);

  const folders = items?.filter((i) => i.is_folder) || [];

  const handleMoveHere = useCallback(async () => {
    if (!item) return;
    const pickerCurrent = currentFolder;
    if (pickerCurrent === item.id) {
      setShowMoveFolderPicker(false);
      setMoveTargetItem(null);
      const restoreId = movePickerOriginalFolder;
      if (restoreId !== undefined && restoreId !== null) {
        loadItems(restoreId);
      } else {
        loadItems(null);
      }
      return;
    }
    try {
      setLoading((l) => ({ ...l, move: true }));
      await moveItem(item.id, pickerCurrent);
      await loadItems(pickerCurrent);
    } catch (err) {
      alert('Move failed: ' + (err?.response?.data?.error || 'Network error'));
    } finally {
      setLoading((l) => ({ ...l, move: false }));
      setShowMoveFolderPicker(false);
      setMoveTargetItem(null);
      const restoreId = movePickerOriginalFolder;
      if (restoreId !== undefined && restoreId !== null) {
        loadItems(restoreId);
      } else {
        loadItems(null);
      }
    }
  }, [item, currentFolder, moveItem, loadItems, movePickerOriginalFolder, setShowMoveFolderPicker, setMoveTargetItem]);

  const movePickerOpen = showMoveFolderPicker && moveTargetItem?.id === item.id;

  const menuDisabled = loading.delete || loading.rename || loading.move || loading.share;

  if (viewMode === 'list') {
    return (
      <motion.div style={{ position: 'relative' }} ref={menuRef}>
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-2.5 hover:bg-gray-50 dark:hover:bg-surface-hover cursor-pointer border-b border-gray-100 dark:border-surface-border last:border-b-0 group transition-colors min-h-[52px]"
          onClick={handlePress}
          onContextMenu={(e) => onContextMenu(e, item)}
          whileHover={{ backgroundColor: 'rgba(0,255,102,0.04)', transition: { duration: 0.15 } }}
        >
          <div className={`p-1.5 rounded-lg ${item.is_folder ? 'bg-amber-50 dark:bg-amber-900/40 text-amber-500 dark:text-amber-400' : 'bg-brand-50 dark:bg-brand-900/30 text-brand-500'} flex-shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
            <p className="text-xs text-gray-400 truncate">{item.mime_type || 'Folder'}</p>
          </div>
          {!item.is_folder && <span className="text-xs text-gray-400 w-20 text-right flex-shrink-0">{formatSize(item.size)}</span>}
          <span className="text-xs text-gray-400 w-24 text-right hidden md:block flex-shrink-0">{formatDate(item.created_at)}</span>
          <div className="relative">
            <button
              onClick={handleToggleMenu}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Actions"
              disabled={menuDisabled}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 min-w-[150px] overflow-hidden">
                {['Delete', 'Rename', 'Move', 'Share'].map((label) => {
                  const key = label.toLowerCase();
                  const isLoading = loading[key];
                  return (
                    <button
                      key={label}
                      onClick={() => handleAction(key)}
                      disabled={menuDisabled}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 ${
                        label === 'Delete'
                          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                      } ${menuDisabled ? 'opacity-60' : ''}`}
                    >
                      {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {movePickerOpen && (
          <MovePickerModal
            visible={movePickerOpen}
            onClose={() => {
              setShowMoveFolderPicker(false);
              setMoveTargetItem(null);
              const restoreId = movePickerOriginalFolder;
              if (restoreId !== undefined && restoreId !== null) {
                loadItems(restoreId);
              } else {
                loadItems(null);
              }
            }}
            onMove={handleMoveHere}
            currentFolder={currentFolder}
            breadcrumbs={breadcrumbs}
            folders={folders}
            onNavigate={navigateToFolder}
          />
        )}

        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="bg-white dark:bg-surface-card rounded-xl shadow-2xl w-full max-w-md p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Share link</h3>
                <button onClick={() => setShowShareModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 break-all mb-4">{shareLink}</p>
              <div className="flex gap-2">
                <button onClick={handleCopyLink} className="btn-primary flex items-center gap-2">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy link'}
                </button>
                <button onClick={() => setShowShareModal(false)} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div style={{ position: 'relative' }} ref={menuRef}>
      <motion.div
        variants={itemVariants}
        className="group relative card hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/10 dark:hover:shadow-brand-500/5 cursor-pointer p-3 sm:p-4"
        onClick={handlePress}
        onContextMenu={(e) => onContextMenu(e, item)}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.97 }}
      >
        <div className="flex flex-col items-center text-center">
          <div className={`p-2.5 sm:p-3 rounded-xl mb-2 sm:mb-3 ${item.is_folder ? 'bg-amber-50 dark:bg-amber-900/40' : 'bg-brand-50 dark:bg-brand-900/30'}`}>
            <Icon className={`w-8 h-8 sm:w-10 sm:h-10 ${item.is_folder ? 'text-amber-500 dark:text-amber-400' : 'text-brand-500'}`} />
          </div>
          <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate w-full">{item.name}</p>
          {!item.is_folder && <p className="text-xs text-gray-400 mt-1">{formatSize(item.size)}</p>}
        </div>
        <div className="absolute top-2 right-2">
          <button
            onClick={handleToggleMenu}
            className="p-1.5 rounded-lg bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 shadow-sm"
            aria-label="Actions"
            disabled={menuDisabled}
          >
            <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 min-w-[150px] overflow-hidden">
              {['Delete', 'Rename', 'Move', 'Share'].map((label) => {
                const key = label.toLowerCase();
                const isLoading = loading[key];
                return (
                  <button
                    key={label}
                    onClick={() => handleAction(key)}
                    disabled={menuDisabled}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 ${
                      label === 'Delete'
                        ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    } ${menuDisabled ? 'opacity-60' : ''}`}
                  >
                    {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {movePickerOpen && (
          <MovePickerModal
            visible={movePickerOpen}
            onClose={() => {
              setShowMoveFolderPicker(false);
              setMoveTargetItem(null);
              const restoreId = movePickerOriginalFolder;
              if (restoreId !== undefined && restoreId !== null) {
                loadItems(restoreId);
              } else {
                loadItems(null);
              }
            }}
            onMove={handleMoveHere}
            currentFolder={currentFolder}
            breadcrumbs={breadcrumbs}
            folders={folders}
            onNavigate={navigateToFolder}
          />
        )}

        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="bg-white dark:bg-surface-card rounded-xl shadow-2xl w-full max-w-md p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Share link</h3>
                <button onClick={() => setShowShareModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 break-all mb-4">{shareLink}</p>
              <div className="flex gap-2">
                <button onClick={handleCopyLink} className="btn-primary flex items-center gap-2">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy link'}
                </button>
                <button onClick={() => setShowShareModal(false)} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function MovePickerModal({ visible, onClose, onMove, currentFolder, breadcrumbs, folders, onNavigate }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white dark:bg-surface-card rounded-xl shadow-2xl w-full max-w-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Move to folder</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="flex items-center gap-1 text-xs sm:text-sm mb-4 overflow-x-auto">
          <button onClick={() => onNavigate(null)} className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300">
            <FolderOpen className="w-3.5 h-3.5" /> Root
          </button>
          {(breadcrumbs || []).map((crumb, idx) => (
            <span key={crumb.id || idx} className="flex items-center gap-1">
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              <button
                onClick={() => onNavigate(crumb.id === 'root' ? null : crumb.id)}
                className={`px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  idx === (breadcrumbs || []).length - 1
                    ? 'font-semibold text-gray-900 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 max-h-[50vh] overflow-y-auto">
          {folders.length === 0 ? (
            <p className="text-sm text-gray-500 col-span-full">No subfolders in current view.</p>
          ) : (
            folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => onNavigate(folder.id)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-500 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
              >
                <FolderOpen className="w-7 h-7 text-amber-500 dark:text-amber-400" />
                <span className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 text-center truncate w-full">
                  {folder.name}
                </span>
              </button>
            ))
          )}
        </div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm">
            Cancel
          </button>
          <button onClick={onMove} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
            <FolderOpen className="w-4 h-4" /> Move here
          </button>
        </div>
      </div>
    </div>
  );
}
