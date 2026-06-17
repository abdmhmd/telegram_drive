import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import { authApi } from '../api';
import { maskPhone } from '../utils/helpers';
import { useNavigate } from 'react-router-dom';
import { Cloud, HardDrive, LogOut, Database, FolderOpen, Moon, Sun } from 'lucide-react';

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

export default function Sidebar() {
  const { phone, stats, clearAuth, navigateToFolder, theme, toggleTheme } = useStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
    navigate('/login');
  };

  const usagePercent = Math.min((stats.usedSpace / (5 * 1024 * 1024 * 1024)) * 100, 100);

  const handleNav = (folderId) => {
    navigateToFolder(folderId);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-32px)] max-w-[420px]">
      <motion.div
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-3"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Storage bar */}
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1 mb-3">
          <motion.div
            className="bg-brand-500 h-1 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${usagePercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>

        {/* Main row */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Logo + phone */}
          <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Cloud className="w-4 h-4 text-black" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">Telegram Drive</p>
              <p className="text-[10px] text-gray-400 truncate max-w-[90px] leading-tight">{maskPhone(phone)}</p>
            </div>
            <p className="text-[10px] text-gray-400 sm:hidden truncate max-w-[60px] leading-tight">{maskPhone(phone)}</p>
          </div>

          {/* Center: Nav + Stats */}
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => handleNav('root')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-brand-50 dark:hover:bg-surface-hover hover:text-brand-600 dark:hover:text-brand-400 transition-colors min-h-[32px]"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FolderOpen className="w-4 h-4" />
              <span className="text-xs font-medium hidden sm:inline">All Files</span>
            </motion.button>

            <div className="hidden md:flex items-center gap-2 text-[10px] text-gray-400 border-l border-gray-200 dark:border-gray-700 pl-2">
              <HardDrive className="w-3 h-3" />
              <span>{formatSize(stats.usedSpace)}</span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <Database className="w-3 h-3" />
              <span>{stats.files} {stats.files === 1 ? 'file' : 'files'}</span>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span>{stats.folders} {stats.folders === 1 ? 'folder' : 'folders'}</span>
            </div>
          </div>

          {/* Right: Theme + Logout */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <motion.button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.button>
            <motion.button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              title="Logout"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
