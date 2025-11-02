import { Link, useLoaderData } from "react-router";
import { pageAccessLoader } from "~/modules/middleware/pageAccess";
import {
  CreditCardIcon,
  ArrowUpOnSquareIcon,
  UsersIcon,
  ChartPieIcon,
} from "@heroicons/react/24/outline";

export function meta() {
  return [{ title: "Finance Dashboard" }];
}

export const loader = pageAccessLoader("finance", async (user, request) => {
  return {};
});

export default function Finance() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12 text-center md:text-left">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            Finance Dashboard
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto md:mx-0">
            Your central hub for managing financial activities with clarity and
            precision.
          </p>
        </header>

        {/* Cards Section */}
        <main className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
          {/* Card 1: Expenses */}
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 p-6 flex flex-col">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 mr-4">
                <CreditCardIcon className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Expenses
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-6 flex-grow">
              Monitor and categorize your spending. Keep track of every penny.
            </p>
            <Link
              to="/finance/expenses"
              className="mt-auto inline-block bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-medium py-2.5 px-5 rounded-lg transition-colors duration-150 text-center text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
            >
              Manage Expenses
            </Link>
          </div>

          {/* Card 2: Income */}
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 p-6 flex flex-col">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 mr-4">
                <ArrowUpOnSquareIcon className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Income
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-6 flex-grow">
              Track your earnings and income sources. See your money grow.
            </p>
            <Link
              to="/finance/income"
              className="mt-auto inline-block bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-medium py-2.5 px-5 rounded-lg transition-colors duration-150 text-center text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
            >
              Manage Income
            </Link>
          </div>

          {/* Card 3: Shared Budgets */}
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 p-6 flex flex-col">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 mr-4">
                <UsersIcon className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Shared Budgets
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-6 flex-grow">
              Collaborate on budgets with family and friends. Track shared
              expenses together.
            </p>
            <Link
              to="/finance/budgets/shared"
              className="mt-auto inline-block bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-medium py-2.5 px-5 rounded-lg transition-colors duration-150 text-center text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
            >
              Manage Budgets
            </Link>
          </div>

          {/* Card 4: Summary */}
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 p-6 flex flex-col">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 mr-4">
                <ChartPieIcon className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Summary
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-6 flex-grow">
              Get a comprehensive overview of your financial health.
            </p>
            <span className="mt-auto self-start bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs sm:text-sm font-semibold px-4 py-2 rounded-full">
              Coming Soon
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}
