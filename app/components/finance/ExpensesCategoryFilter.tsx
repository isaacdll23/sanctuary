import { useEffect, useId, useRef, useState } from "react";

interface ExpensesCategoryFilterProps {
  distinctCategories: string[];
  filterCategories: string[];
  onToggleCategory: (category: string) => void;
  onClearFilters: () => void;
}

export default function ExpensesCategoryFilter({ distinctCategories, filterCategories, onToggleCategory, onClearFilters }: ExpensesCategoryFilterProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setShowDropdown(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showDropdown) {
        setShowDropdown(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, [showDropdown]);

  return (
    <div className="relative z-20 mb-6 rounded-lg border border-gray-300 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col items-start gap-3 md:flex-row md:items-center">
        <span id={`${menuId}-label`} className="min-w-fit text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Category:</span>
        <div ref={containerRef} className="relative w-full md:w-auto">
          <button ref={buttonRef} id={`${menuId}-button`} type="button" aria-expanded={showDropdown} aria-controls={menuId} aria-labelledby={`${menuId}-label ${menuId}-button`} onClick={() => setShowDropdown((open) => !open)} className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-900 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 md:w-auto dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:focus:ring-gray-600">
            {filterCategories.length ? filterCategories.join(", ") : "All Categories"}
            <svg aria-hidden="true" className="ml-2 h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showDropdown ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} /></svg>
          </button>
          {showDropdown && <div id={menuId} role="group" aria-labelledby={`${menuId}-label`} className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
            {distinctCategories.map((category) => <label key={category} className="flex cursor-pointer items-center px-4 py-2.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-600"><input type="checkbox" checked={filterCategories.includes(category)} onChange={() => onToggleCategory(category)} className="mr-3 rounded text-gray-900 focus:ring-2 focus:ring-gray-400 dark:border-gray-500 dark:bg-gray-600 dark:focus:ring-gray-600" /><span className="text-gray-900 dark:text-gray-100">{category}</span></label>)}
            {filterCategories.length > 0 && <div className="border-t border-gray-300 p-2 dark:border-gray-600"><button type="button" onClick={() => { onClearFilters(); setShowDropdown(false); }} className="w-full rounded bg-gray-200 px-3 py-1.5 text-center text-xs text-gray-900 transition-colors hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500">Clear Filters</button></div>}
          </div>}
        </div>
      </div>
    </div>
  );
}
