import { motion } from 'framer-motion';

export default function Layout({ children }) {
  return (
    <motion.div
      className="min-h-screen bg-gray-50 dark:bg-surface overflow-x-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
