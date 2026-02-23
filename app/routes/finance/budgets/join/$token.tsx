import { useFetcher, useLoaderData, redirect } from "react-router";
import {
  validateInviteToken,
  processBudgetJoin,
} from "~/modules/services/BudgetInviteService";
import { getBudgetDetails } from "~/modules/services/SharedBudgetService";
import { getUserFromSession, isSessionCreated } from "~/modules/auth.server";
import type { Route } from "./+types/$token";

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { token } = params;

  // Validate the token first
  const validation = validateInviteToken(token);
  if (!validation.success) {
    return { success: false, message: validation.message };
  }

  // Check if user is authenticated
  const isAuthenticated = await isSessionCreated(request);
  if (!isAuthenticated) {
    // Redirect to login with return URL
    const loginUrl = `/auth/login?redirect=${encodeURIComponent(
      `/finance/budgets/join/${token}`
    )}`;
    throw redirect(loginUrl);
  }

  // Get budget details for preview
  const { budgetId } = validation.data as { budgetId: string; email: string };
  const user = await getUserFromSession(request);
  const budgetResult = await getBudgetDetails(budgetId, user.id.toString());

  return {
    success: true,
    budget: budgetResult.success ? budgetResult.data : null,
    token,
    validation: validation.data,
  };
};

export const action = async ({ params, request }: Route.ActionArgs) => {
  const { token } = params;

  // Check authentication
  const isAuthenticated = await isSessionCreated(request);
  if (!isAuthenticated) {
    return {
      success: false,
      message: "You must be logged in to join a budget",
    };
  }

  const user = await getUserFromSession(request);
  const result = await processBudgetJoin(token, user.id.toString());

  if (result.success) {
    // Redirect to the budget after successful join
    const validation = validateInviteToken(token);
    if (validation.success) {
      const { budgetId } = validation.data as { budgetId: string };
      throw redirect(`/finance/budgets/shared/${budgetId}`);
    }
  }

  return result;
};

export default function JoinBudgetPage() {
  const fetcher = useFetcher();
  const loaderData = useLoaderData<typeof loader>();

  if (!loaderData.success) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4">
        <div className="bg-white dark:bg-gray-900 border border-red-300 dark:border-red-700 rounded-lg p-6 text-center">
          <h1 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">
            Invalid Invitation
          </h1>
          <p className="text-red-600 dark:text-red-400 mb-4">
            {loaderData.message}
          </p>
          <a
            href="/finance/budgets/shared"
            className="inline-block px-4 py-2 bg-gray-900 dark:bg-gray-800 text-gray-100 dark:text-gray-100 rounded-lg font-medium"
          >
            View Your Budgets
          </a>
        </div>
      </div>
    );
  }

  const { budget, validation } = loaderData;
  const { email } = validation as { budgetId: string; email: string };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-center">
        Join Shared Budget
      </h1>

      {budget?.budget ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {budget.budget.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              You've been invited as:{" "}
              <span className="font-medium">{email}</span>
            </p>
            {budget.budget.description && (
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {budget.budget.description}
              </p>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  Total Budget:
                </span>
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  ${budget.budget.totalAmount}
                </div>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  Members:
                </span>
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                  {budget.members?.filter((m: any) => m.status === "active")
                    .length || 0}
                </div>
              </div>
            </div>
          </div>

          <fetcher.Form method="post" className="text-center">
            <button
              type="submit"
              disabled={fetcher.state === "submitting"}
              className="w-full px-6 py-3 bg-gray-900 dark:bg-gray-800 text-gray-100 dark:text-gray-100 rounded-lg font-medium transition disabled:opacity-50"
            >
              {fetcher.state === "submitting"
                ? "Joining..."
                : "Accept Invitation & Join Budget"}
            </button>
          </fetcher.Form>

          {fetcher.data && !fetcher.data.success && (
            <p className="text-red-600 dark:text-red-400 text-center mt-4 text-sm">
              {fetcher.data.message}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Ready to join this shared budget?
          </p>
          <fetcher.Form method="post">
            <button
              type="submit"
              disabled={fetcher.state === "submitting"}
              className="px-6 py-3 bg-gray-900 dark:bg-gray-800 text-gray-100 dark:text-gray-100 rounded-lg font-medium transition disabled:opacity-50"
            >
              {fetcher.state === "submitting" ? "Joining..." : "Join Budget"}
            </button>
          </fetcher.Form>
        </div>
      )}
    </div>
  );
}
