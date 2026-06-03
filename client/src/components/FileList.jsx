import FileItem from './FileItem';

export default function FileList({ items, onContextMenu }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
        <div className="w-[38px]" />
        <div className="flex-1">Name</div>
        <div className="w-20 text-right">Size</div>
        <div className="w-24 text-right hidden md:block">Date</div>
      </div>
      {items.map((item) => (
        <FileItem key={item.id} item={item} viewMode="list" onContextMenu={onContextMenu} />
      ))}
    </div>
  );
}
