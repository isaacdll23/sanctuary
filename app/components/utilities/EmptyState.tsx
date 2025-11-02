import { CodeBracketIcon, PlusIcon } from "@heroicons/react/24/outline";

interface EmptyStateProps {
  onCreateNew: () => void;
}

/**
 * EmptyState - Shown when no commands exist
 * Provides guidance and action button to create first command
 */
export function EmptyState({ onCreateNew }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-700 max-w-md mx-auto">
      <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-xl inline-flex mb-6">
        <CodeBracketIcon className="h-12 w-12 text-gray-600 dark:text-gray-400" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        No Commands Yet
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Start creating command snippets to organize and quickly access your
        frequently used commands.
      </p>
      <button
        onClick={onCreateNew}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-medium text-sm rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 min-h-[40px]"
      >
        <PlusIcon className="h-4 w-4" />
        Create Your First Command
      </button>
    </div>
  );
}
