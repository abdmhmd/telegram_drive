import FileItem from './FileItem';

export default function FileGrid({ items, onContextMenu }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {items.map((item) => (
        <FileItem key={item.id} item={item} viewMode="grid" onContextMenu={onContextMenu} />
      ))}
    </div>
  );
}
