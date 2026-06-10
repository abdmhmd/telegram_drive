import { motion } from 'framer-motion';
import FileItem from './FileItem';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

export default function FileGrid({ items, onContextMenu }) {
  return (
    <motion.div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item) => (
        <FileItem key={item.id} item={item} viewMode="grid" onContextMenu={onContextMenu} />
      ))}
    </motion.div>
  );
}
