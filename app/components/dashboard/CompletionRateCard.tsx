import React from "react";
import { ChartBarIcon } from "@heroicons/react/24/outline";

interface CompletionRateProps {
  last7Days: {
    completed: number;
    total: number;
  };
  last30Days: {
    completed: number;
    total: number;
  };
}

export default function CompletionRateCard({
  last7Days,
  last30Days,
}: CompletionRateProps) {
  const calculatePercentage = (completed: number, total: number) => {
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  const percentage7d = calculatePercentage(last7Days.completed, last7Days.total);
  const percentage30d = calculatePercentage(
    last30Days.completed,
    last30Days.total
  );

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-150 p-6">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-gray-100 flex items-center gap-2">
        <div className="p-2 rounded-lg bg-purple-500/10">
          <ChartBarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        Task Completion Rate
      </h3>

      <div className="space-y-6">
        {/* 7 Days */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Last 7 Days
            </span>
            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
              {percentage7d}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(percentage7d, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {last7Days.completed} of {last7Days.total} tasks completed
          </p>
        </div>

        {/* 30 Days */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Last 30 Days
            </span>
            <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
              {percentage30d}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(percentage30d, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {last30Days.completed} of {last30Days.total} tasks completed
          </p>
        </div>
      </div>
    </div>
  );
}
