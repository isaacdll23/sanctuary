import { useState } from "react";
import { useFetcher } from "react-router";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface InviteMemberModalProps {
  budgetId: string | number;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function InviteMemberModal({
  budgetId,
  onClose,
  onSuccess,
}: InviteMemberModalProps) {
  const fetcher = useFetcher();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("contributor");
  const [error, setError] = useState("");

  function validateEmail(email: string) {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  }

  function handleSubmit(e: React.FormEvent) {
    if (!validateEmail(email)) {
      e.preventDefault();
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    onSuccess && onSuccess();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 dark:bg-gray-900/60 backdrop-blur">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl shadow-xl p-6 w-full max-w-md relative">
        <button
          className="absolute top-3 right-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          onClick={onClose}
          aria-label="Close"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
          Invite Member
        </h2>
        <fetcher.Form
          method="post"
          className="space-y-4"
          onSubmit={handleSubmit}
        >
          <input type="hidden" name="intent" value="inviteMember" />
          <input type="hidden" name="budgetId" value={budgetId} />
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="contributor">Contributor</option>
              <option value="owner">Owner</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-gray-900 dark:bg-gray-100 text-gray-100 dark:text-gray-900 rounded-lg font-semibold transition disabled:opacity-50"
            disabled={fetcher.state === "submitting"}
          >
            {fetcher.state === "submitting" ? "Sending..." : "Send Invite"}
          </button>
        </fetcher.Form>
      </div>
    </div>
  );
}
