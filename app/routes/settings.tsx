import { useFetcher, useLoaderData } from "react-router";
import { useState, useContext, useEffect } from "react";
import { pageAccessLoader } from "~/modules/middleware/pageAccess";
import { ToastContext } from "~/context/ToastContext";
import { getGoogleOAuthUrl } from "~/modules/auth.server";
import {
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

export function meta() {
  return [{ title: "Settings" }];
}

export const loader = pageAccessLoader("settings", async (user, request) => {
  const { getGoogleCalendarAccount, getCalendarPreferences } = await import(
    "~/modules/services/GoogleCalendarService"
  );

  const googleCalendarAccount = await getGoogleCalendarAccount(user.id);
  const calendarPreferences = await getCalendarPreferences(user.id);
  const oauthUrl = getGoogleOAuthUrl();

  return {
    user,
    googleCalendarAccount,
    calendarPreferences,
    oauthUrl,
  };
});

export const action = async ({ request }: any) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent?.startsWith("profile")) {
    const { handleProfileAction } = await import(
      "~/modules/services/ProfileService"
    );
    return handleProfileAction(request);
  } else if (intent?.startsWith("calendar") || intent === "manualSyncGoogleCalendar" || intent === "disconnectGoogleCalendar" || intent === "updateSyncPreferences") {
    const { handleGoogleCalendarAction } = await import(
      "~/modules/services/GoogleCalendarService"
    );
    return handleGoogleCalendarAction(request);
  }

  return { success: false, message: "Unknown action" };
};

