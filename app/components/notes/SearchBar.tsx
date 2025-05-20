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
        <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search notes..."
          className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 pl-10 focus:ring-purple-500 focus:border-purple-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
    </div>
  );
}
