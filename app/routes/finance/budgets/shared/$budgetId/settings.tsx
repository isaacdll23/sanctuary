import { pageAccessAction, pageAccessLoader } from "~/modules/middleware/pageAccess";
import {
  getBudgetDetails,
  handleSharedBudgetAction,
} from "~/modules/services/SharedBudgetService";
import { useFetcher, useLoaderData, redirect } from "react-router";
import { useState, useEffect } from "react";
import { useToast } from "~/hooks/useToast";
import {
  TrashIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

export const loader = pageAccessLoader("finance", async (user, request) => {
  const url = new URL(request.url);
  const budgetId = url.pathname.split("/").slice(-2)[0];
  const result = await getBudgetDetails(budgetId, user.id.toString());

  // Redirect non-owners away from settings
  if (result.success && result.data?.currentUserRole !== "owner") {
    throw redirect(`/finance/budgets/shared/${budgetId}`);
  }

  return result;
});

export const action = pageAccessAction("finance", async (_user, request) => {
  const formData = await request.formData();

  // Pass the already-parsed formData instead of the request
  const result = await handleSharedBudgetAction(request, formData);

  // Redirect to budget list if budget was deleted
  if (result.success && result.message === "Budget deleted") {
    throw redirect("/finance/budgets/shared");
  }

  return result;
});

export default function SharedBudgetSettings() {
  const fetcher = useFetcher();
  const loaderData = useLoaderData<typeof loader>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [hasShownToast, setHasShownToast] = useState(false);
  const { addToast } = useToast();

  // Reset toast flag when starting a new submission
  useEffect(() => {
    if (fetcher.state === "submitting") {
      setHasShownToast(false);
    }
  }, [fetcher.state]);

  // Handle action responses
  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle" && !hasShownToast) {
      setHasShownToast(true);

      if (fetcher.data.success) {
        addToast(fetcher.data.message, "success");
        setShowInviteForm(false);
      } else {
        addToast(fetcher.data.message, "error");
      }
    }
  }, [fetcher.data, fetcher.state, addToast, hasShownToast]);

  if (!loaderData.success) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{loaderData.message}</p>
        </div>
      </div>
    );
  }

  const { budget, members } = loaderData.data!;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
        Budget Settings
      </h1>

      {/* Edit Budget */}
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Budget Details
        </h2>

        <fetcher.Form method="post" className="space-y-4">
          <input type="hidden" name="intent" value="updateBudget" />
          <input type="hidden" name="budgetId" value={budget.id} />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              name="name"
              type="text"
              defaultValue={budget.name}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              defaultValue={budget.description || ""}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Total Amount *
            </label>
            <input
              name="totalAmount"
              type="number"
              step="0.01"
              min="0"
              defaultValue={budget.totalAmount}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          <button
            type="submit"
            disabled={fetcher.state === "submitting"}
            className="px-4 py-2 bg-gray-900 dark:bg-gray-800 text-gray-100 dark:text-gray-100 rounded-lg font-medium transition disabled:opacity-50"
          >
            {fetcher.state === "submitting" ? "Updating..." : "Update Budget"}
          </button>
        </fetcher.Form>
      </div>

      {/* Member Management */}
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Members
          </h2>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
          >
            <UserPlusIcon className="w-4 h-4" />
            Invite Member
          </button>
        </div>

        {/* Invite Form */}
        {showInviteForm && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <fetcher.Form method="post" className="space-y-4">
              <input type="hidden" name="intent" value="inviteMember" />
              <input type="hidden" name="budgetId" value={budget.id} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <select
                    name="role"
                    defaultValue="contributor"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  >
                    <option value="contributor">Contributor</option>
                    <option value="owner">Owner</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={fetcher.state === "submitting"}
                  className="px-4 py-2 bg-gray-900 dark:bg-gray-800 text-gray-100 dark:text-gray-100 rounded-lg font-medium transition disabled:opacity-50 text-sm"
                >
                  {fetcher.state === "submitting"
                    ? "Inviting..."
                    : "Send Invitation"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-medium transition text-sm"
                >
                  Cancel
                </button>
              </div>
            </fetcher.Form>
          </div>
        )}

        {/* Active Members */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Active Members
          </h3>
          {members
            .filter((m: any) => m.status === "active")
            .map((member: any) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-200">
                    {member.user?.username?.[0]?.toUpperCase() ||
                      member.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {member.user?.username || member.email}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {member.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <fetcher.Form method="post" className="inline">
                    <input
                      type="hidden"
                      name="intent"
                      value="updateMemberRole"
                    />
                    <input type="hidden" name="budgetId" value={budget.id} />
                    <input type="hidden" name="memberId" value={member.id} />
                    <select
                      name="role"
                      defaultValue={member.role}
                      onChange={(e) => e.target.form?.requestSubmit()}
                      className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="contributor">Contributor</option>
                      <option value="owner">Owner</option>
                    </select>
                  </fetcher.Form>

                  {member.role !== "owner" && (
                    <fetcher.Form method="post" className="inline">
                      <input type="hidden" name="intent" value="removeMember" />
                      <input type="hidden" name="budgetId" value={budget.id} />
                      <input type="hidden" name="memberId" value={member.id} />
                      <button
                        type="submit"
                        className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="Remove member"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </fetcher.Form>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Pending Invitations */}
        {members.filter((m: any) => m.status === "pending").length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Pending Invitations
            </h3>
            {members
              .filter((m: any) => m.status === "pending")
              .map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {member.email}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {member.role} • Invited{" "}
                      {new Date(member.invitedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <fetcher.Form method="post" className="inline">
                    <input type="hidden" name="intent" value="removeMember" />
                    <input type="hidden" name="budgetId" value={budget.id} />
                    <input type="hidden" name="memberId" value={member.id} />
                    <button
                      type="submit"
                      className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      title="Cancel invitation"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </fetcher.Form>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-gray-900 border border-red-300 dark:border-red-700 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
            Danger Zone
          </h2>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Deleting this budget will permanently remove all data including
          transactions and member access. This action cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
          >
            Delete Budget
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              Are you sure you want to delete this budget? Type the budget name
              to confirm:
            </p>
            <fetcher.Form method="post" className="space-y-3">
              <input type="hidden" name="intent" value="deleteBudget" />
              <input type="hidden" name="budgetId" value={budget.id} />
              <input
                type="text"
                placeholder={`Type "${budget.name}" to confirm`}
                className="w-full px-3 py-2 border border-red-300 dark:border-red-700 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                onChange={(e) => {
                  const submitBtn = e.target.form?.querySelector(
                    'button[type="submit"]'
                  ) as HTMLButtonElement;
                  if (submitBtn) {
                    submitBtn.disabled = e.target.value !== budget.name;
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={true}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete Budget Permanently
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </fetcher.Form>
          </div>
        )}
      </div>
    </div>
  );
}
