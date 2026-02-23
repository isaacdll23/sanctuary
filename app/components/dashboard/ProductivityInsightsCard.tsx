import React from "react";
import { LightBulbIcon } from "@heroicons/react/24/outline";
import {
  DashboardWidgetHeader,
  getDashboardPanelClasses,
} from "./dashboardStyles";

interface ProductivityInsight {
  label: string;
  description: string;
  value: string | number;
  unit?: string;
}

interface ProductivityInsightsCardProps {
  insights: ProductivityInsight[];
  message: string;
}

export default function ProductivityInsightsCard({
  insights,
  message,
}: ProductivityInsightsCardProps) {
  return (
    <div className={getDashboardPanelClasses({ className: "p-6" })}>
      <DashboardWidgetHeader
        title="Productivity Insights"
        icon={<LightBulbIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
        iconContainerClassName="bg-blue-500/10"
        className="mb-6"
      />

      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center p-3.5 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 transition-colors duration-150"
          >
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {insight.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {insight.description}
              </p>
            </div>
            <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex-shrink-0 ml-4">
              {typeof insight.value === "number"
                ? insight.value.toFixed(1)
                : insight.value}
              <span className="text-xs text-gray-500 dark:text-gray-400 font-normal ml-1">
                {insight.unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 italic mt-5 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/20 border border-gray-100 dark:border-gray-700/30">
        {message}
      </p>
    </div>
  );
}
