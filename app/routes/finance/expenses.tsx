import { useFetcher } from "react-router";
import { useState, useEffect } from "react";
import { requireAuth, getUserFromSession } from "~/modules/auth.server";
import type { Route } from "./+types/expenses";
import { db } from "~/db";
import { financeExpensesTable } from "~/db/schema";
import { eq, desc } from "drizzle-orm";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Expenses" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  const user = await getUserFromSession(request);

  const userExpenses = await db
    .select()
    .from(financeExpensesTable)
    .where(eq(financeExpensesTable.userId, user.id))
    .orderBy(desc(financeExpensesTable.createdAt));

  return { userExpenses };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  const _action = formData.get("_action");

  if (_action === "delete") {
    const id = formData.get("id") as string;
    await db
      .delete(financeExpensesTable)
      .where(eq(financeExpensesTable.id, Number(id)));
    return {};
  } else if (_action === "update") {
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const monthlyCostStr = formData.get("monthlyCost") as string;
    const chargeDayStr = formData.get("chargeDay") as string;

    const monthlyCostFloat = parseFloat(monthlyCostStr);
    const monthlyCost = Math.round(monthlyCostFloat * 100);
    const chargeDay = parseInt(chargeDayStr, 10);

    if (!name || isNaN(monthlyCostFloat) || isNaN(chargeDay)) {
      return { error: "Invalid input" };
    }

    await db
      .update(financeExpensesTable)
      .set({ name, monthlyCost, chargeDay })
      .where(eq(financeExpensesTable.id, Number(id)));
    return {};
  } else {
    const name = formData.get("name") as string;
    const monthlyCostStr = formData.get("monthlyCost") as string;
    const chargeDayStr = formData.get("chargeDay") as string;

    const monthlyCostFloat = parseFloat(monthlyCostStr);
    const monthlyCost = Math.round(monthlyCostFloat * 100);
    const chargeDay = parseInt(chargeDayStr, 10);

    if (!name || isNaN(monthlyCostFloat) || isNaN(chargeDay)) {
      return { error: "Invalid input" };
    }

    const user = await getUserFromSession(request);

    await db.insert(financeExpensesTable).values({
      userId: user.id,
      name,
      monthlyCost,
      chargeDay,
    });

    return {};
  }
}

