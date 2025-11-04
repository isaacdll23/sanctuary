import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface ExpenseSummaryCardsProps {
  totalMonthlyCost: number;
  totalYearlyCost: number;
  annualGrossIncome: number;
  taxDeductionPercentage: number;
  netRemainingMonthly: number;
  netRemainingYearly: number;
}

export default function ExpenseSummaryCards({
  totalMonthlyCost,
  totalYearlyCost,
  annualGrossIncome,
  taxDeductionPercentage,
  netRemainingMonthly,
  netRemainingYearly,
}: ExpenseSummaryCardsProps) {
  const hasIncome = annualGrossIncome !== 0;

  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Monthly Summary */}
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <ArrowPathIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          Monthly Overview
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Total Monthly Expenses:
            </span>
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              $
              {(totalMonthlyCost / 100).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          {hasIncome && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Net Remaining Monthly:
              </span>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                $
                {(netRemainingMonthly / 100).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Yearly Summary */}
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <ArrowPathIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          Yearly Overview
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Total Yearly Expenses:
            </span>
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              $
              {(totalYearlyCost / 100).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          {hasIncome && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Net Remaining Yearly:
              </span>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                $
                {(netRemainingYearly / 100).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
