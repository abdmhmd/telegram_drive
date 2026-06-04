import FileItem from './FileItem';

export default function FileList({ items, onContextMenu }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center gap-3 px-3 sm:px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        <div className="w-[38px] flex-shrink-0" />
        <div className="flex-1 min-w-0">Name</div>
        <div className="w-20 text-right flex-shrink-0 sm:w-24">Size</div>
        <div className="w-24 text-right hidden md:block flex-shrink-0">Date</div>
      </div>
      {items.map((item) => (
        <FileItem key={item.id} item={item} viewMode="list" onContextMenu={onContextMenu} />
      ))}
    </div>
  );
}
