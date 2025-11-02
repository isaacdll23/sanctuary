import { useFetcher } from "react-router";
import { useEffect } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCommand: any | null;
  onLastSubmitTimeChange: (time: number) => void;
  lastSubmitTime: number;
}

/**
 * DeleteConfirmationModal - Confirmation dialog for deleting commands
 * Uses lastSubmitTime to prevent stale fetcher data
 */
export function DeleteConfirmationModal({
  isOpen,
  onClose,
  targetCommand,
  onLastSubmitTimeChange,
  lastSubmitTime,
}: DeleteConfirmationModalProps) {
  const fetcher = useFetcher();

  // Close modal on successful deletion with lastSubmitTime guard
  useEffect(() => {
    if (fetcher.state === "idle" && lastSubmitTime > 0 && fetcher.data === undefined) {
      onLastSubmitTimeChange(0);
      onClose();
    }
  }, [fetcher.state, fetcher.data, lastSubmitTime, onClose, onLastSubmitTimeChange]);

  if (!isOpen || !targetCommand) return null;

  const isDeleting = fetcher.state === "submitting";

  const handleDelete = () => {
    onLastSubmitTimeChange(Date.now());
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 z-50">
      <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-md relative transform transition-all duration-300 ease-out">
        {/* Icon and Title */}
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30 flex-shrink-0">
            <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Delete Command
          </h2>
        </div>

        {/* Confirmation Text */}
        <p className="mb-6 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            "{targetCommand.title}"
          </span>
          ? This action cannot be undone and all versions will be permanently
          removed.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <fetcher.Form method="post" className="flex-1">
            <input type="hidden" name="_action" value="delete" />
            <input type="hidden" name="id" value={targetCommand.id} />
            <button
              type="submit"
              disabled={isDeleting}
              onClick={handleDelete}
              className="w-full inline-flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 px-4 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-600 min-h-[40px]"
            >
              {isDeleting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                <>
                  <TrashIcon className="h-4 w-4" />
                  Yes, Delete
                </>
              )}
            </button>
          </fetcher.Form>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 min-h-[40px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
