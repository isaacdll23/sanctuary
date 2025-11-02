import React from "react";
import { SparklesIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import type { AggregatedDashboardData } from "~/routes/dashboard/+types/dashboard";

interface ActionItemsPriorityProps {
  data: AggregatedDashboardData;
}

export default function ActionItemsPriorityWidget({
  data,
}: ActionItemsPriorityProps) {
  const { taskMetrics, insights } = data;

  // Get task-related insights that are actionable
  const actionableInsights = insights
    .filter((i) => i.actionable && i.type !== "achievement")
    .slice(0, 3);

  const hasOverdueOrPriority =
    taskMetrics.overdueTasks > 0 || taskMetrics.totalTasks > 0;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
        <div className="p-2 rounded-lg bg-yellow-500/10">
          <SparklesIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        </div>
        Action Items Priority
      </h3>

      {!hasOverdueOrPriority ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No action items right now. Great job!
          </p>
        </div>
      ) : actionableInsights.length > 0 ? (
        <div className="space-y-3">
          {actionableInsights.map((insight, idx) => {
            const bgClass =
              insight.type === "warning"
                ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30"
                : insight.type === "opportunity"
                  ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30"
                  : "bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600";

            const textClass =
              insight.type === "warning"
                ? "text-red-900 dark:text-red-300"
                : insight.type === "opportunity"
                  ? "text-blue-900 dark:text-blue-300"
                  : "text-gray-900 dark:text-gray-100";

            const priorityBadge =
              insight.priority === "high"
                ? "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                : insight.priority === "medium"
                  ? "bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                  : "bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-400";

            return (
              <a
                key={idx}
                href={insight.actionUrl || "#"}
                className={`p-4 rounded-lg border ${bgClass} hover:shadow-md transition-all duration-150 group flex items-start justify-between`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`text-sm font-semibold ${textClass}`}>
                      {insight.title}
                    </p>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${priorityBadge}`}
                    >
                      {insight.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {insight.description}
                  </p>
                </div>
                {insight.actionUrl && (
                  <div className="ml-3 flex-shrink-0">
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors" />
                  </div>
                )}
              </a>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {taskMetrics.overdueTasks > 0 && (
            <a
              href="/tasks"
              className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 hover:shadow-md transition-all duration-150 group flex items-start justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-300">
                    Clear Overdue Tasks
                  </p>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
                    high
                  </span>
                </div>
                <p className="text-sm text-red-700 dark:text-red-400">
                  You have {taskMetrics.overdueTasks} overdue task
                  {taskMetrics.overdueTasks !== 1 ? "s" : ""} to address
                </p>
              </div>
              <div className="ml-3 flex-shrink-0">
                <ChevronRightIcon className="w-5 h-5 text-red-400 dark:text-red-600 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
              </div>
            </a>
          )}

          {taskMetrics.completionRate30d < 50 && taskMetrics.totalTasks > 0 && (
            <a
              href="/tasks"
              className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 hover:shadow-md transition-all duration-150 group flex items-start justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-300">
                    Improve Completion Rate
                  </p>
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
                    medium
                  </span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  Your completion rate is {taskMetrics.completionRate30d}%
                </p>
              </div>
              <div className="ml-3 flex-shrink-0">
                <ChevronRightIcon className="w-5 h-5 text-yellow-400 dark:text-yellow-600 group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors" />
              </div>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
