import {
  AdjustmentsHorizontalIcon,
  EyeSlashIcon,
  EyeIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  Bars3Icon,
  QueueListIcon,
} from "@heroicons/react/24/outline";

interface TaskFilterBarProps {
  openTasksCount: number;
  hideCompletedTasks: boolean;
  onToggleHideCompleted: () => void;
  filterCategory: string;
  onCategoryChange: (category: string) => void;
  distinctCategories: string[];
  isCompactView: boolean;
  onToggleCompactView: () => void;
  viewMode: "card" | "table";
  onViewModeChange: (mode: "card" | "table") => void;
}

export default function TaskFilterBar({
  openTasksCount,
  hideCompletedTasks,
  onToggleHideCompleted,
  filterCategory,
  onCategoryChange,
  distinctCategories,
  isCompactView,
  onToggleCompactView,
  viewMode,
  onViewModeChange,
}: TaskFilterBarProps) {
  return (
    <div
      className={`mb-8 p-4 bg-white/80 dark:bg-gray-800/60 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 ${
        isCompactView ? "mb-4 p-2 text-sm" : ""
      }`}
    >
      <p
        className={`text-gray-700 dark:text-gray-300 font-medium ${
          isCompactView ? "text-xs" : "text-sm"
        }`}
      >
        {openTasksCount}{" "}
        <span className="font-normal text-gray-500 dark:text-gray-400">
          Open Task{openTasksCount !== 1 ? "s" : ""}
        </span>
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-2 md:gap-3">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700/50 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange("card")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              viewMode === "card"
                ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <Bars3Icon className="h-4 w-4" />
            <span className="text-xs sm:text-sm font-medium">Card</span>
          </button>
          <button
            onClick={() => onViewModeChange("table")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              viewMode === "table"
                ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            <QueueListIcon className="h-4 w-4" />
            <span className="text-xs sm:text-sm font-medium">Table</span>
          </button>
        </div>

        {/* Hide Completed Toggle */}
        <button
          onClick={onToggleHideCompleted}
          className={`flex items-center gap-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/50 dark:hover:bg-gray-600/50 rounded-lg transition-colors duration-200 ${
            isCompactView ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-xs sm:text-sm"
          }`}
        >
          {hideCompletedTasks ? (
            <EyeIcon className={`h-4 w-4 ${isCompactView ? "h-3 w-3" : ""}`} />
          ) : (
            <EyeSlashIcon className={`h-4 w-4 ${isCompactView ? "h-3 w-3" : ""}`} />
          )}
          {hideCompletedTasks ? "Show Completed" : "Hide Completed"}
        </button>

        {/* Category Filter */}
        <div className="relative">
          <AdjustmentsHorizontalIcon
            className={`text-gray-500 dark:text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
              isCompactView ? "h-4 w-4 left-2" : "h-5 w-5"
            }`}
          />
          <select
            value={filterCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={`border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors duration-200 appearance-none bg-white dark:bg-gray-700/50 ${
              isCompactView
                ? "pl-8 pr-3 py-1.5 text-xs"
                : "pl-10 pr-4 py-2 text-xs sm:text-sm"
            }`}
          >
            <option value="">All Categories</option>
            {distinctCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Compact View Toggle - Only show in card mode */}
        {viewMode === "card" && (
          <button
            onClick={onToggleCompactView}
            className={`flex items-center gap-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-gray-700/50 dark:hover:bg-gray-600/50 rounded-lg transition-colors duration-200 ${
              isCompactView ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-xs sm:text-sm"
            }`}
          >
            {isCompactView ? (
              <ArrowsPointingOutIcon
                className={`h-4 w-4 ${isCompactView ? "h-3 w-3" : ""}`}
              />
            ) : (
              <ArrowsPointingInIcon
                className={`h-4 w-4 ${isCompactView ? "h-3 w-3" : ""}`}
              />
            )}
            {isCompactView ? "Standard" : "Compact"}
          </button>
        )}
      </div>
    </div>
  );
}
