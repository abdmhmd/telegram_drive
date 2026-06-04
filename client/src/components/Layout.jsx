export default function Layout({ children }) {
  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-950 overflow-x-hidden">
      {children}
    </div>
  );
}
