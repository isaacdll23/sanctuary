import { useFetcher, useLoaderData } from "react-router";
import { useState, useContext, useEffect } from "react";
import { pageAccessLoader } from "~/modules/middleware/pageAccess";
import { ToastContext } from "~/context/ToastContext";
import { KeyIcon } from "@heroicons/react/24/outline";

export function meta() {
  return [{ title: "Profile" }];
}

export const loader = pageAccessLoader("profile", async (user, request) => {
  // user is already authenticated and authorized
  return { user };
});

export const action = async ({ request }: any) => {
  const { handleProfileAction } = await import(
    "~/modules/services/ProfileService"
  );
  return handleProfileAction(request);
};

type User = {
  id: string;
  username: string;
  email: string;
};

type LoaderData = {
  user: User;
};

type ActionData = {
  errors?: { username?: string; email?: string };
  success?: boolean;
  message?: string;
};

export default function Profile() {
  const { user } = useLoaderData() as LoaderData;
  const fetcher = useFetcher<ActionData>();
  const passwordResetFetcher = useFetcher<ActionData>();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    username: user.username,
    email: user.email,
  });
  const errors = fetcher.data?.errors;
  const success = fetcher.data?.success;

  const toastCtx = useContext(ToastContext);

  const [toastShown, setToastShown] = useState(false);
  const [passwordResetToastShown, setPasswordResetToastShown] = useState(false);

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    fetcher.submit({ ...form, intent: "updateProfile" }, { method: "post" });
  }

  function handlePasswordReset() {
    passwordResetFetcher.submit(
      { intent: "requestPasswordReset" },
      { method: "post" }
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 flex items-center justify-center p-4 md:p-8">
      <div className="bg-gray-100/80 dark:bg-gray-700/80 border border-gray-300 dark:border-gray-600 rounded-2xl shadow-xl p-8 md:p-10 w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6">Profile</h1>
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
          <fetcher.Form
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
                disabled={fetcher.state === "submitting"}
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
                disabled={fetcher.state === "submitting"}
              />
              {errors?.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition-colors"
                disabled={fetcher.state === "submitting"}
              >
                {fetcher.state === "submitting" ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-900 dark:text-gray-100 font-semibold py-2 rounded-lg transition-colors"
                onClick={() => setEditMode(false)}
                disabled={fetcher.state === "submitting"}
              >
                Cancel
              </button>
            </div>
            {/* Error summary for screen readers */}
            {(errors?.username || errors?.email) && (
              <div className="sr-only" aria-live="polite">
                {errors?.username && <div>{errors.username}</div>}
                {errors?.email && <div>{errors.email}</div>}
              </div>
            )}
          </fetcher.Form>
        )}
      </div>
    </div>
  );
}
