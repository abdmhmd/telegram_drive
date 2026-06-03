import useStore from '../store/useStore';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
  const { breadcrumbs, navigateToFolder } = useStore();

  return (
    <nav className="flex items-center gap-1 text-sm">
      {breadcrumbs.map((crumb, i) => (
        <div key={crumb.id} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
          <button
            onClick={() => navigateToFolder(crumb.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${
              i === breadcrumbs.length - 1
                ? 'text-gray-900 font-medium cursor-default'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {i === 0 && <Home className="w-3.5 h-3.5" />}
            {crumb.name}
          </button>
        </div>
      ))}
    </nav>
  );
}
