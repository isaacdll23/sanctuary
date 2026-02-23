import { useFetcher } from "react-router";
import { useState, useEffect } from "react";
import { useToast } from "~/hooks/useToast";
import { KeyIcon } from "@heroicons/react/24/outline";

interface User {
  id: number;
  username: string;
  email: string;
  timeZone: string;
}

interface ProfileSettingsSectionProps {
  user: User;
}

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Australia/Sydney", label: "Sydney (AEDT)" },
];

export default function ProfileSettingsSection({ user }: ProfileSettingsSectionProps) {
  const profileFetcher = useFetcher<any>();
  const passwordResetFetcher = useFetcher<any>();
  const timezoneFetcher = useFetcher<any>();
  const { addToast } = useToast();

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    username: user.username,
    email: user.email,
    timeZone: user.timeZone,
  });
  const [toastShown, setToastShown] = useState(false);
  const [passwordResetToastShown, setPasswordResetToastShown] = useState(false);
  const [timezoneToastShown, setTimezoneToastShown] = useState(false);

  const errors = profileFetcher.data?.errors;
  const success = profileFetcher.data?.success;

  // Profile Effects
  useEffect(() => {
    if (success && !toastShown) {
      addToast("Profile updated successfully.", "success");
      setEditMode(false);
      setToastShown(true);
    }
    if (!success) {
      setToastShown(false);
    }
  }, [success, toastShown, addToast]);

  useEffect(() => {
    if (passwordResetFetcher.data && !passwordResetToastShown) {
      if (passwordResetFetcher.data.success) {
        addToast(
          passwordResetFetcher.data.message || "Password reset email sent!",
          "success"
        );
      } else {
        addToast(
          passwordResetFetcher.data.message || "Failed to send reset email.",
          "error"
        );
      }
      setPasswordResetToastShown(true);
    }
    if (!passwordResetFetcher.data) {
      setPasswordResetToastShown(false);
    }
  }, [passwordResetFetcher.data, passwordResetToastShown, addToast]);

  useEffect(() => {
    if (timezoneFetcher.data && !timezoneToastShown) {
      if (timezoneFetcher.data.success) {
        addToast(
          timezoneFetcher.data.message || "Timezone updated!",
          "success"
        );
      } else {
        addToast(
          timezoneFetcher.data.message || "Failed to update timezone.",
          "error"
        );
      }
      setTimezoneToastShown(true);
    }
    if (!timezoneFetcher.data) {
      setTimezoneToastShown(false);
    }
  }, [timezoneFetcher.data, timezoneToastShown, addToast]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    profileFetcher.submit(
      { ...form, intent: "updateProfile" },
      { method: "post" }
    );
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

  return (
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
                className="w-full bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              {timezoneFetcher.state === "submitting" && (
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Updating timezone...
                </span>
              )}
            </div>
            <div className="space-y-3 mt-6">
              <button
                className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 text-white dark:text-gray-100 font-semibold py-2 rounded-lg transition-colors"
                onClick={() => setEditMode(true)}
              >
                Edit Profile
              </button>
              <button
                className="w-full bg-gray-300 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
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
                className="w-full bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent transition-colors placeholder-gray-400 dark:placeholder-gray-300"
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
                className="w-full bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent transition-colors placeholder-gray-400 dark:placeholder-gray-300"
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
                className="w-full bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg p-3 text-sm focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent transition-colors"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="submit"
                className="flex-1 bg-gray-900 hover:bg-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 text-white dark:text-gray-100 font-semibold py-2 rounded-lg transition-colors"
                disabled={profileFetcher.state === "submitting"}
              >
                {profileFetcher.state === "submitting" ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="flex-1 bg-gray-300 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold py-2 rounded-lg transition-colors"
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
  );
}
