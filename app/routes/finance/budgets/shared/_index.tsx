import { Link, useLoaderData } from "react-router";
import { pageAccessLoader } from "~/modules/middleware/pageAccess";
import { getBudgetsForUser } from "~/modules/services/SharedBudgetService";
import SharedBudgetCard from "~/components/finance/SharedBudgetCard";

export const loader = pageAccessLoader("finance", async (user, request) => {
  const result = await getBudgetsForUser(user.id.toString());
  return result;
});

export default function SharedBudgetsIndex() {
  const loaderData = useLoaderData<typeof loader>();

  if (!loaderData.success) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
          <p className="text-red-600 dark:text-red-400">
            Failed to load budgets
          </p>
        </div>
      </div>
    );
  }

  const budgets = loaderData.data;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Shared Budgets
        </h1>
        <Link
          to="/finance/budgets/shared/new"
          className="bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        >
          Create New
        </Link>
      </div>

      <div className="space-y-4">
        {budgets.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center text-gray-500 dark:text-gray-400">
            No shared budgets yet. Create your first budget to get started!
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
  );
}
