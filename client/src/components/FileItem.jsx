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
        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 group transition-colors"
        onClick={handleClick}
        onContextMenu={(e) => onContextMenu(e, item)}
        draggable
        onDragStart={handleDragStart}
      >
        <div className={`p-1.5 rounded-lg ${item.is_folder ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
          <p className="text-xs text-gray-400">{item.mime_type || 'Folder'}</p>
        </div>
        {!item.is_folder && (
          <span className="text-xs text-gray-400 w-20 text-right">{formatSize(item.size)}</span>
        )}
        <span className="text-xs text-gray-400 w-24 text-right hidden md:block">{formatDate(item.created_at)}</span>
      </div>
    );
  }

  return (
    <div
      className="group relative bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer p-4"
      onClick={handleClick}
      onContextMenu={(e) => onContextMenu(e, item)}
      draggable
      onDragStart={handleDragStart}
    >
      <div className="flex flex-col items-center text-center">
        <div className={`p-3 rounded-xl mb-3 ${item.is_folder ? 'bg-amber-50' : 'bg-blue-50'}`}>
          <Icon className={`w-10 h-10 ${item.is_folder ? 'text-amber-500' : 'text-blue-500'}`} />
        </div>
        <p className="text-sm font-medium text-gray-900 truncate w-full">{item.name}</p>
        {!item.is_folder && (
          <p className="text-xs text-gray-400 mt-1">{formatSize(item.size)}</p>
        )}
      </div>
    </div>
  );
}
