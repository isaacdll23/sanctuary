import { useFetcher } from "react-router";
import { useState, useEffect } from "react";
import { useToast } from "~/hooks/useToast";
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

interface GoogleCalendarAccount {
  id: string;
  userId: number;
  googleAccountEmail: string;
  googleCalendarId: string;
  isSyncEnabled: number;
  syncDirection: "pull-only" | "push-only" | "bidirectional";
  lastSyncAt: Date | null;
  connectedAt: Date;
  disconnectedAt: Date | null;
}

interface CalendarPreferences {
  id: string;
  userId: number;
  calendarViewStartTime: string;
  calendarViewEndTime: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CalendarSettingsSectionProps {
  googleCalendarAccount: GoogleCalendarAccount | null;
  calendarPreferences: CalendarPreferences | null;
  oauthUrl: string;
}

export default function CalendarSettingsSection({
  googleCalendarAccount: initialGoogleCalendarAccount,
  calendarPreferences: initialCalendarPreferences,
  oauthUrl,
}: CalendarSettingsSectionProps) {
  const calendarFetcher = useFetcher<any>();
  const { addToast } = useToast();

  const [calendarToastShown, setCalendarToastShown] = useState(false);
  const [syncDirection, setSyncDirection] = useState<"pull-only" | "push-only" | "bidirectional">(
    initialGoogleCalendarAccount?.syncDirection || "bidirectional"
  );
  const [syncCalendarColors, setSyncCalendarColors] = useState(true);
  const [includeDescription, setIncludeDescription] = useState(true);
  const [calendarViewStartTime, setCalendarViewStartTime] = useState(() => {
    if (initialCalendarPreferences?.calendarViewStartTime) {
      return initialCalendarPreferences.calendarViewStartTime.substring(0, 5);
    }
    return "06:00";
  });
  const [calendarViewEndTime, setCalendarViewEndTime] = useState(() => {
    if (initialCalendarPreferences?.calendarViewEndTime) {
      return initialCalendarPreferences.calendarViewEndTime.substring(0, 5);
    }
    return "22:00";
  });
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  // Calendar Effects
  useEffect(() => {
    if (calendarFetcher.data && !calendarToastShown) {
      if (calendarFetcher.data.success) {
        addToast(calendarFetcher.data.message || "Settings updated", "success");
      } else {
        addToast(calendarFetcher.data.message || "An error occurred", "error");
      }
      setCalendarToastShown(true);
    }
    if (!calendarFetcher.data) {
      setCalendarToastShown(false);
    }
  }, [calendarFetcher.data, calendarToastShown, addToast]);

  const handleUpdatePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    calendarFetcher.submit(
      {
        intent: "updateSyncPreferences",
        syncDirection,
        syncCalendarColors: String(syncCalendarColors),
        includeDescription: String(includeDescription),
      },
      { method: "post" }
    );
  };

  const handleUpdateCalendarPreferences = (e: React.FormEvent) => {
    e.preventDefault();
    const startTimeWithSeconds = `${calendarViewStartTime}:00`;
    const endTimeWithSeconds = `${calendarViewEndTime}:00`;

    calendarFetcher.submit(
      {
        intent: "updateCalendarPreferences",
        calendarViewStartTime: startTimeWithSeconds,
        calendarViewEndTime: endTimeWithSeconds,
      },
      { method: "post" }
    );
  };

  const handleManualSync = () => {
    calendarFetcher.submit(
      {
        intent: "manualSyncGoogleCalendar",
        planDate: new Date().toISOString().split("T")[0],
      },
      { method: "post" }
    );
  };

  const handleDisconnect = () => {
    calendarFetcher.submit({ intent: "disconnectGoogleCalendar" }, { method: "post" });
    setShowDisconnectConfirm(false);
  };

  const isCalendarLoading = calendarFetcher.state === "submitting";

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          {initialGoogleCalendarAccount && initialGoogleCalendarAccount.isSyncEnabled === 1 ? (
            <>
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
              Connected
            </>
          ) : (
            <>
              <XCircleIcon className="w-5 h-5 text-gray-400" />
              Not Connected
            </>
          )}
        </h2>

