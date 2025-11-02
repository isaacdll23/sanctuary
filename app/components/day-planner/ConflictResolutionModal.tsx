import { useFetcher } from "react-router";
import { useState } from "react";

interface ConflictResolutionModalProps {
  isOpen: boolean;
  mappingId: string;
  localVersion: {
    title: string;
    description: string | null;
    startTime: string;
    durationMinutes: number;
  };
  googleVersion: {
    title: string;
    description?: string;
    startTime: string;
    durationMinutes: number;
  };
  onClose: () => void;
}

export default function ConflictResolutionModal({
  isOpen,
  mappingId,
  localVersion,
  googleVersion,
  onClose,
}: ConflictResolutionModalProps) {
  const fetcher = useFetcher();
  const [selectedResolution, setSelectedResolution] = useState<
    "local-wins" | "remote-wins" | "manual" | null
  >(null);

  if (!isOpen) return null;

  const handleResolve = (resolution: "local-wins" | "remote-wins" | "manual") => {
    setSelectedResolution(resolution);
    fetcher.submit(
      {
        intent: "resolveSyncConflict",
        mappingId,
        resolution,
      },
      { method: "post" }
    );
  };

  const isSubmitting = fetcher.state === "submitting";

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Resolve Sync Conflict
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            The task has been modified in both places. Choose which version to keep.
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Local Version */}
          <div className="p-4 border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              📱 Sanctuary Version
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Title:</span>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {localVersion.title}
                </p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Time:</span>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {localVersion.startTime} ({localVersion.durationMinutes} min)
                </p>
              </div>
              {localVersion.description && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Description:</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                    {localVersion.description}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => handleResolve("local-wins")}
              disabled={isSubmitting}
              className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 min-h-[36px]"
            >
              {isSubmitting && selectedResolution === "local-wins"
                ? "Keeping Local..."
                : "Keep This Version"}
            </button>
          </div>

          {/* Google Version */}
          <div className="p-4 border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              🗓️ Google Calendar Version
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Title:</span>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {googleVersion.title}
                </p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Time:</span>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {googleVersion.startTime} ({googleVersion.durationMinutes} min)
                </p>
              </div>
              {googleVersion.description && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Description:</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                    {googleVersion.description}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => handleResolve("remote-wins")}
              disabled={isSubmitting}
              className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 min-h-[36px]"
            >
              {isSubmitting && selectedResolution === "remote-wins"
                ? "Keeping Google..."
                : "Keep This Version"}
            </button>
          </div>

          {/* Manual Option */}
          <div className="p-4 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              ✏️ Manual Edit
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Review both versions and make a manual edit to merge the changes.
            </p>
            <button
              onClick={() => handleResolve("manual")}
              disabled={isSubmitting}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 min-h-[36px]"
            >
              {isSubmitting && selectedResolution === "manual"
                ? "Opening Editor..."
                : "Open Edit Modal"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-2 sticky bottom-0 bg-white dark:bg-gray-800">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-900 dark:text-gray-100 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors disabled:opacity-50 min-h-[40px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
