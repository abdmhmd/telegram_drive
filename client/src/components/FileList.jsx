import { motion } from 'framer-motion';
import FileItem from './FileItem';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.03,
    },
  },
};

export default function FileList({ items, onContextMenu }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-3 px-3 sm:px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-surface-border text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        <div className="w-[38px] flex-shrink-0" />
        <div className="flex-1 min-w-0">Name</div>
        <div className="w-20 text-right flex-shrink-0 sm:w-24">Size</div>
        <div className="w-24 text-right hidden md:block flex-shrink-0">Date</div>
      </div>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {items.map((item) => (
          <FileItem key={item.id} item={item} viewMode="list" onContextMenu={onContextMenu} />
        ))}
      </motion.div>
    </div>
  );
}
