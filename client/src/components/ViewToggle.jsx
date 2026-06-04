import useStore from '../store/useStore';
import { Grid, List } from 'lucide-react';

export default function ViewToggle() {
  const { viewMode, setViewMode } = useStore();

  return (
    <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setViewMode('grid')}
        className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
        aria-label="Grid view"
      >
        <Grid className="w-4 h-4" />
      </button>
      <button
        onClick={() => setViewMode('list')}
        className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
        aria-label="List view"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}
