import { useEffect, useCallback } from 'react';
import useStore from '../store/useStore';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import Breadcrumbs from '../components/Breadcrumbs';
import FileGrid from '../components/FileGrid';
import FileList from '../components/FileList';
import ViewToggle from '../components/ViewToggle';
import UploadModal from '../components/UploadModal';
import CreateFolderModal from '../components/CreateFolderModal';
import ContextMenu from '../components/ContextMenu';
import PreviewModal from '../components/PreviewModal';
import ShareModal from '../components/ShareModal';
import { Upload, FolderPlus, Loader2, AlertCircle, Menu } from 'lucide-react';

export default function Dashboard() {
  const {
    items, currentFolder, viewMode, isLoading, error,
    showUpload, showCreateFolder, contextMenu, previewItem, showShare,
    loadItems, setShowUpload, setShowCreateFolder, setContextMenu,
    clearError, navigateToFolder, setSidebarOpen,
  } = useStore();

  useEffect(() => {
    loadItems(currentFolder);
  }, []);

  const handleContextMenu = useCallback((e, item) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  useEffect(() => {
    const handler = () => closeContextMenu();
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [closeContextMenu]);

  return (
    <Layout>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <Breadcrumbs />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <ViewToggle />
              <button
                onClick={() => setShowCreateFolder(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors min-h-[38px]"
              >
                <FolderPlus className="w-4 h-4" />
                <span className="hidden sm:inline">New Folder</span>
              </button>
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors min-h-[38px]"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Upload</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6 custom-scrollbar" onClick={closeContextMenu}>
          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm flex-1">{error}</span>
              <button onClick={clearError} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">&times;</button>
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <svg className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium">This folder is empty</p>
              <p className="text-sm mt-1">Upload files or create folders to get started</p>
              <button
                onClick={() => setShowUpload(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors min-h-[44px]"
              >
                <Upload className="w-4 h-4" /> Upload Files
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <FileGrid items={items} onContextMenu={handleContextMenu} />
          ) : (
            <FileList items={items} onContextMenu={handleContextMenu} />
          )}
        </div>
      </div>

      {showUpload && <UploadModal />}
      {showCreateFolder && <CreateFolderModal />}
      {contextMenu && <ContextMenu menu={contextMenu} />}
      {previewItem && <PreviewModal />}
      {showShare && <ShareModal />}
    </Layout>
  );
}
