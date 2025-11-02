import React from "react";
import { CheckCircleIcon, ArrowTrendingUpIcon } from "@heroicons/react/24/outline";
import type { AggregatedDashboardData } from "~/routes/dashboard/+types/dashboard";

interface ProgressSummaryProps {
  data: AggregatedDashboardData;
}

interface ProgressItem {
  label: string;
  current: number;
  target: number;
  icon: React.ReactNode;
  color: "indigo" | "emerald" | "blue" | "amber" | "purple" | "cyan";
  href: string;
}

export default function ProgressSummaryWidget({ data }: ProgressSummaryProps) {
  const { taskMetrics, budgetMetrics, dayPlannerMetrics, noteMetrics } = data;

  const progressItems: ProgressItem[] = [
    {
      label: "Tasks",
      current: taskMetrics.completedTasks,
      target: taskMetrics.totalTasks || 1,
      icon: <CheckCircleIcon className="w-5 h-5" />,
      color: "indigo",
      href: "/tasks",
    },
    {
      label: "Planning",
      current: dayPlannerMetrics.plannedDaysLast30d,
      target: 30,
      icon: <ArrowTrendingUpIcon className="w-5 h-5" />,
      color: "blue",
      href: "/day-planner",
    },
    {
      label: "Budget Health",
      current: Math.max(0, 100 - budgetMetrics.budgetUtilizationRate),
      target: 100,
      icon: <CheckCircleIcon className="w-5 h-5" />,
      color: "emerald",
      href: "/finance",
    },
    {
      label: "Notes",
      current: noteMetrics.totalNotes,
      target: Math.max(noteMetrics.totalNotes * 1.2, 10),
      icon: <CheckCircleIcon className="w-5 h-5" />,
      color: "purple",
      href: "/notes",
    },
  ];

  const colorClasses: Record<string, { bg: string; bar: string; text: string }> = {
    indigo: {
      bg: "bg-indigo-50 dark:bg-indigo-500/10",
      bar: "from-indigo-500 to-indigo-600",
      text: "text-indigo-600 dark:text-indigo-400",
    },
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      bar: "from-emerald-500 to-emerald-600",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    blue: {
      bg: "bg-blue-50 dark:bg-blue-500/10",
      bar: "from-blue-500 to-blue-600",
      text: "text-blue-600 dark:text-blue-400",
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-500/10",
      bar: "from-amber-500 to-amber-600",
      text: "text-amber-600 dark:text-amber-400",
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-500/10",
      bar: "from-purple-500 to-purple-600",
      text: "text-purple-600 dark:text-purple-400",
    },
    cyan: {
      bg: "bg-cyan-50 dark:bg-cyan-500/10",
      bar: "from-cyan-500 to-cyan-600",
      text: "text-cyan-600 dark:text-cyan-400",
    },
  };

  const calculatePercentage = (current: number, target: number): number => {
    if (target === 0) return 0;
    return Math.min(100, (current / target) * 100);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
        <div className="p-2 rounded-lg bg-purple-500/10">
          <ArrowTrendingUpIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        Progress Summary
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {progressItems.map((item) => {
          const percentage = calculatePercentage(item.current, item.target);
          const colors = colorClasses[item.color];

          return (
            <a
              key={item.label}
              href={item.href}
              className="group p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-150"
            >
              <div className={`${colors.bg} p-3 rounded-lg mb-3 inline-block`}>
                <div className={colors.text}>{item.icon}</div>
              </div>

              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                {item.label}
              </p>

              <div className="mt-2 flex items-end gap-2">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {Math.round(item.current)}
                    </span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-white">
                      {Math.round(percentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`bg-gradient-to-r ${colors.bar} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
