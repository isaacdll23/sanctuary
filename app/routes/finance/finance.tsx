import { requireAuth } from "~/modules/auth.server";
import type { Route } from "./+types/finance";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Finance Dashboard" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);
  return {};
}

export default function Finance() {
  return (
    <div className="h-full p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-white-800">Finance Dashboard</h1>
        <p className="text-gray-600">Overview of your financial activities</p>
      </header>
      <main className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <div className="bg-gray-800 shadow-lg rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Expenses</h2>
          <p className="text-gray-600">
            Manage your expenses and view costs.
          </p>
          <a
            href="/finance/expenses"
            className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
          >
            View Expenses
          </a>
        </div>
        <div className="bg-gray-800 shadow-lg rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Transactions</h2>
          <p className="text-gray-600">Track your transactions. Coming soon.</p>
          <span className="mt-4 inline-block bg-gray-300 text-gray-700 px-4 py-2 rounded">
            Coming Soon
          </span>
        </div>
        <div className="bg-gray-800 shadow-lg rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Summary</h2>
          <p className="text-gray-600">
            Get an overview of your spending and savings.
          </p>
          <span className="mt-4 inline-block bg-gray-300 text-gray-700 px-4 py-2 rounded ">
            Coming Soon
          </span>
        </div>
      </main>
    </div>
  );
}