type User = {
  id: number;
  username: string;
  email: string;
  timeZone: string;
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

type CalendarPreferences = {
  id: string;
  userId: number;
  calendarViewStartTime: string;
  calendarViewEndTime: string;
  createdAt: Date;
  updatedAt: Date;
};

type LoaderData = {
  user: User;
  googleCalendarAccount: GoogleCalendarAccount | null;
  calendarPreferences: CalendarPreferences | null;
  oauthUrl: string;
};

type ActionData = {
  errors?: { username?: string; email?: string };
  success?: boolean;
  message?: string;
};

export default function Settings() {
  const loaderData = useLoaderData<LoaderData>();
  const { user, googleCalendarAccount, calendarPreferences, oauthUrl } = loaderData;

  const [activeTab, setActiveTab] = useState<"profile" | "calendar">("profile");

  const toastCtx = useContext(ToastContext);

  // Profile state
  const profileFetcher = useFetcher<ActionData>();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    username: user.username,
    email: user.email,
    timeZone: user.timeZone,
  });
  const errors = profileFetcher.data?.errors;
  const success = profileFetcher.data?.success;

  const [toastShown, setToastShown] = useState(false);
  const [passwordResetToastShown, setPasswordResetToastShown] = useState(false);
  const [timezoneToastShown, setTimezoneToastShown] = useState(false);

  const passwordResetFetcher = useFetcher<ActionData>();
  const timezoneFetcher = useFetcher<ActionData>();

  // Calendar state
  const calendarFetcher = useFetcher<ActionData>();
  const [calendarToastShown, setCalendarToastShown] = useState(false);
  const [syncDirection, setSyncDirection] = useState<"pull-only" | "push-only" | "bidirectional">(
    googleCalendarAccount?.syncDirection || "bidirectional"
  );
  const [syncCalendarColors, setSyncCalendarColors] = useState(true);
  const [includeDescription, setIncludeDescription] = useState(true);
  const [calendarViewStartTime, setCalendarViewStartTime] = useState(() => {
    if (calendarPreferences?.calendarViewStartTime) {
      return calendarPreferences.calendarViewStartTime.substring(0, 5);
    }
    return "06:00";
  });
  const [calendarViewEndTime, setCalendarViewEndTime] = useState(() => {
    if (calendarPreferences?.calendarViewEndTime) {
      return calendarPreferences.calendarViewEndTime.substring(0, 5);
    }
    return "22:00";
  });
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  // Profile Effects
  useEffect(() => {
    if (success && toastCtx && !toastShown) {
      toastCtx.addToast("Profile updated successfully.", "success");
      setEditMode(false);
      setToastShown(true);
    }
    if (!success) {
      setToastShown(false);
    }
    // eslint-disable-next-line
  }, [success, toastCtx, toastShown]);

  useEffect(() => {
    if (passwordResetFetcher.data && toastCtx && !passwordResetToastShown) {
      if (passwordResetFetcher.data.success) {
        toastCtx.addToast(
          passwordResetFetcher.data.message || "Password reset email sent!",
          "success"
        );
      } else {
        toastCtx.addToast(
          passwordResetFetcher.data.message || "Failed to send reset email.",
          "error"
        );
      }
      setPasswordResetToastShown(true);
    }
    if (!passwordResetFetcher.data) {
      setPasswordResetToastShown(false);
    }
    // eslint-disable-next-line
  }, [passwordResetFetcher.data, toastCtx, passwordResetToastShown]);

  useEffect(() => {
    if (timezoneFetcher.data && toastCtx && !timezoneToastShown) {
      if (timezoneFetcher.data.success) {
        toastCtx.addToast(
          timezoneFetcher.data.message || "Timezone updated!",
          "success"
        );
      } else {
        toastCtx.addToast(
          timezoneFetcher.data.message || "Failed to update timezone.",
          "error"
        );
      }
      setTimezoneToastShown(true);
    }
    if (!timezoneFetcher.data) {
      setTimezoneToastShown(false);
    }
    // eslint-disable-next-line
  }, [timezoneFetcher.data, toastCtx, timezoneToastShown]);

  // Calendar Effects
  useEffect(() => {
    if (calendarFetcher.data && toastCtx && !calendarToastShown) {
      if (calendarFetcher.data.success) {
        toastCtx.addToast(calendarFetcher.data.message || "Settings updated", "success");
      } else {
        toastCtx.addToast(calendarFetcher.data.message || "An error occurred", "error");
      }
      setCalendarToastShown(true);
    }
    if (!calendarFetcher.data) {
      setCalendarToastShown(false);
    }
  }, [calendarFetcher.data, toastCtx, calendarToastShown]);

  // Profile Handlers
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    profileFetcher.submit({ ...form, intent: "updateProfile" }, { method: "post" });
  }

  function handlePasswordReset() {
    passwordResetFetcher.submit(
      { intent: "requestPasswordReset" },
      { method: "post" }
    );
  }

  function handleTimezoneChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newTimeZone = e.target.value;
    setForm({ ...form, timeZone: newTimeZone });
    timezoneFetcher.submit(
      { intent: "updateTimeZone", timeZone: newTimeZone },
      { method: "post" }
    );
  }

  // Calendar Handlers
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
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your profile and preferences
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-8">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === "profile"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === "calendar"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            Calendar
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Profile Information</h2>

              {!editMode ? (
                <div className="space-y-4">
                  <div>
                    <span className="block text-gray-500 dark:text-gray-300 text-sm">
                      Username
                    </span>
                    <span className="font-semibold text-lg">{user.username}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 dark:text-gray-300 text-sm">
                      Email
                    </span>
                    <span className="font-semibold text-lg">{user.email}</span>
                  </div>
                  <div>
                    <label className="block text-gray-500 dark:text-gray-300 text-sm mb-2">
                      Timezone
                    </label>
                    <select
                      name="timeZone"
                      value={form.timeZone}
                      onChange={handleTimezoneChange}
                      disabled={timezoneFetcher.state === "submitting"}
                      className="w-full bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      <option value="America/New_York">Eastern (ET)</option>
                      <option value="America/Chicago">Central (CT)</option>
                      <option value="America/Denver">Mountain (MT)</option>
                      <option value="America/Los_Angeles">Pacific (PT)</option>
                      <option value="America/Anchorage">Alaska (AKT)</option>
                      <option value="Pacific/Honolulu">Hawaii (HT)</option>
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Europe/Paris">Paris (CET)</option>
                      <option value="Asia/Tokyo">Tokyo (JST)</option>
                      <option value="Australia/Sydney">Sydney (AEDT)</option>
                    </select>
                    {timezoneFetcher.state === "submitting" && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Updating timezone...
                      </span>
                    )}
                  </div>
                  <div className="space-y-3 mt-6">
                    <button
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition-colors"
                      onClick={() => setEditMode(true)}
                    >
                      Edit Profile
                    </button>
                    <button
                      className="w-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-900 dark:text-gray-100 font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                      onClick={handlePasswordReset}
                      disabled={passwordResetFetcher.state === "submitting"}
                    >
                      <KeyIcon className="w-4 h-4" />
                      {passwordResetFetcher.state === "submitting"
                        ? "Sending Reset Email..."
                        : "Request Password Reset"}
                    </button>
                  </div>
                </div>
              ) : (
                <profileFetcher.Form
                  method="post"
                  className="space-y-4"
                  onSubmit={handleEdit}
                  aria-live="polite"
                >
                  <input type="hidden" name="intent" value="updateProfile" />
                  <div>
                    <label
                      className="block text-gray-500 dark:text-gray-300 text-sm mb-1"
                      htmlFor="username"
                    >
                      Username
                    </label>
                    <input
                      className="w-full bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-gray-400 dark:placeholder-gray-300"
                      type="text"
                      name="username"
                      id="username"
                      value={form.username}
                      onChange={handleChange}
                      required
                      aria-label="Username"
                      disabled={profileFetcher.state === "submitting"}
                    />
                    {errors?.username && (
                      <p className="text-red-400 text-sm mt-1">{errors.username}</p>
                    )}
                  </div>
                  <div>
                    <label
                      className="block text-gray-500 dark:text-gray-300 text-sm mb-1"
                      htmlFor="email"
                    >
                      Email
                    </label>
                    <input
                      className="w-full bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder-gray-400 dark:placeholder-gray-300"
                      type="email"
                      name="email"
                      id="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      aria-label="Email"
                      disabled={profileFetcher.state === "submitting"}
                    />
                    {errors?.email && (
                      <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>
                  <div>
                    <label
                      className="block text-gray-500 dark:text-gray-300 text-sm mb-1"
                      htmlFor="timeZone"
                    >
                      Timezone
                    </label>
                    <select
                      name="timeZone"
                      id="timeZone"
                      value={form.timeZone}
                      onChange={handleChange}
                      disabled={profileFetcher.state === "submitting"}
                      className="w-full bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      <option value="America/New_York">Eastern (ET)</option>
                      <option value="America/Chicago">Central (CT)</option>
                      <option value="America/Denver">Mountain (MT)</option>
                      <option value="America/Los_Angeles">Pacific (PT)</option>
                      <option value="America/Anchorage">Alaska (AKT)</option>
                      <option value="Pacific/Honolulu">Hawaii (HT)</option>
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Europe/Paris">Paris (CET)</option>
                      <option value="Asia/Tokyo">Tokyo (JST)</option>
                      <option value="Australia/Sydney">Sydney (AEDT)</option>
                    </select>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <button
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition-colors"
                      disabled={profileFetcher.state === "submitting"}
                    >
                      {profileFetcher.state === "submitting" ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-900 dark:text-gray-100 font-semibold py-2 rounded-lg transition-colors"
                      onClick={() => setEditMode(false)}
                      disabled={profileFetcher.state === "submitting"}
                    >
                      Cancel
                    </button>
                  </div>
                  {(errors?.username || errors?.email) && (
                    <div className="sr-only" aria-live="polite">
                      {errors?.username && <div>{errors.username}</div>}
                      {errors?.email && <div>{errors.email}</div>}
                    </div>
                  )}
                </profileFetcher.Form>
              )}
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === "calendar" && (
          <div className="space-y-6">
            {/* Connection Status */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
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
            {googleCalendarAccount && googleCalendarAccount.isSyncEnabled === 1 && (
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
    </div>
  );
}
