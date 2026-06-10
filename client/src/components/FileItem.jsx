import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import { File, FileText, FileImage, FileVideo, FileArchive, FileAudio, Folder, Code } from 'lucide-react';

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
      <motion.div
        variants={itemVariants}
        className="flex items-center gap-3 px-3 sm:px-4 py-3 sm:py-2.5 hover:bg-gray-50 dark:hover:bg-surface-hover cursor-pointer border-b border-gray-100 dark:border-surface-border last:border-b-0 group transition-colors min-h-[52px]"
        onClick={handleClick}
        onContextMenu={(e) => onContextMenu(e, item)}
        draggable
        onDragStart={handleDragStart}
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
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={itemVariants}
      className="group relative card hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/10 dark:hover:shadow-brand-500/5 cursor-pointer p-3 sm:p-4"
      onClick={handleClick}
      onContextMenu={(e) => onContextMenu(e, item)}
      draggable
      onDragStart={handleDragStart}
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
    </motion.div>
  );
}
