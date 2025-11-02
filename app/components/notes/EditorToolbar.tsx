import { ArrowUturnLeftIcon, ArrowUturnRightIcon } from "@heroicons/react/24/outline";

interface EditorToolbarProps {
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isSubmitting?: boolean;
}

export function EditorToolbar({
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  isSubmitting = false,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      {/* Undo Button */}
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo || isSubmitting}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all duration-150"
      >
        <ArrowUturnLeftIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Redo Button */}
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo || isSubmitting}
        title="Redo (Ctrl+Y)"
        aria-label="Redo"
        className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all duration-150"
      >
        <ArrowUturnRightIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

      {/* Placeholder for future formatting tools */}
      <div className="text-xs text-gray-500 dark:text-gray-400 ml-2">
        More tools coming in Phase 2
      </div>
    </div>
  );
}
