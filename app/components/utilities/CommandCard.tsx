import { TrashIcon, CodeBracketIcon, ArrowRightIcon, ClockIcon } from "@heroicons/react/24/outline";

interface CommandCardProps {
  command: any;
  versionCount: number;
  onEdit: (command: any) => void;
  onDelete: (command: any) => void;
  index: number;
}

/**
 * CommandCard - Individual command display card with metadata and actions
 * Shows command title, version count, creation date, and edit/delete actions
 */
export function CommandCard({
  command,
  versionCount,
  onEdit,
  onDelete,
  index,
}: CommandCardProps) {
  return (
    <div
      onClick={() => onEdit(command)}
      className="group relative bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-150 text-left focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 cursor-pointer"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Subtle hover background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-gray-600/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-150 pointer-events-none"></div>

      {/* Header with title and delete button */}
      <div className="flex justify-between items-start gap-3 relative z-10 mb-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-150 line-clamp-2 flex-grow">
          {command.title}
        </h2>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(command);
          }}
          className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-150 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-600 min-h-[32px] min-w-[32px] flex items-center justify-center"
          aria-label="Delete command"
          title="Delete command"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Metadata: versions and date */}
      <div className="flex items-center justify-between gap-1.5 text-xs relative z-10 mb-3">
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
          <ClockIcon className="h-3 w-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <span className="text-gray-600 dark:text-gray-400">
            {versionCount} {versionCount === 1 ? "version" : "versions"}
          </span>
        </div>
        <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {new Date(command.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Call-to-action footer */}
      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-150 text-xs font-medium relative z-10">
        <CodeBracketIcon className="h-3.5 w-3.5" />
        <span>View & Edit</span>
        <ArrowRightIcon className="h-3 w-3 group-hover:translate-x-0.5 transition-transform duration-150" />
      </div>
    </div>
  );
}
