import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import { Grid, List } from 'lucide-react';

export default function ViewToggle() {
  const { viewMode, setViewMode } = useStore();

  return (
    <motion.div
      className="flex items-center border border-gray-200 dark:border-surface-border rounded-lg overflow-hidden"
      layout
    >
      <motion.button
        onClick={() => setViewMode('grid')}
        className={`p-2.5 transition-colors ${
          viewMode === 'grid'
            ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Grid view"
      >
        <Grid className="w-4 h-4" />
      </motion.button>
      <motion.button
        onClick={() => setViewMode('list')}
        className={`p-2.5 transition-colors ${
          viewMode === 'list'
            ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="List view"
      >
        <List className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}
