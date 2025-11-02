import { useFetcher, useLoaderData } from "react-router";
import { useState, useContext, useEffect } from "react";
import { pageAccessLoader } from "~/modules/middleware/pageAccess";
import { ToastContext } from "~/context/ToastContext";
import { getGoogleOAuthUrl } from "~/modules/auth.server";
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

export function meta() {
  return [{ title: "Calendar Settings - Sanctuary" }];
}

export const loader = pageAccessLoader("calendar-settings", async (user, request) => {
  const { getGoogleCalendarAccount } = await import(
    "~/modules/services/GoogleCalendarService"
  );

  const googleCalendarAccount = await getGoogleCalendarAccount(user.id);
  const oauthUrl = getGoogleOAuthUrl();

  return {
    user,
    googleCalendarAccount,
    oauthUrl,
  };
});

export const action = async ({ request }: any) => {
  const { handleGoogleCalendarAction } = await import(
    "~/modules/services/GoogleCalendarService"
  );
  return handleGoogleCalendarAction(request);
};

type GoogleCalendarAccount = {
  id: string;
  userId: number;
  googleAccountEmail: string;
  googleCalendarId: string;
  isSyncEnabled: number;
  syncDirection: "pull-only" | "push-only" | "bidirectional";
  lastSyncAt: Date | null;
  connectedAt: Date;
  disconnectedAt: Date | null;
};

type LoaderData = {
  user: {
    id: number;
    username: string;
    email: string;
    timeZone: string;
    googleCalendarConnected: number;
  };
  googleCalendarAccount: GoogleCalendarAccount | null;
  oauthUrl: string;
};

type ActionData = {
  success?: boolean;
  message?: string;
};

export default function CalendarSettings() {
  const { user, googleCalendarAccount, oauthUrl } = useLoaderData<LoaderData>();
  const fetcher = useFetcher<ActionData>();
  const toastCtx = useContext(ToastContext);
  const [toastShown, setToastShown] = useState(false);
  const [syncDirection, setSyncDirection] = useState<"pull-only" | "push-only" | "bidirectional">(
    googleCalendarAccount?.syncDirection || "bidirectional"
  );
  const [syncCalendarColors, setSyncCalendarColors] = useState(true);
  const [includeDescription, setIncludeDescription] = useState(true);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  useEffect(() => {
    if (fetcher.data && toastCtx && !toastShown) {
      if (fetcher.data.success) {
        toastCtx.addToast(fetcher.data.message || "Settings updated", "success");
      } else {
        toastCtx.addToast(fetcher.data.message || "An error occurred", "error");
      }
      setToastShown(true);
    }
    if (!fetcher.data) {
      setToastShown(false);
    }
  }, [fetcher.data, toastCtx, toastShown]);

  const handleUpdatePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    fetcher.submit(
      {
        intent: "updateSyncPreferences",
        syncDirection,
        syncCalendarColors: String(syncCalendarColors),
        includeDescription: String(includeDescription),
      },
      { method: "post" }
    );
  };

  const handleManualSync = () => {
    fetcher.submit(
      {
        intent: "manualSyncGoogleCalendar",
        planDate: new Date().toISOString().split("T")[0],
      },
      { method: "post" }
    );
  };

  const handleDisconnect = () => {
    fetcher.submit({ intent: "disconnectGoogleCalendar" }, { method: "post" });
    setShowDisconnectConfirm(false);
  };

  const isLoading = fetcher.state === "submitting";

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Calendar Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your Google Calendar integration and sync preferences
          </p>
        </div>

        {/* Connection Status */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {googleCalendarAccount && googleCalendarAccount.isSyncEnabled === 1 ? (
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

          {googleCalendarAccount && googleCalendarAccount.isSyncEnabled === 1 ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Google Account</p>
                <p className="font-medium">{googleCalendarAccount.googleAccountEmail}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Connected Since</p>
                <p className="font-medium">
                  {new Date(googleCalendarAccount.connectedAt).toLocaleDateString()}
                </p>
              </div>

              {googleCalendarAccount.lastSyncAt && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Last Synced</p>
                  <p className="font-medium">
                    {new Date(googleCalendarAccount.lastSyncAt).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleManualSync}
                  disabled={isLoading}
                  className="flex-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 min-h-[40px] focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
                >
                  {isLoading ? "Syncing..." : "Sync Now"}
                </button>

                <button
                  onClick={() => setShowDisconnectConfirm(true)}
                  disabled={isLoading}
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
        {googleCalendarAccount && googleCalendarAccount.isSyncEnabled === 1 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Sync Preferences</h2>

            <form onSubmit={handleUpdatePreferences} className="space-y-4">
              {/* Sync Direction */}
              <div>
                <label htmlFor="syncDirection" className="block text-sm font-medium mb-2">
                  Sync Direction
                </label>
                <select
                  id="syncDirection"
                  value={syncDirection}
                  onChange={(e) => setSyncDirection(e.target.value as any)}
                  disabled={isLoading}
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

              {/* Calendar Colors */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="syncColors"
                  checked={syncCalendarColors}
                  onChange={(e) => setSyncCalendarColors(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <label htmlFor="syncColors" className="text-sm font-medium cursor-pointer">
                  Sync Calendar Colors
                </label>
              </div>

              {/* Include Description */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="includeDescription"
                  checked={includeDescription}
                  onChange={(e) => setIncludeDescription(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 cursor-pointer"
                />
                <label htmlFor="includeDescription" className="text-sm font-medium cursor-pointer">
                  Include Task Descriptions in Google Events
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 min-h-[40px] focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 mt-6"
              >
                {isLoading ? "Saving..." : "Save Preferences"}
              </button>
            </form>
          </div>
        )}

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
                  disabled={isLoading}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 min-h-[40px] focus:ring-2 focus:ring-red-400"
                >
                  {isLoading ? "Disconnecting..." : "Disconnect"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
