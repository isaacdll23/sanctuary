import { useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import type { Route } from "./+types/income";
import { pageAccessLoader, pageAccessAction } from "~/modules/middleware/pageAccess";
import { eq } from "drizzle-orm";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Income Dashboard" }];
}

export const loader = pageAccessLoader("finance/income", async (user, request) => {
  const { db } = await import("~/db");
  const { financeIncomeTable } = await import("~/db/schema");

  const [userIncome]: Array<typeof financeIncomeTable.$inferSelect> = await db
    .select()
    .from(financeIncomeTable)
    .where(eq(financeIncomeTable.userId, user.id))
    .limit(1);

  if (!userIncome) {
    return { annualGrossIncome: undefined, taxDeductionPercentage: undefined };
  }

  return {
    annualGrossIncome: userIncome.annualGrossIncome,
    taxDeductionPercentage: userIncome.taxDeductionPercentage,
  };
});

export const action = pageAccessAction("finance/income", async (user, request) => {
  const { db } = await import("~/db");
  const { financeIncomeTable } = await import("~/db/schema");

  const formData = await request.formData();
  const annualGrossIncome = formData.get("annualGrossIncome");
  const taxDeductionPercentage = formData.get("taxDeductionPercentage");

  const [userIncome]: Array<typeof financeIncomeTable.$inferSelect> = await db
    .select()
    .from(financeIncomeTable)
    .where(eq(financeIncomeTable.userId, user.id))
    .limit(1);
  if (userIncome) {
    await db
      .update(financeIncomeTable)
      .set({
        annualGrossIncome: Number(annualGrossIncome),
        taxDeductionPercentage: Number(taxDeductionPercentage),
      })
      .where(eq(financeIncomeTable.userId, user.id));
    return {};
  }

  // If user income doesn't exist, create a new record
  await db.insert(financeIncomeTable).values({
    userId: user.id,
    annualGrossIncome: Number(annualGrossIncome),
    taxDeductionPercentage: Number(taxDeductionPercentage),
  });

  return {};
});

export default function Income({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">
            Income Dashboard
          </h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-400">
            Manage your income sources and track your earnings.
          </p>
        </header>

        {/* Income Stats */}
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-150 p-6 mb-8">
          {loaderData.annualGrossIncome ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                    Annual Gross Income
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    ${loaderData.annualGrossIncome.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                    Tax Deduction Rate
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {loaderData.taxDeductionPercentage}%
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-5 border border-gray-300 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                  Estimated Breakdowns
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                      Annual Tax
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      $
                      {(
                        (loaderData.annualGrossIncome *
                          loaderData.taxDeductionPercentage) /
                        100
                      ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                      Monthly Tax
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      $
                      {(
                        (loaderData.annualGrossIncome *
                          loaderData.taxDeductionPercentage) /
                        1200
                      ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                      Annual Net Income
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      $
                      {(
                        (loaderData.annualGrossIncome *
                          (100 - loaderData.taxDeductionPercentage)) /
                        100
                      ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                      Monthly Net Income
                    </p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      $
                      {(
                        (loaderData.annualGrossIncome *
                          (100 - loaderData.taxDeductionPercentage)) /
                        1200
                      ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4"
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
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-1">
                No income data available yet.
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                Please enter your income details below.
              </p>
            </div>
          )}
        </div>

        {/* Income Form */}
        <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-150 p-6">
          <h2 className="text-lg font-semibold mb-6 text-gray-900 dark:text-gray-100">
            Update Income Details
          </h2>

          <fetcher.Form method="post" className="space-y-6">
            <div>
              <label
                htmlFor="annualGrossIncome"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Annual Gross Income
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-600 dark:text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  name="annualGrossIncome"
                  id="annualGrossIncome"
                  placeholder="Enter your annual income"
                  defaultValue={loaderData.annualGrossIncome}
                  className="w-full pl-8 pr-4 py-2.5 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="taxDeductionPercentage"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Tax Deduction Percentage
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="taxDeductionPercentage"
                  id="taxDeductionPercentage"
                  placeholder="Enter tax percentage"
                  defaultValue={loaderData.taxDeductionPercentage}
                  className="w-full pl-4 pr-8 py-2.5 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 transition-colors duration-150"
                  required
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-600 dark:text-gray-400">
                  %
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Enter the percentage of your income that goes to taxes.
              </p>
            </div>

            <button
              type="submit"
              disabled={fetcher.state === "submitting"}
              className="w-full inline-flex justify-center items-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-600 dark:bg-gray-100 dark:hover:bg-gray-200 dark:disabled:bg-gray-400 text-white dark:text-gray-900 font-semibold py-2.5 px-4 rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 min-h-[40px]"
            >
              {fetcher.state === "submitting" ? (
                <>
                  <ArrowPathIcon className="animate-spin w-4 h-4" />
                  Saving...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Save Income Details
                </>
              )}
            </button>
          </fetcher.Form>
        </div>
      </div>
    </div>
  );
}
