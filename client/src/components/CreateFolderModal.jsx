import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
import { X, FolderPlus } from 'lucide-react';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', damping: 25, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 20,
    transition: { duration: 0.15 },
  },
};

export default function CreateFolderModal() {
  const { setShowCreateFolder, createFolder, currentFolder } = useStore();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await createFolder(name.trim(), currentFolder);
    setLoading(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={() => setShowCreateFolder(false)}
      >
        <motion.div
          className="bg-white dark:bg-surface-card rounded-2xl shadow-2xl w-full max-w-sm mx-2 sm:mx-0"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-surface-border">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Folder</h2>
            <button onClick={() => setShowCreateFolder(false)} className="icon-btn">
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-5">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Folder name"
              autoFocus
            />
            <motion.button
              type="submit"
              disabled={!name.trim() || loading}
              className="btn-primary w-full mt-4"
              whileHover={name.trim() ? { scale: 1.01 } : {}}
              whileTap={name.trim() ? { scale: 0.98 } : {}}
            >
              <FolderPlus className="w-4 h-4" />
              {loading ? 'Creating...' : 'Create Folder'}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
