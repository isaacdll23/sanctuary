import { Link, useLoaderData } from "react-router";
import { pageAccessLoader } from "~/modules/middleware/pageAccess";

export function meta() {
  return [{ title: "Finance Dashboard" }];
}

export const loader = pageAccessLoader("finance", async (user, request) => {
  return {};
});

export default function Finance() {
  return (
    // Main container
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 p-4 md:p-8">
      {/* Centered content area */}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12 text-center md:text-left">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">
              Finance Dashboard
            </span>
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto md:mx-0">
            Your central hub for managing financial activities with clarity and
            precision.
          </p>
        </header>

        {/* Cards Section */}
        <main className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8">
          {/* Card 1: Expenses */}
          <div className="bg-white/90 backdrop-blur-md border border-gray-200 dark:bg-gray-800/70 dark:border-gray-700 rounded-2xl shadow-xl p-6 flex flex-col transition-all duration-300 hover:shadow-red-500/30 dark:hover:border-gray-600">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-red-500/20 text-red-400 mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
                  />
                </svg>
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
              className="mt-auto inline-block bg-red-600 hover:bg-red-500 text-white font-medium py-2.5 px-5 rounded-lg transition-colors duration-300 text-center text-sm sm:text-base"
            >
              Manage Expenses
            </Link>
          </div>

          {/* Card 2: Income */}
          <div className="bg-white/90 backdrop-blur-md border border-gray-200 dark:bg-gray-800/70 dark:border-gray-700 rounded-2xl shadow-xl p-6 flex flex-col transition-all duration-300 hover:shadow-green-500/30 dark:hover:border-gray-600">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-green-500/20 text-green-400 mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 11.219 12.768 11 12 11c-.768 0-1.536.219-2.121.659-.922.689-.455 2.036.465 2.712Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25A8.966 8.966 0 0 0 12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c2.485 0 4.73-.998 6.364-2.636"
                  />
                </svg>
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
              className="mt-auto inline-block bg-green-600 hover:bg-green-500 text-white font-medium py-2.5 px-5 rounded-lg transition-colors duration-300 text-center text-sm sm:text-base"
            >
              Manage Income
            </Link>
          </div>

          {/* Card 3: Shared Budgets */}
          <div className="bg-white/90 backdrop-blur-md border border-gray-200 dark:bg-gray-800/70 dark:border-gray-700 rounded-2xl shadow-xl p-6 flex flex-col transition-all duration-300 hover:shadow-purple-500/30 dark:hover:border-gray-600">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-purple-500/20 text-purple-400 mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                  />
                </svg>
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
              className="mt-auto inline-block bg-purple-600 hover:bg-purple-500 text-white font-medium py-2.5 px-5 rounded-lg transition-colors duration-300 text-center text-sm sm:text-base"
            >
              Manage Budgets
            </Link>
          </div>

          {/* Card 4: Summary */}
          <div className="bg-white/90 backdrop-blur-md border border-gray-200 dark:bg-gray-800/70 dark:border-gray-700 rounded-2xl shadow-xl p-6 flex flex-col transition-all duration-300 hover:shadow-blue-500/30 dark:hover:border-gray-600">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-blue-500/20 text-blue-400 mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z"
                  />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Summary
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base mb-6 flex-grow">
              Get a comprehensive overview of your financial health.
            </p>
            <span className="mt-auto self-start bg-gray-200 text-cyan-600 dark:bg-gray-700 dark:text-cyan-400 text-xs sm:text-sm font-semibold px-4 py-2 rounded-full">
              Coming Soon
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}
