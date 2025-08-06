import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export function SearchBar({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}) {
  return (
    <div className="mb-4">
      <div className="relative">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-600 dark:text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search notes..."
          className="w-full bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 rounded-lg p-2 pl-10 focus:ring-purple-500 focus:border-purple-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>
  );
}
