import React, { useState } from "react";
import { useFetcher } from "react-router";
import { EnvelopeIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

interface EmailFormProps {
  onSuccess?: () => void;
}

export default function EmailForm({ onSuccess }: EmailFormProps) {
  const [email, setEmail] = useState("");
  const fetcher = useFetcher();
  const isSubmitting = fetcher.state === "submitting";

  const handleSuccess = () => {
    setEmail("");
    onSuccess?.();
  };

  React.useEffect(() => {
    if (fetcher.data?.success) {
      handleSuccess();
    }
  }, [fetcher.data?.success]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700">
          <EnvelopeIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Send Test Email
        </h2>
      </div>

      <fetcher.Form method="post" className="space-y-4">
        <input type="hidden" name="intent" value="sendTestEmail" />

        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="testEmail"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Email Address
            </label>
            <input
              id="testEmail"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-white rounded-lg px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:focus:ring-indigo-400 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="admin@example.com"
              aria-label="Recipient email address"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="min-h-[44px] px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 whitespace-nowrap hover:shadow-md"
            aria-label="Send test email"
          >
            {isSubmitting ? "Sending..." : "Send"}
          </button>
        </div>
      </fetcher.Form>

      {fetcher.data && (
        <div
          className={`flex items-start gap-3 p-4 rounded-lg transition-all duration-150 transform origin-top ${
            fetcher.data.success
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-300"
              : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300"
          }`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {fetcher.data.success ? (
            <CheckCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          ) : (
            <XCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <span className="text-sm font-medium">
            {fetcher.data.success
              ? "Test email sent successfully"
              : `Error: ${fetcher.data.error?.message || fetcher.data.message || "Unknown error"}`}
          </span>
        </div>
      )}
    </div>
  );
}
