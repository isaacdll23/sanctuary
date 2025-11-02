import {
  AdjustmentsHorizontalIcon,
  EyeSlashIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

interface TaskFilterBarProps {
  openTasksCount: number;
  hideCompletedTasks: boolean;
  onToggleHideCompleted: () => void;
  filterCategory: string;
  onCategoryChange: (category: string) => void;
  distinctCategories: string[];
}

export default function TaskFilterBar({
  openTasksCount,
  hideCompletedTasks,
  onToggleHideCompleted,
  filterCategory,
  onCategoryChange,
  distinctCategories,
}: TaskFilterBarProps) {
  return (
    <div className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {openTasksCount}{" "}
        <span className="font-normal text-gray-500 dark:text-gray-400">
          Open Task{openTasksCount !== 1 ? "s" : ""}
        </span>
      </p>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
        {/* Hide Completed Toggle */}
        <button
          onClick={onToggleHideCompleted}
          className="flex items-center gap-2 px-3.5 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors duration-150"
        >
          {hideCompletedTasks ? (
            <EyeIcon className="h-4 w-4" />
          ) : (
            <EyeSlashIcon className="h-4 w-4" />
          )}
          {hideCompletedTasks ? "Show Completed" : "Hide Completed"}
        </button>

        {/* Category Filter */}
        <div className="relative">
          <AdjustmentsHorizontalIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
          <select
            value={filterCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="pl-9 pr-3.5 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-medium appearance-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-gray-400 dark:focus:border-gray-600 transition-colors duration-150"
          >
            <option value="">All Categories</option>
            {distinctCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
