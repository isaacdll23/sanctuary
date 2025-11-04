import { useState } from "react";

interface ExpensesCategoryFilterProps {
  distinctCategories: string[];
  filterCategories: string[];
  onToggleCategory: (category: string) => void;
  onClearFilters: () => void;
}

export default function ExpensesCategoryFilter({
  distinctCategories,
  filterCategories,
  onToggleCategory,
  onClearFilters,
}: ExpensesCategoryFilterProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="relative z-20 mb-6 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm p-4">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-fit">
          Filter by Category:
        </label>
        <div className="relative w-full md:w-auto">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full md:w-auto px-4 py-2.5 text-sm bg-gray-100 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150 flex justify-between items-center"
          >
            {filterCategories.length > 0
              ? filterCategories.join(", ")
              : "All Categories"}
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={showDropdown ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
              />
            </svg>
          </button>
          {showDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
              {distinctCategories.map((cat) => (
                <label
                  key={cat}
                  className="flex items-center px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors duration-150"
                >
                  <input
                    type="checkbox"
                    value={cat}
                    checked={filterCategories.includes(cat)}
                    onChange={() => onToggleCategory(cat)}
                    className="mr-3 rounded text-gray-900 dark:bg-gray-600 dark:border-gray-500 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
                  />
                  <span className="text-gray-900 dark:text-gray-100">
                    {cat}
                  </span>
                </label>
              ))}
              {filterCategories.length > 0 && (
                <div className="border-t border-gray-300 dark:border-gray-600 p-2">
                  <button
                    onClick={() => {
                      onClearFilters();
                      setShowDropdown(false);
                    }}
                    className="w-full px-3 py-1.5 text-xs text-center bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 rounded text-gray-900 dark:text-white transition-colors duration-150"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