        {initialGoogleCalendarAccount && initialGoogleCalendarAccount.isSyncEnabled === 1 ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Google Account</p>
              <p className="font-medium">{initialGoogleCalendarAccount.googleAccountEmail}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Connected Since</p>
              <p className="font-medium">
                {new Date(initialGoogleCalendarAccount.connectedAt).toLocaleDateString()}
              </p>
            </div>

            {initialGoogleCalendarAccount.lastSyncAt && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Synced</p>
                <p className="font-medium">
                  {new Date(initialGoogleCalendarAccount.lastSyncAt).toLocaleString()}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleManualSync}
                disabled={isCalendarLoading}
                className="flex-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 min-h-[40px] focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
              >
                {isCalendarLoading ? "Syncing..." : "Sync Now"}
              </button>

              <button
                onClick={() => setShowDisconnectConfirm(true)}
                disabled={isCalendarLoading}
                className="flex-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 min-h-[40px] focus:ring-2 focus:ring-red-400 dark:focus:ring-red-600"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Connect your Google Calendar to sync tasks and events between Sanctuary and Google Calendar.
            </p>
            <a
              href={oauthUrl}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-600 min-h-[40px]"
            >
              Connect Google Calendar
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>

      {/* Sync Preferences */}
      {initialGoogleCalendarAccount && initialGoogleCalendarAccount.isSyncEnabled === 1 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Sync Preferences</h2>

          <form onSubmit={handleUpdatePreferences} className="space-y-4">
            <div>
              <label htmlFor="syncDirection" className="block text-sm font-medium mb-2">
                Sync Direction
              </label>
              <select
                id="syncDirection"
                value={syncDirection}
                onChange={(e) => setSyncDirection(e.target.value as any)}
                disabled={isCalendarLoading}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 disabled:opacity-50"
              >
                <option value="bidirectional">Bidirectional (Sync Both Ways)</option>
                <option value="pull-only">Pull Only (Google → Sanctuary)</option>
                <option value="push-only">Push Only (Sanctuary → Google)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {syncDirection === "bidirectional"
                  ? "Changes in either location will sync to the other"
                  : syncDirection === "pull-only"
                    ? "Only Google Calendar events will be synced to Sanctuary"
                    : "Only Sanctuary tasks will be synced to Google Calendar"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="syncColors"
                checked={syncCalendarColors}
                onChange={(e) => setSyncCalendarColors(e.target.checked)}
                disabled={isCalendarLoading}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <label htmlFor="syncColors" className="text-sm font-medium cursor-pointer">
                Sync Calendar Colors
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="includeDescription"
                checked={includeDescription}
                onChange={(e) => setIncludeDescription(e.target.checked)}
                disabled={isCalendarLoading}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <label htmlFor="includeDescription" className="text-sm font-medium cursor-pointer">
                Include Task Descriptions in Google Events
              </label>
            </div>

            <button
              type="submit"
              disabled={isCalendarLoading}
              className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 min-h-[40px] focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 mt-6"
            >
              {isCalendarLoading ? "Saving..." : "Save Preferences"}
            </button>
          </form>
        </div>
      )}

      {/* Calendar View Preferences */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Calendar View</h2>

        <form onSubmit={handleUpdateCalendarPreferences} className="space-y-4">
          <div>
            <label htmlFor="calendarViewStartTime" className="block text-sm font-medium mb-2">
              Calendar View Start Time
            </label>
            <input
              type="time"
              id="calendarViewStartTime"
              value={calendarViewStartTime}
              onChange={(e) => setCalendarViewStartTime(e.target.value)}
              disabled={isCalendarLoading}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              The earliest time shown in your calendar view
            </p>
          </div>

          <div>
            <label htmlFor="calendarViewEndTime" className="block text-sm font-medium mb-2">
              Calendar View End Time
            </label>
            <input
              type="time"
              id="calendarViewEndTime"
              value={calendarViewEndTime}
              onChange={(e) => setCalendarViewEndTime(e.target.value)}
              disabled={isCalendarLoading}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              The latest time shown in your calendar view
            </p>
          </div>

          <button
            type="submit"
            disabled={isCalendarLoading}
            className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 min-h-[40px] focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 mt-6"
          >
            {isCalendarLoading ? "Saving..." : "Save Calendar View"}
          </button>
        </form>
      </div>

      {/* Disconnect Confirmation Modal */}
      {showDisconnectConfirm && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-6 max-w-sm w-full transform transition-all scale-100">
            <h3 className="text-lg font-bold mb-2">Disconnect Google Calendar?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You can reconnect anytime, but sync relationships will need to be re-established.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDisconnectConfirm(false)}
                disabled={isCalendarLoading}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 min-h-[40px]"
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                disabled={isCalendarLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 min-h-[40px] focus:ring-2 focus:ring-red-400"
              >
                {isCalendarLoading ? "Disconnecting..." : "Disconnect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