export default function Expenses({ loaderData }: Route.ComponentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data === undefined) {
      setIsModalOpen(false);
      setEditingExpense(null);
    }
  }, [fetcher.state, fetcher.data]);

  const expenses = loaderData.userExpenses;

  const totalMonthlyCost = expenses.reduce(
    (acc: number, expense: any) => acc + expense.monthlyCost,
    0
  );

  const totalYearlyCost = totalMonthlyCost * 12;

  return (
    <div className="h-full flex flex-col items-center p-4 gap-4">
      <div className="flex flex-col md:flex-row gap-2 justify-between items-center w-5/6">
        <h1 className="text-3xl">Expenses</h1>

        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl border-2 px-5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-800 bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
        >
          Add Expense
        </button>
      </div>

      <div className="w-5/6 flex flex-col md:flex-row gap-4 justify-between items-center mt-4">
        <p className="text-lg">
          Total Monthly Cost: ${(totalMonthlyCost / 100).toFixed(2)}
        </p>
        <p className="text-lg">
          Total Yearly Cost: ${(totalYearlyCost / 100).toFixed(2)}
        </p>
      </div>

      <div className="w-full max-w-4xl overflow-x-auto">
        <table className="min-w-full border-4 border-gray-800 shadow-lg">
          <thead className="bg-gray-700 text-white">
            <tr>
              <th className="px-6 py-3 text-left rounded-tl-xl">Name</th>
              <th className="px-6 py-3 text-left">Monthly Cost</th>
              <th className="px-6 py-3 text-left">Charge Day</th>
              <th className="px-6 py-3 text-left rounded-tr-xl">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-4 rounded-b-xl">
                  No subscriptions found.
                </td>
              </tr>
            ) : (
              expenses.map((subscription: any) => (
                <tr
                  key={subscription.id}
                >
                  <td className="px-6 py-3">{subscription.name}</td>
                  <td className="px-6 py-3">
                    ${(subscription.monthlyCost / 100).toFixed(2)} (
                    {(
                      subscription.monthlyCost /
                      (totalMonthlyCost / 100)
                    ).toFixed(2)}
                    %)
                  </td>
                  <td className="px-6 py-3">{subscription.chargeDay}</td>
                  <td className="px-6 py-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingExpense(subscription)}
                      className="w-1/2 rounded bg-emerald-600 px-3 py-1 text-xs hover:bg-emerald-700"
                    >
                      Edit
                    </button>
                    <fetcher.Form method="post" className="w-1/2">
                      <input type="hidden" name="_action" value="delete" />
                      <input type="hidden" name="id" value={subscription.id} />
                      <button
                        type="submit"
                        className="w-full rounded bg-red-600 px-3 py-1 text-xs hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </fetcher.Form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Subscription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-5/6 md:w-1/3 relative">
            <h2 className="text-2xl font-bold mb-4">Add Subscription</h2>
            <fetcher.Form
              method="post"
              className="flex flex-col justify-center items-center gap-4"
            >
              <input type="hidden" name="_action" value="add" />
              <input
                type="text"
                name="name"
                placeholder="Subscription Name"
                className="w-full border-2 border-gray-500 rounded-xl p-2 text-sm bg-gray-600 text-white"
                required
              />
              <input
                type="number"
                step="0.01"
                name="monthlyCost"
                placeholder="Monthly Cost (in dollars)"
                className="w-full border-2 border-gray-500 rounded-xl p-2 text-sm bg-gray-600 text-white"
                required
              />
              <input
                type="number"
                name="chargeDay"
                placeholder="Day of Charge (1-31)"
                className="w-full border-2 border-gray-500 rounded-xl p-2 text-sm bg-gray-600 text-white"
                min="1"
                max="31"
                required
              />
              <button
                type="submit"
                disabled={fetcher.state === "submitting"}
                className="w-full rounded-xl border-2 px-8 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-800 bg-blue-700 text-white hover:bg-blue-800 transition-colors duration-200"
              >
                Add Subscription
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full rounded-xl border-2 px-8 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-800 bg-gray-700 text-white hover:bg-gray-900 transition-colors duration-200"
              >
                Cancel
              </button>
            </fetcher.Form>
          </div>
        </div>
      )}

      {/* Edit Subscription Modal */}
      {editingExpense && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-5/6 md:w-1/3 relative">
            <h2 className="text-2xl font-bold mb-4">Edit Subscription</h2>
            <fetcher.Form
              method="post"
              className="flex flex-col justify-center items-center gap-4"
            >
              <input type="hidden" name="_action" value="update" />
              <input type="hidden" name="id" value={editingExpense.id} />
              <input
                type="text"
                name="name"
                defaultValue={editingExpense.name}
                placeholder="Subscription Name"
                className="w-full border-2 border-gray-500 rounded-xl p-2 text-sm bg-gray-600 text-white"
                required
              />
              <input
                type="number"
                step="0.01"
                name="monthlyCost"
                defaultValue={(editingExpense.monthlyCost / 100).toFixed(
                  2
                )}
                placeholder="Monthly Cost (in dollars)"
                className="w-full border-2 border-gray-500 rounded-xl p-2 text-sm bg-gray-600 text-white"
                required
              />
              <input
                type="number"
                name="chargeDay"
                defaultValue={editingExpense.chargeDay}
                placeholder="Day of Charge (1-31)"
                className="w-full border-2 border-gray-500 rounded-xl p-2 text-sm bg-gray-600 text-white"
                min="1"
                max="31"
                required
              />
              <button
                type="submit"
                disabled={fetcher.state === "submitting"}
                className="w-full rounded-xl border-2 px-8 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-800 bg-emerald-700 text-white hover:bg-emerald-800 transition-colors duration-200"
              >
                Update Subscription
              </button>
              <button
                type="button"
                onClick={() => setEditingExpense(null)}
                className="w-full rounded-xl border-2 px-8 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-800 bg-gray-700 text-white hover:bg-gray-900 transition-colors duration-200"
              >
                Cancel
              </button>
            </fetcher.Form>
          </div>
        </div>
      )}
    </div>
  );
}