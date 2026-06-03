import useStore from '../store/useStore';
import { authApi } from '../api';
import { useNavigate } from 'react-router-dom';
import { Cloud, HardDrive, LogOut, Database, FolderOpen } from 'lucide-react';

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

export default function Sidebar() {
  const { phone, stats, clearAuth, navigateToFolder } = useStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    clearAuth();
    navigate('/login');
  };

  const usagePercent = Math.min((stats.usedSpace / (5 * 1024 * 1024 * 1024)) * 100, 100);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 text-sm">Telegram Drive</h2>
            <p className="text-xs text-gray-400 truncate max-w-[140px]">{phone}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3">
        <button
          onClick={() => navigateToFolder('root')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors mb-1"
        >
          <FolderOpen className="w-5 h-5" />
          <span className="text-sm font-medium">All Files</span>
        </button>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <HardDrive className="w-4 h-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-500">Storage</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>{formatSize(stats.usedSpace)} used</span>
          <span>{stats.files} files</span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
          <Database className="w-3 h-3" />
          <span>{stats.folders} folders</span>
        </div>
      </div>

      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
