import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router";

interface ExpenseSummaryCardsProps {
  totalMonthlyCost: number;
  totalYearlyCost: number;
  annualGrossIncomeCents: number;
  taxDeductionPercentage: number;
  netRemainingMonthly: number;
  netRemainingYearly: number;
}

export default function ExpenseSummaryCards({
  totalMonthlyCost,
  totalYearlyCost,
  annualGrossIncomeCents,
  taxDeductionPercentage,
  netRemainingMonthly,
  netRemainingYearly,
}: ExpenseSummaryCardsProps) {
  const hasIncome = annualGrossIncomeCents !== 0;

  const metrics = [
    { label: "Monthly recurring", value: formatMoney(totalMonthlyCost) },
    { label: "Annual recurring", value: formatMoney(totalYearlyCost) },
    ...(hasIncome
      ? [
          { label: "Available monthly", value: formatMoney(netRemainingMonthly) },
          { label: "Available yearly", value: formatMoney(netRemainingYearly) },
        ]
      : []),
  ];

  return (
    <section className="mb-6 rounded-xl border border-gray-300 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <ArrowPathIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recurring cost snapshot</h2>
      </div>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg bg-gray-100 p-3 dark:bg-gray-700/60">
            <dt className="text-xs font-medium text-gray-600 dark:text-gray-400">{metric.label}</dt>
            <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-gray-100">{metric.value}</dd>
          </div>
        ))}
      </dl>
      {!hasIncome && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
          <Link to="/finance/income" className="font-semibold underline underline-offset-2 hover:text-gray-950 dark:hover:text-white">Configure income</Link>{" "}
          to calculate what remains after recurring expenses.
        </p>
      )}
    </section>
  );
}

function formatMoney(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}
