export function Badge({ children, onClick, className = "" }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded-full cursor-pointer hover:bg-gray-300 ${className}`}
      onClick={onClick}
    >
      {children}
    </span>
  );
}
