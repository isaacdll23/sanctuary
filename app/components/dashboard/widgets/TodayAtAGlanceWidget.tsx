import React from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import type { AggregatedDashboardData } from "~/routes/dashboard/+types/dashboard";

interface TodayAtAGlanceProps {
  data: AggregatedDashboardData;
}

export default function TodayAtAGlanceWidget({ data }: TodayAtAGlanceProps) {
  const { dayPlannerMetrics, taskMetrics, budgetMetrics, timeSeries } = data;

  const plannedTasks = dayPlannerMetrics.plannedTasksToday ?? 0;
  const completedTasks = dayPlannerMetrics.completedTasksToday ?? 0;
  const dueTasks = taskMetrics.overdueTasks;

  // Get today's spending from time series
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const todaySpending = timeSeries.spending.find((d) => d.date === todayStr)?.value || 0;

  const hasContent = plannedTasks > 0 || dueTasks > 0 || budgetMetrics.activeBudgets > 0;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <ClockIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          Today at a Glance
        </h3>
      </div>

      {!hasContent ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nothing planned for today. Add tasks or plan your day to see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Planned Tasks */}
          {plannedTasks > 0 && (
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Planned Tasks
                  </p>
                  <p className="mt-1 flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {completedTasks}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      of {plannedTasks} completed
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10">
                    <CheckCircleIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
              </div>
              <div className="mt-3 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${plannedTasks > 0 ? (completedTasks / plannedTasks) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Due Tasks */}
          {dueTasks > 0 && (
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-300">
                    Attention Needed
                  </p>
                  <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">
                    {dueTasks} overdue
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/tasks"
                    className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors"
                  >
                    <ChevronRightIcon className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Budget Activity */}
          {budgetMetrics.activeBudgets > 0 && (
            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-300">
                    Today's Spending
                  </p>
                  <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    ${todaySpending.toFixed(2)}
                  </p>
                  <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                    {budgetMetrics.activeBudgets} active budget{budgetMetrics.activeBudgets !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/finance"
                    className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors"
                  >
                    <ChevronRightIcon className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
