import { useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import type { Route } from "./+types/income";
import { requireAuth, getUserFromSession } from "~/modules/auth.server";
import { financeIncomeTable } from "~/db/schema";
import { eq } from "drizzle-orm";
import { db } from "~/db";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Income Dashboard" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);

  const currentUser = await getUserFromSession(request);

  const [userIncome]: Array<typeof financeIncomeTable.$inferSelect> = await db
    .select()
    .from(financeIncomeTable)
    .where(eq(financeIncomeTable.userId, currentUser.id))
    .limit(1);

  if (!userIncome) {
    return { annualGrossIncome: undefined, taxDeductionPercentage: undefined };
  }

  return {
    annualGrossIncome: userIncome.annualGrossIncome,
    taxDeductionPercentage: userIncome.taxDeductionPercentage,
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  const annualGrossIncome = formData.get("annualGrossIncome");
  const taxDeductionPercentage = formData.get("taxDeductionPercentage");
  const currentUser = await getUserFromSession(request);

  const [userIncome]: Array<typeof financeIncomeTable.$inferSelect> = await db
    .select()
    .from(financeIncomeTable)
    .where(eq(financeIncomeTable.userId, currentUser.id))
    .limit(1);
  if (userIncome) {
    await db
      .update(financeIncomeTable)
      .set({
        annualGrossIncome: Number(annualGrossIncome),
        taxDeductionPercentage: Number(taxDeductionPercentage),
      })
      .where(eq(financeIncomeTable.userId, currentUser.id));
    return {};
  }

  // If user income doesn't exist, create a new record
  await db.insert(financeIncomeTable).values({
    userId: currentUser.id,
    annualGrossIncome: Number(annualGrossIncome),
    taxDeductionPercentage: Number(taxDeductionPercentage),
  });

  return {};
}

export default function Income({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher();

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 md:mb-12 text-center md:text-left">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600">
              Income Dashboard
            </span>
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto md:mx-0">
            Manage your income sources and track your earnings.
          </p>
        </header>

        {/* Income Stats */}
        <div className="bg-white/90 backdrop-blur-md border border-gray-200 dark:bg-gray-800/70 dark:border-gray-700 rounded-2xl shadow-xl p-6 mb-8 w-full max-w-2xl mx-auto">
          {loaderData.annualGrossIncome ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-gray-100 dark:bg-gray-700/50 rounded-xl p-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                    Annual Gross Income
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    ${loaderData.annualGrossIncome.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700/50 rounded-xl p-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                    Tax Deduction Rate
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {loaderData.taxDeductionPercentage}%
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-5">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
                  Estimated Breakdowns
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Annual Tax
                    </p>
                    <p className="text-lg font-medium text-rose-400">
                      $
                      {(
                        (loaderData.annualGrossIncome *
                          loaderData.taxDeductionPercentage) /
                        100
                      ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Monthly Tax
                    </p>
                    <p className="text-lg font-medium text-rose-400">
                      $
                      {(
                        (loaderData.annualGrossIncome *
                          loaderData.taxDeductionPercentage) /
                        1200
                      ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Annual Net Income
                    </p>
                    <p className="text-lg font-medium text-emerald-400">
                      $
                      {(
                        (loaderData.annualGrossIncome *
                          (100 - loaderData.taxDeductionPercentage)) /
                        100
                      ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Monthly Net Income
                    </p>
                    <p className="text-lg font-medium text-emerald-400">
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
                className="w-16 h-16 text-gray-500 dark:text-gray-500 mx-auto mb-4"
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
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                No income data available yet.
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                Please enter your income details below.
              </p>
            </div>
          )}
        </div>

        {/* Income Form */}
        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-white/90 backdrop-blur-md border border-gray-200 dark:bg-gray-800/70 dark:border-gray-700 rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
              Update Income Details
            </h2>

            <fetcher.Form method="post" className="space-y-6">
              <div>
                <label
                  htmlFor="annualGrossIncome"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
                    className="w-full pl-8 pr-4 py-3 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="taxDeductionPercentage"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
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
                    className="w-full pl-4 pr-8 py-3 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-700/50 dark:border-gray-600 dark:text-gray-100 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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
                className="w-full inline-flex justify-center items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 shadow-sm hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
              >
                {fetcher.state === "submitting" ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
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
    </div>
  );
}
