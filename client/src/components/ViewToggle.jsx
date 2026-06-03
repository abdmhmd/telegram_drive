import useStore from '../store/useStore';
import { Grid, List } from 'lucide-react';

export default function ViewToggle() {
  const { viewMode, setViewMode } = useStore();

  return (
    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setViewMode('grid')}
        className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
      >
        <Grid className="w-4 h-4" />
      </button>
      <button
        onClick={() => setViewMode('list')}
        className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}
