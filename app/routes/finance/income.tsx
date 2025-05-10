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

  const [userIncome]: Array<typeof financeIncomeTable.$inferSelect> = await db.
    select()
    .from(financeIncomeTable)
    .where(eq(financeIncomeTable.userId, currentUser.id))
    .limit(1);
    
  if (!userIncome) {
    return { annualGrossIncome: undefined, taxDeductionPercentage: undefined };
  }

  return { annualGrossIncome: userIncome.annualGrossIncome, taxDeductionPercentage: userIncome.taxDeductionPercentage };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const formData = await request.formData();
  const annualGrossIncome = formData.get("annualGrossIncome");
  const taxDeductionPercentage = formData.get("taxDeductionPercentage");
  const currentUser = await getUserFromSession(request);

  const [userIncome]: Array<typeof financeIncomeTable.$inferSelect> = await db.
    select()
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
    <div className="h-full flex flex-col items-center p-4 gap-6">
      <h1 className="text-2xl font-bold">Income Dashboard</h1>
      <div className="bg-gray-800 rounded-xl p-4 shadow-md w-full max-w-md">
        {loaderData.annualGrossIncome ? (
          <div>
            <p className="text-lg">
              Current Annual Gross Income: <strong>${loaderData.annualGrossIncome}</strong>
            </p>
            <p className="text-lg">
              Current Tax Deduction Percentage: <strong>{loaderData.taxDeductionPercentage}%</strong>
            </p>
            <p className="text-lg">
              Estimated Annual Tax Deduction: <strong>${((loaderData.annualGrossIncome * loaderData.taxDeductionPercentage) / 100).toFixed(2)}</strong>
            </p>
            <p className="text-lg">
              Estimated Monthly Tax Deduction: <strong>${((loaderData.annualGrossIncome * loaderData.taxDeductionPercentage) / 1200).toFixed(2)}</strong>
            </p>
            <p className="text-lg">
              Estimated Monthly Net Income: <strong>${((loaderData.annualGrossIncome * (100 - loaderData.taxDeductionPercentage)) / 1200).toFixed(2)}</strong>
            </p>
            <p className="text-lg">
              Estimated Annual Net Income: <strong>${((loaderData.annualGrossIncome * (100 - loaderData.taxDeductionPercentage)) / 100).toFixed(2)}</strong>
            </p>
          </div>
        ) : (
          <p className="text-lg">
            No income data available. Please enter your income details.
          </p>
        )}
        <p className="text-lg">
          
        </p>
      </div>
      <fetcher.Form
        method="post"
        className="flex flex-col items-center gap-4 w-full max-w-md bg-gray-800 p-6 rounded-xl shadow-md"
      >
        <label>
          Annual Gross Income
        </label>
        <input
          type="number"
          name="annualGrossIncome"
          placeholder="Annual Gross Income"
          defaultValue={loaderData.annualGrossIncome}
          className="w-full border-2 border-gray-500 rounded-xl p-2 text-sm bg-gray-600 text-white"
          required
        />
        <label>
          Tax Deduction Percentage
        </label>
        <input
          type="number"
          name="taxDeductionPercentage"
          placeholder="Tax Deduction Percentage"
          defaultValue={loaderData.taxDeductionPercentage}
          className="w-full border-2 border-gray-500 rounded-xl p-2 text-sm bg-gray-600 text-white"
          required
        />
        <button
          type="submit"
          className="w-full rounded-xl border-2 px-8 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-800 bg-indigo-700 text-white hover:bg-blue-800 transition-colors duration-200"
        >
          {fetcher.state === "submitting" ? (
            "Saving..."
          ) : (
            "Save Income"
          )} 
        </button>
      </fetcher.Form>
    </div>
  );
}