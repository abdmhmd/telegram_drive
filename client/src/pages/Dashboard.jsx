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
import { Upload, FolderPlus, Loader2, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const {
    items, currentFolder, viewMode, isLoading, error,
    showUpload, showCreateFolder, contextMenu, previewItem, showShare,
    loadItems, setShowUpload, setShowCreateFolder, setContextMenu,
    clearError, navigateToFolder,
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
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <Breadcrumbs />
            <div className="flex items-center gap-2">
              <ViewToggle />
              <button
                onClick={() => setShowCreateFolder(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
                <span className="hidden sm:inline">New Folder</span>
              </button>
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Upload</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 custom-scrollbar" onClick={closeContextMenu}>
          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm flex-1">{error}</span>
              <button onClick={clearError} className="text-red-500 hover:text-red-700">&times;</button>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium">This folder is empty</p>
              <p className="text-sm mt-1">Upload files or create folders to get started</p>
              <button
                onClick={() => setShowUpload(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
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
