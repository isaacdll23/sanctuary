import { useFetcher, redirect } from "react-router";
import { pageAccessAction, pageAccessLoader } from "~/modules/middleware/pageAccess";
import { handleSharedBudgetAction } from "~/modules/services/SharedBudgetService";
import { useState, useEffect } from "react";
import { useToast } from "~/hooks/useToast";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

export const loader = pageAccessLoader("finance", async (user, request) => {
  return {};
});

export const action = pageAccessAction("finance", async (_user, request) => {
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
    <div className="min-h-screen bg-transparent p-4 md:p-8">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            Create Shared Budget
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Set up a new collaborative budget to track shared expenses.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-150 p-6">
          <fetcher.Form method="post" className="space-y-5">
            <input type="hidden" name="intent" value="createBudget" />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Budget Name <span className="text-gray-500">*</span>
              </label>
              <input
                name="name"
                type="text"
                required
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
                placeholder="Family Budget, Vacation Fund, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150 resize-none"
                placeholder="What is this budget for?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Amount <span className="text-gray-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600 dark:text-gray-400">
                  $
                </span>
                <input
                  name="totalAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Period <span className="text-gray-500">*</span>
              </label>
              <select
                name="period"
                required
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {fetcher.data && !fetcher.data.success && (
              <div className="bg-gray-100 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                  {fetcher.data.message}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={fetcher.state === "submitting"}
              className="w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:disabled:bg-gray-700 text-white dark:text-gray-100 rounded-lg font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 inline-flex justify-center items-center gap-2 min-h-[40px]"
            >
              {fetcher.state === "submitting" ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Budget"
              )}
            </button>
          </fetcher.Form>
        </div>

        <div className="mt-8 bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              Pro tip:
            </span>{" "}
            After creating the budget, you can invite others to collaborate in
            the budget settings.
          </p>
        </div>
      </div>
    </div>
  );
}
