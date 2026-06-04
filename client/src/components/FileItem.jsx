import useStore from '../store/useStore';
import { filesApi } from '../api';
import {
  File, FileText, FileImage, FileVideo, FileArchive,
  FileAudio, Folder, Code,
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

export default function FileItem({ item, viewMode, onContextMenu }) {
  const { navigateToFolder, setPreviewItem } = useStore();
  const Icon = item.is_folder ? Folder : getFileIcon(item.mime_type, item.name);

  const handleClick = () => {
    if (item.is_folder) {
      navigateToFolder(item.id);
    } else {
      setPreviewItem(item);
    }
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', item.id.toString());
  };

  if (viewMode === 'list') {
    return (
      <div
        className="flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-b-0 group transition-colors min-h-[52px]"
        onClick={handleClick}
        onContextMenu={(e) => onContextMenu(e, item)}
        draggable
        onDragStart={handleDragStart}
      >
        <div className={`p-1.5 rounded-lg ${item.is_folder ? 'bg-amber-50 dark:bg-amber-900/40 text-amber-500 dark:text-amber-400' : 'bg-blue-50 dark:bg-blue-900/40 text-blue-500 dark:text-blue-400'} flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
          <p className="text-xs text-gray-400 truncate">{item.mime_type || 'Folder'}</p>
        </div>
        {!item.is_folder && (
          <span className="text-xs text-gray-400 w-20 text-right flex-shrink-0">{formatSize(item.size)}</span>
        )}
        <span className="text-xs text-gray-400 w-24 text-right hidden md:block flex-shrink-0">{formatDate(item.created_at)}</span>
      </div>
    );
  }

  return (
    <div
      className="group relative bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md dark:hover:shadow-blue-900/20 transition-all cursor-pointer p-3 sm:p-4"
      onClick={handleClick}
      onContextMenu={(e) => onContextMenu(e, item)}
      draggable
      onDragStart={handleDragStart}
    >
      <div className="flex flex-col items-center text-center">
        <div className={`p-2.5 sm:p-3 rounded-xl mb-2 sm:mb-3 ${item.is_folder ? 'bg-amber-50 dark:bg-amber-900/40' : 'bg-blue-50 dark:bg-blue-900/40'}`}>
          <Icon className={`w-8 h-8 sm:w-10 sm:h-10 ${item.is_folder ? 'text-amber-500 dark:text-amber-400' : 'text-blue-500 dark:text-blue-400'}`} />
        </div>
        <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate w-full">{item.name}</p>
        {!item.is_folder && (
          <p className="text-xs text-gray-400 mt-1">{formatSize(item.size)}</p>
        )}
      </div>
    </div>
  );
}
