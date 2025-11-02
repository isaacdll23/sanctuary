import { Link, useLoaderData } from "react-router";
import { pageAccessLoader } from "~/modules/middleware/pageAccess";
import { getBudgetsForUser } from "~/modules/services/SharedBudgetService";
import SharedBudgetCard from "~/components/finance/SharedBudgetCard";
import { PlusIcon } from "@heroicons/react/24/outline";

export const loader = pageAccessLoader("finance", async (user, request) => {
  const result = await getBudgetsForUser(user.id.toString());
  return result;
});

export default function SharedBudgetsIndex() {
  const loaderData = useLoaderData<typeof loader>();

  if (!loaderData.success) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Failed to load budgets
            </p>
          </div>
        </div>
      </div>
    );
  }

  const budgets = loaderData.data;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
              Shared Budgets
            </h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              Collaborate on budgets with family and friends.
            </p>
          </div>
          <Link
            to="/finance/budgets/shared/new"
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-semibold py-2.5 px-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 min-h-[40px]"
          >
            <PlusIcon className="w-5 h-5" />
            Create New
          </Link>
        </div>

        <div className="space-y-4">
          {budgets.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                No shared budgets yet.
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
                Create your first budget to get started!
              </p>
            </div>
          ) : (
            budgets.map(({ budget, member, members, spentAmount }) => (
              <SharedBudgetCard
                key={budget.id}
                id={budget.id}
                name={budget.name}
                description={budget.description || ""}
                totalAmount={parseFloat(budget.totalAmount)}
                spentAmount={spentAmount}
                period={budget.period}
                members={members
                  .filter((m) => m.status === "active")
                  .map((m) => ({
                    id: m.id,
                    name: m.user?.username || "",
                    email: m.email,
                    role: m.role,
                  }))}
                currentUserId={member.userId || ""}
                role={member.role}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
