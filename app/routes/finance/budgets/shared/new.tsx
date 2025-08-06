import { useFetcher, redirect } from "react-router";
import { pageAccessLoader } from "~/modules/middleware/pageAccess";
import { handleSharedBudgetAction } from "~/modules/services/SharedBudgetService";
import { useState, useEffect } from "react";
import { useToast } from "~/hooks/useToast";

export const loader = pageAccessLoader("finance", async (user, request) => {
  return {};
});

export const action = pageAccessLoader("finance", async (user, request) => {
  const result = await handleSharedBudgetAction(request);
  if (result.success) {
    // Redirect to shared budgets list after creation
    throw redirect("/finance/budgets/shared");
  }
  return result;
});

export default function NewSharedBudget() {
  const fetcher = useFetcher();
  const { addToast } = useToast();

  // Handle action responses
  useEffect(() => {
    if (fetcher.data && !fetcher.data.success) {
      addToast(fetcher.data.message, "error");
    }
  }, [fetcher.data, addToast]);

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
        Create Shared Budget
      </h1>

      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-6">
        <fetcher.Form method="post" className="space-y-4">
          <input type="hidden" name="intent" value="createBudget" />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name *
            </label>
            <input
              name="name"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Family Budget, Vacation Fund, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="What is this budget for?"
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
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Period *
            </label>
            <select
              name="period"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {fetcher.data && !fetcher.data.success && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-600 dark:text-red-400 text-sm">
                {fetcher.data.message}
              </p>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2 px-4 bg-gray-900 dark:bg-gray-100 text-gray-100 dark:text-gray-900 rounded-lg font-semibold transition disabled:opacity-50"
            disabled={fetcher.state === "submitting"}
          >
            {fetcher.state === "submitting" ? "Creating..." : "Create Budget"}
          </button>
        </fetcher.Form>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          After creating the budget, you can invite others to collaborate in the
          settings.
        </p>
      </div>
    </div>
  );
}
