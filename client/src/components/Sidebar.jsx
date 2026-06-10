import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import { authApi } from '../api';
import { useNavigate } from 'react-router-dom';
import { Cloud, HardDrive, LogOut, Database, FolderOpen, X, Moon, Sun } from 'lucide-react';

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

export default function Sidebar() {
  const { phone, stats, clearAuth, navigateToFolder, sidebarOpen, setSidebarOpen, theme, toggleTheme } = useStore();
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mq.matches);
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
    navigate('/login');
  };

  const usagePercent = Math.min((stats.usedSpace / (5 * 1024 * 1024 * 1024)) * 100, 100);

  const handleNav = (folderId) => {
    navigateToFolder(folderId);
    setSidebarOpen(false);
  };

  return (
    <>
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className="fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-surface-border flex flex-col lg:static lg:z-auto"
        initial={false}
        animate={{ x: isDesktop ? 0 : (sidebarOpen ? 0 : -256) }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="lg:hidden absolute top-3 right-3">
          <button onClick={() => setSidebarOpen(false)} className="icon-btn" aria-label="Close sidebar">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Logo area */}
        <div className="p-5 border-b border-gray-100 dark:border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Cloud className="w-5 h-5 text-black" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">Telegram Drive</h2>
              <p className="text-xs text-gray-400 truncate max-w-[140px]">{phone}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <motion.button
            onClick={() => handleNav('root')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-surface-hover hover:text-brand-600 dark:hover:text-brand-400 transition-colors mb-1 min-h-[44px]"
            whileHover={{ x: 4 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <FolderOpen className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">All Files</span>
          </motion.button>

          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-surface-border">
            <motion.button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors min-h-[44px]"
              whileHover={{ x: 4 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 flex-shrink-0" />
              ) : (
                <Moon className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </motion.button>
          </div>
        </nav>

        {/* Storage stats */}
        <div className="p-4 border-t border-gray-100 dark:border-surface-border">
          <div className="flex items-center gap-2 mb-3">
            <HardDrive className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Storage</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-2">
            <motion.div
              className="bg-brand-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${usagePercent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>{formatSize(stats.usedSpace)} used</span>
            <span>{stats.files} files</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
            <Database className="w-3 h-3 flex-shrink-0" />
            <span>{stats.folders} folders</span>
          </div>
        </div>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100 dark:border-surface-border">
          <motion.button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors min-h-[44px]"
            whileHover={{ x: 4 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Logout
          </motion.button>
        </div>
      </motion.aside>
    </>
  );
}
