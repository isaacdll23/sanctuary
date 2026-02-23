import { pageAccessLoader } from "~/modules/middleware/pageAccess";
import {
  getBudgetDetails,
  handleSharedBudgetAction,
} from "~/modules/services/SharedBudgetService";
import { useFetcher, useLoaderData, Link } from "react-router";
import { useState, useEffect } from "react";
import { useToast } from "~/hooks/useToast";
import BudgetProgressBar from "~/components/finance/BudgetProgressBar";
import {
  CogIcon,
  PlusIcon,
  UserIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export const loader = pageAccessLoader("finance", async (user, request) => {
  const url = new URL(request.url);
  const budgetId = url.pathname.split("/").slice(-1)[0];
  return await getBudgetDetails(budgetId, user.id.toString());
});

export const action = pageAccessLoader("finance", async (user, request) => {
  return await handleSharedBudgetAction(request);
});

export default function SharedBudgetDetails() {
  const fetcher = useFetcher();
  const loaderData = useLoaderData<typeof loader>();
  const [showAddTransaction, setShowAddTransaction] = useState(false);
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
        setShowAddTransaction(false);
      } else {
        addToast(fetcher.data.message, "error");
      }
    }
  }, [fetcher.data, fetcher.state, addToast, hasShownToast]);

  if (!loaderData.success) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{loaderData.message}</p>
        </div>
      </div>
    );
  }

  const {
    budget,
    members,
    transactions,
    spentAmount,
    currentUserRole,
    currentUserId,
  } = loaderData.data!;
  const totalAmount = parseFloat(budget.totalAmount);
  const isOwnerOrContributor =
    currentUserRole === "owner" || currentUserRole === "contributor";

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {budget.name}
          </h1>
          {budget.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {budget.description}
            </p>
          )}
        </div>
        {currentUserRole === "owner" && (
          <Link
            to="settings"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            <CogIcon className="w-4 h-4" />
            Settings
          </Link>
        )}
      </div>

      {/* Budget Overview */}
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Budget Overview
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
            {budget.period}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Budget
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              ${totalAmount.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Spent
            </div>
            <div className="text-2xl font-bold text-red-500">
              ${spentAmount.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Remaining
            </div>
            <div className="text-2xl font-bold text-green-500">
              ${(totalAmount - spentAmount).toLocaleString()}
            </div>
          </div>
        </div>

        <BudgetProgressBar total={totalAmount} spent={spentAmount} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Members (
              {members.filter((m: any) => m.status === "active").length})
            </h3>

            <div className="space-y-3">
              {members
                .filter((m: any) => m.status === "active")
                .map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between"
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
                        <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {member.role}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {members.filter((m: any) => m.status === "pending").length > 0 && (
              <>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-6 mb-2">
                  Pending Invitations
                </h4>
                <div className="space-y-2">
                  {members
                    .filter((m: any) => m.status === "pending")
                    .map((member: any) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-600 dark:text-gray-400">
                          {member.email}
                        </span>
                        <span className="text-xs text-yellow-600 dark:text-yellow-400 capitalize">
                          {member.role}
                        </span>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Transactions */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Recent Transactions
              </h3>
              {isOwnerOrContributor && (
                <button
                  onClick={() => setShowAddTransaction(!showAddTransaction)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Transaction
                </button>
              )}
            </div>

            {/* Add Transaction Form */}
            {showAddTransaction && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <fetcher.Form method="post" className="space-y-4">
                  <input type="hidden" name="intent" value="addTransaction" />
                  <input type="hidden" name="budgetId" value={budget.id} />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Amount *
                      </label>
                      <input
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Date
                      </label>
                      <input
                        name="transactionDate"
                        type="date"
                        defaultValue={new Date().toISOString().split("T")[0]}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <input
                      name="description"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      placeholder="What was this expense for?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <input
                      name="category"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                      placeholder="e.g., Food, Transport, Entertainment"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={fetcher.state === "submitting"}
                      className="px-4 py-2 bg-gray-900 dark:bg-gray-800 text-gray-100 dark:text-gray-100 rounded-lg font-medium transition disabled:opacity-50 text-sm"
                    >
                      {fetcher.state === "submitting"
                        ? "Adding..."
                        : "Add Transaction"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddTransaction(false)}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg font-medium transition text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </fetcher.Form>
              </div>
            )}

            {/* Transactions List */}
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No transactions yet.
                  {isOwnerOrContributor && (
                    <span className="block mt-1">
                      Add your first transaction above!
                    </span>
                  )}
                </div>
              ) : (
                transactions.slice(0, 10).map((transaction: any) => {
                  // Check if current user can delete this transaction
                  const canDelete =
                    currentUserRole === "owner" ||
                    transaction.addedBy?.id === currentUserId;

                  return (
                    <div
                      key={transaction.id}
                      className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {transaction.description || "Untitled Transaction"}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {transaction.category && (
                            <span className="mr-2">{transaction.category}</span>
                          )}
                          Added by {transaction.addedBy?.username || "Unknown"}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold text-red-500">
                            ${parseFloat(transaction.amount).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(
                              transaction.transactionDate
                            ).toLocaleDateString()}
                          </div>
                        </div>
                        {canDelete && (
                          <fetcher.Form method="post" className="inline">
                            <input
                              type="hidden"
                              name="intent"
                              value="deleteTransaction"
                            />
                            <input
                              type="hidden"
                              name="transactionId"
                              value={transaction.id}
                            />
                            <button
                              type="submit"
                              onClick={(e) => {
                                if (
                                  !confirm(
                                    "Are you sure you want to delete this transaction?"
                                  )
                                ) {
                                  e.preventDefault();
                                }
                              }}
                              className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition"
                              title="Delete transaction"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </fetcher.Form>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {transactions.length > 10 && (
              <div className="mt-4 text-center">
                <button className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  View all {transactions.length} transactions
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
