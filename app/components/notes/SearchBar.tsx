import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";

export function SearchBar({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}) {
  const handleClear = () => {
    setSearchQuery("");
  };

  return (
    <div className="mb-4">
      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none flex-shrink-0" />
        <input
          type="text"
          placeholder="Search notes..."
          className="w-full px-3 py-2.5 pl-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent transition-all duration-150"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search notes"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-150"
            aria-label="Clear search"
            title="Clear search"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
