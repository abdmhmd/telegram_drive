import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import Breadcrumbs from '../components/Breadcrumbs';
import FileItem from '../components/FileItem';
import ViewToggle from '../components/ViewToggle';
import UploadModal from '../components/UploadModal';
import CreateFolderModal from '../components/CreateFolderModal';
import ContextMenu from '../components/ContextMenu';
import PreviewModal from '../components/PreviewModal';
import ShareModal from '../components/ShareModal';
import { Upload, FolderPlus, Loader2, AlertCircle, Menu, CloudOff } from 'lucide-react';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

export default function Dashboard() {
  const {
    items, currentFolder, viewMode, isLoading, error,
    showUpload, showCreateFolder, contextMenu, previewItem, showShare,
    loadItems, setShowUpload, setShowCreateFolder, setContextMenu,
    clearError, navigateToFolder, setSidebarOpen,
  } = useStore();

  useEffect(() => {
    if (currentFolder) {
      loadItems(currentFolder);
    } else {
      loadItems(null);
    }
  }, []);

  const handleContextMenu = useCallback((e, item) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  }, [setContextMenu]);

  const closeContextMenu = useCallback(() => { setContextMenu(null); }, []);

  useEffect(() => {
    const handler = () => closeContextMenu();
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [closeContextMenu]);

  return (
    <Layout>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        <motion.div
          className="bg-white dark:bg-surface-card border-b border-gray-200 dark:border-surface-border px-4 md:px-6 py-3"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <motion.button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </motion.button>
              <Breadcrumbs />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <ViewToggle />
              <motion.button
                onClick={() => setShowCreateFolder(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors min-h-[38px]"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <FolderPlus className="w-4 h-4" />
                <span className="hidden sm:inline">New Folder</span>
              </motion.button>
              <motion.button
                onClick={() => setShowUpload(true)}
                className="btn-primary px-4 py-2 text-sm min-h-[38px]"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Upload</span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Main content */}
        <div className="flex-1 overflow-auto p-4 md:p-6 scrollbar-thin" onClick={closeContextMenu}>
          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="mb-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg"
                initial={{ opacity: 0, y: -12, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -12, height: 0 }}
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm flex-1">{error}</span>
                <button onClick={clearError} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-lg leading-none">&times;</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading state */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
              <p className="text-sm text-gray-400">Loading files...</p>
            </div>
          ) : items.length === 0 ? (
            /* Empty state */
            <motion.div
              className="flex flex-col items-center justify-center py-20 text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              <CloudOff className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No files yet</p>
              <p className="text-sm mt-1">Upload your first file to get started</p>
              <motion.button
                onClick={() => setShowUpload(true)}
                className="btn-primary mt-4"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Upload className="w-4 h-4" />
                Upload Files
              </motion.button>
            </motion.div>
          ) : viewMode === 'grid' ? (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {items.map((item) => (
                <FileItem key={item.id} item={item} viewMode="grid" onContextMenu={handleContextMenu} />
              ))}
            </motion.div>
          ) : (
            <div className="card overflow-hidden">
              <div className="flex items-center gap-3 px-3 sm:px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-surface-border text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="w-[38px] flex-shrink-0" />
                <div className="flex-1 min-w-0">Name</div>
                <div className="w-20 text-right flex-shrink-0 sm:w-24">Size</div>
                <div className="w-24 text-right hidden md:block flex-shrink-0">Date</div>
              </div>
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                {items.map((item) => (
                  <FileItem key={item.id} item={item} viewMode="list" onContextMenu={handleContextMenu} />
                ))}
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showUpload && <UploadModal />}
        {showCreateFolder && <CreateFolderModal />}
        {previewItem && <PreviewModal />}
        {showShare && <ShareModal />}
      </AnimatePresence>

      {contextMenu && <ContextMenu menu={contextMenu} />}
    </Layout>
  );
}
