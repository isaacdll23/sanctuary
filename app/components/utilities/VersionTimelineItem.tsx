interface VersionTimelineItemProps {
  version: any;
  isActive: boolean;
  onSelect: () => void;
}

/**
 * VersionTimelineItem - Individual version item in the timeline
 * Shows version number, creation date, and active state
 */
export function VersionTimelineItem({
  version,
  isActive,
  onSelect,
}: VersionTimelineItemProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left flex items-center gap-2.5 p-2.5 rounded-lg transition-all duration-150 ${
        isActive
          ? "bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
          : "hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-transparent"
      } focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600`}
    >
      {/* Timeline marker dot */}
      <div
        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-150 ${
          isActive
            ? "bg-gray-800 dark:bg-gray-800 scale-125"
            : "bg-gray-400 dark:bg-gray-500"
        }`}
      ></div>

      {/* Version info */}
      <div className="min-w-0 flex-1">
        <div
          className={`text-sm font-medium transition-colors duration-150 ${
            isActive
              ? "text-gray-900 dark:text-gray-100"
              : "text-gray-700 dark:text-gray-400"
          }`}
        >
          v{version.version}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {new Date(version.createdAt).toLocaleString()}
        </div>
      </div>
    </button>
  );
}
