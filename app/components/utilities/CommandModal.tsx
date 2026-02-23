import { useEffect } from "react";
import { useFetcher } from "react-router";
import { XMarkIcon, CheckIcon } from "@heroicons/react/24/outline";
import { VersionTimeline } from "./VersionTimeline";

interface CommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCommand: any | null;
  commandTitle: string;
  commandContent: string;
  currentVersion: number | null;
  allVersions: any[];
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onCurrentVersionChange: (version: number) => void;
  onLastSubmitTimeChange: (time: number) => void;
  lastSubmitTime: number;
}

/**
 * CommandModal - Create/edit command with version history sidebar
 * Uses lastSubmitTime to prevent stale data from triggering closes
 */
export function CommandModal({
  isOpen,
  onClose,
  editingCommand,
  commandTitle,
  commandContent,
  currentVersion,
  allVersions,
  onTitleChange,
  onContentChange,
  onCurrentVersionChange,
  onLastSubmitTimeChange,
  lastSubmitTime,
}: CommandModalProps) {
  const fetcher = useFetcher();

  // Handle version loading when loadVersion action completes
  useEffect(() => {
    if (
      fetcher.data?.command &&
      fetcher.state === "idle" &&
      fetcher.data._action === "loadVersion"
    ) {
      onContentChange(fetcher.data.command);
    }
  }, [fetcher.data, fetcher.state, onContentChange]);

  // Handle new version selection after successful update
  useEffect(() => {
    if (
      fetcher.data?.newVersion !== undefined &&
      fetcher.state === "idle" &&
      fetcher.data._action === "update"
    ) {
      onCurrentVersionChange(fetcher.data.newVersion);
    }
  }, [fetcher.data, fetcher.state, onCurrentVersionChange]);

  if (!isOpen) return null;

  const latestVersions = editingCommand
    ? allVersions
        .filter((v: any) => v.commandId === editingCommand.id)
        .sort((a: any, b: any) => b.version - a.version)
    : [];

  const handleSubmit = () => {
    onLastSubmitTimeChange(Date.now());
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 z-50">
      <div className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-4xl relative transform transition-all duration-300 ease-out max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-300 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {editingCommand ? "Edit Command" : "New Command"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-grow">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Command Form */}
            <div className="lg:col-span-2">
              <fetcher.Form method="post" className="space-y-6">
                {editingCommand && (
                  <input
                    type="hidden"
                    name="id"
                    value={editingCommand.id}
                  />
                )}
                <input
                  type="hidden"
                  name="_action"
                  value={editingCommand ? "update" : "add"}
                />

                {/* Title Field */}
                <div>
                  <label
                    htmlFor="command-title"
                    className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
                  >
                    Command Title
                  </label>
                  <input
                    id="command-title"
                    type="text"
                    name="title"
                    placeholder="Give your command a descriptive title"
                    value={commandTitle}
                    onChange={(e) => onTitleChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all duration-150"
                    required
                  />
                </div>

                {/* Content Field */}
                <div>
                  <label
                    htmlFor="command-content"
                    className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
                  >
                    Command Content
                  </label>
                  <div className="relative">
                    <textarea
                      id="command-content"
                      name="command"
                      placeholder="Enter your command code here..."
                      value={commandContent}
                      onChange={(e) => onContentChange(e.target.value)}
                      className="w-full h-72 px-3.5 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-sm font-mono placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all duration-150 resize-none"
                      required
                    />
                    <div className="absolute right-3 bottom-3 text-xs text-gray-500 dark:text-gray-400">
                      {commandContent.length} characters
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={fetcher.state === "submitting"}
                    onClick={handleSubmit}
                    className="flex-1 inline-flex justify-center items-center gap-2 bg-gray-900 dark:bg-gray-800 hover:bg-gray-800 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-gray-100 font-semibold text-sm px-4 py-2.5 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 min-h-[40px]"
                  >
                    {fetcher.state === "submitting" ? (
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
                        {editingCommand ? "Saving..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4" />
                        {editingCommand ? "Save Changes" : "Create Command"}
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 min-h-[40px]"
                  >
                    Cancel
                  </button>
                </div>
              </fetcher.Form>
            </div>

            {/* Right Column - Version History */}
            {editingCommand && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Version History
                </h3>
                {latestVersions.length === 0 ? (
                  <div className="text-center p-4 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No version history available.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 text-sm text-gray-700 dark:text-gray-300">
                      {currentVersion !== null && (
                        <p className="font-medium">
                          Currently viewing version {currentVersion}
                        </p>
                      )}
                    </div>
                    <VersionTimeline
                      versions={latestVersions}
                      currentVersion={currentVersion}
                      onSelectVersion={(selectedVersion: any) => {
                        onCurrentVersionChange(selectedVersion.version);
                        fetcher.submit(
                          {
                            _action: "loadVersion",
                            versionId: selectedVersion.id.toString(),
                          },
                          { method: "post" }
                        );
                      }}
                    />
                  </>
                )}
                <div className="mt-6 p-3 bg-gray-200/50 dark:bg-gray-700/50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    About Versioning
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    Each time you save changes to a command, a new version is
                    created. You can view and restore any previous version at
                    any time.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
