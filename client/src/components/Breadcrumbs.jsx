import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
  const { breadcrumbs, navigateToFolder } = useStore();

  return (
    <nav className="flex items-center gap-1 text-sm min-w-0 flex-wrap">
      {breadcrumbs.map((crumb, i) => (
        <motion.div
          key={crumb.id}
          className="flex items-center gap-1 min-w-0"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.15, delay: i * 0.03 }}
        >
          {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />}
          <button
            onClick={() => navigateToFolder(crumb.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
              i === breadcrumbs.length - 1
                ? 'text-gray-900 dark:text-gray-100 font-medium cursor-default truncate'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 truncate'
            }`}
          >
            {i === 0 && <Home className="w-3.5 h-3.5 flex-shrink-0" />}
            <span className="truncate max-w-[120px] sm:max-w-none">{crumb.name}</span>
          </button>
        </motion.div>
      ))}
    </nav>
  );
}
