import React, { useState } from "react";
import {
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import type { DashboardFilters } from "~/hooks/useDashboardFilters";

interface DashboardFilterControlsProps {
  filters: DashboardFilters;
  onDateRangeChange: (range: "7d" | "30d" | "90d" | "all") => void;
  onFeatureToggle: (feature: "tasks" | "finance" | "notes" | "day-planner") => void;
  onCategoryChange: (category: string | undefined) => void;
  onSearchChange: (query: string | undefined) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

const FEATURES = [
  { id: "tasks", label: "Tasks", icon: "✓" },
  { id: "finance", label: "Finance", icon: "$" },
  { id: "notes", label: "Notes", icon: "📝" },
  { id: "day-planner", label: "Planning", icon: "📅" },
];

const DATE_RANGES = [
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "90d", label: "Last 90 Days" },
  { id: "all", label: "All Time" },
];

export default function DashboardFilterControls({
  filters,
  onDateRangeChange,
  onFeatureToggle,
  onCategoryChange,
  onSearchChange,
  onReset,
  hasActiveFilters,
}: DashboardFilterControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-4 mb-6">
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Dashboard Filters
          </h3>
          {hasActiveFilters && (
            <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-400">
              Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
              Reset
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {isExpanded ? "Hide" : "Show"} Filters
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {/* Search */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Search insights, tasks..."
              value={filters.searchQuery || ""}
              onChange={(e) => onSearchChange(e.target.value || undefined)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Date Range
            </label>
            <div className="relative">
              <button
                onClick={() => setShowDateMenu(!showDateMenu)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                {DATE_RANGES.find((r) => r.id === filters.dateRange)?.label}
                <ChevronDownIcon className="w-4 h-4" />
              </button>

              {showDateMenu && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">
                  {DATE_RANGES.map((range) => (
                    <button
                      key={range.id}
                      onClick={() => {
                        onDateRangeChange(range.id as any);
                        setShowDateMenu(false);
                      }}
                      className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                        filters.dateRange === range.id
                          ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-semibold"
                          : "text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Features
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FEATURES.map((feature) => (
                <button
                  key={feature.id}
                  onClick={() => onFeatureToggle(feature.id as any)}
                  className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                    filters.selectedFeatures.includes(feature.id as any)
                      ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400"
                      : "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
                  }`}
                >
                  <span className="mr-1">{feature.icon}</span>
                  {feature.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter (for tasks) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Task Category
            </label>
            <div className="flex gap-2">
              <select
                value={filters.taskCategory || ""}
                onChange={(e) => onCategoryChange(e.target.value || undefined)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              >
                <option value="">All Categories</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="health">Health</option>
                <option value="learning">Learning</option>
                <option value="other">Other</option>
              </select>
              {filters.taskCategory && (
                <button
                  onClick={() => onCategoryChange(undefined)}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
