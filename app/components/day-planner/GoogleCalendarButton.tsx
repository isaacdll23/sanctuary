import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useFetcher } from "react-router";

interface GoogleCalendarButtonProps {
  isConnected: boolean;
  onManualSync?: () => void;
  isSyncing?: boolean;
}

export default function GoogleCalendarButton({
  isConnected,
  onManualSync,
  isSyncing = false,
}: GoogleCalendarButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const fetcher = useFetcher();

  const handleSync = () => {
    if (onManualSync) {
      onManualSync();
    }
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 min-h-[40px]"
      >
        {isConnected ? (
          <>
            <CheckCircleIcon className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">Google Calendar</span>
          </>
        ) : (
          <>
            <XCircleIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium">Not Connected</span>
          </>
        )}
      </button>

      {showMenu && isConnected && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
          <a
            href="/settings"
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors border-b border-gray-200 dark:border-gray-700"
          >
            Settings
          </a>
          <button
            onClick={handleSync}
            disabled={isSyncing || fetcher.state === "submitting"}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors disabled:opacity-50"
          >
            {isSyncing || fetcher.state === "submitting" ? "Syncing..." : "Sync Now"}
          </button>
        </div>
      )}

      {showMenu && !isConnected && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
          <a
            href="/settings"
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
          >
            Connect Calendar
          </a>
        </div>
      )}
    </div>
  );
}
