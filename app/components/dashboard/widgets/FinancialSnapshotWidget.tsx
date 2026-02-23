import React from "react";
import { CurrencyDollarIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import type { AggregatedDashboardData } from "~/routes/dashboard/+types/dashboard";
import {
  DashboardWidgetHeader,
  getDashboardPanelClasses,
} from "../dashboardStyles";

interface FinancialSnapshotProps {
  data: AggregatedDashboardData;
}

export default function FinancialSnapshotWidget({ data }: FinancialSnapshotProps) {
  const { budgetMetrics } = data;

  const hasActiveBudgets = budgetMetrics.activeBudgets > 0;

  const getHealthColor = (health: number) => {
    if (health >= 70) return "emerald";
    if (health >= 40) return "yellow";
    return "red";
  };

  const healthColor = getHealthColor(budgetMetrics.averageBudgetHealth);

  const colorClasses = {
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      text: "text-emerald-700 dark:text-emerald-400",
      badge: "bg-emerald-100 dark:bg-emerald-500/20",
    },
    yellow: {
      bg: "bg-yellow-50 dark:bg-yellow-500/10",
      text: "text-yellow-700 dark:text-yellow-400",
      badge: "bg-yellow-100 dark:bg-yellow-500/20",
    },
    red: {
      bg: "bg-red-50 dark:bg-red-500/10",
      text: "text-red-700 dark:text-red-400",
      badge: "bg-red-100 dark:bg-red-500/20",
    },
  };

  const colors = colorClasses[healthColor];

  return (
    <div className={getDashboardPanelClasses({ className: "p-6" })}>
      <DashboardWidgetHeader
        title="Financial Snapshot"
        icon={<CurrencyDollarIcon className="w-5 h-5 text-green-600 dark:text-green-400" />}
        iconContainerClassName="bg-green-500/10"
        className="mb-6"
      />

      {!hasActiveBudgets ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            No active budgets yet. Create one to track spending.
          </p>
          <a
            href="/finance/expenses"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            Create Budget
            <ChevronRightIcon className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Budget Utilization Overview */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Overall Utilization
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {budgetMetrics.budgetUtilizationRate}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Spent
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${budgetMetrics.totalSpent.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
              <div
                className={`bg-gradient-to-r ${
                  healthColor === "emerald"
                    ? "from-emerald-500 to-emerald-600"
                    : healthColor === "yellow"
                      ? "from-yellow-500 to-yellow-600"
                      : "from-red-500 to-red-600"
                } h-2 rounded-full transition-all duration-300`}
                style={{
                  width: `${Math.min(budgetMetrics.budgetUtilizationRate, 100)}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Total Budget: ${budgetMetrics.totalBudgetAmount.toFixed(2)}
            </p>
          </div>

          {/* Budget Health Score */}
          <div className={`p-4 rounded-lg border ${colors.bg} ${colors.text.replace('text-', 'border-').replace('dark:', 'dark:border-')}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1">Budget Health Score</p>
                <p className="text-3xl font-bold">
                  {Math.round(budgetMetrics.averageBudgetHealth)}%
                </p>
              </div>
              <div className={`p-3 rounded-lg ${colors.badge}`}>
                <p className={`text-center text-sm font-semibold ${colors.text}`}>
                  {healthColor === "emerald"
                    ? "Good"
                    : healthColor === "yellow"
                      ? "Caution"
                      : "Critical"}
                </p>
              </div>
            </div>
          </div>

          {/* Highest Utilization Budget */}
          {budgetMetrics.highestUtilizationBudget && (
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                Most Active Budget
              </p>
              <p className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                {budgetMetrics.highestUtilizationBudget.name}
              </p>
              <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">
                ${budgetMetrics.highestUtilizationBudget.utilized.toFixed(2)} of $
                {budgetMetrics.highestUtilizationBudget.total.toFixed(2)} (
                {budgetMetrics.highestUtilizationBudget.percentage}%)
              </p>
            </div>
          )}

          {/* Upcoming Expenses */}
          <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30">
            <p className="text-sm font-medium text-purple-900 dark:text-purple-300 mb-1">
              Upcoming Expenses (30 days)
            </p>
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
              ${budgetMetrics.upcomingExpenses30d.toFixed(2)}
            </p>
          </div>

          {/* View All Budgets */}
          <a
            href="/finance/expenses"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm font-medium transition-colors"
          >
            View All Budgets
            <ChevronRightIcon className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  );
}
