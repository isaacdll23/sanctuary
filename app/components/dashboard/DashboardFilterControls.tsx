import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
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
  { id: "tasks", label: "Tasks" },
  { id: "finance", label: "Finance" },
  { id: "notes", label: "Notes" },
  { id: "day-planner", label: "Planning" },
];

const DATE_RANGES = [
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "90d", label: "90 Days" },
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
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6">
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Filter Your Metrics
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
            Reset Filters
          </button>
        )}
      </div>

      {/* Filters Grid */}
      <div className="space-y-5">
        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Time Period
          </label>
          <div className="flex flex-wrap gap-2">
            {DATE_RANGES.map((range) => (
              <button
                key={range.id}
                onClick={() => onDateRangeChange(range.id as any)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  filters.dateRange === range.id
                    ? "bg-indigo-600 dark:bg-indigo-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Features Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Show Data From
          </label>
          <div className="flex flex-wrap gap-2">
            {FEATURES.map((feature) => (
              <button
                key={feature.id}
                onClick={() => onFeatureToggle(feature.id as any)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  filters.selectedFeatures.includes(feature.id as any)
                    ? "bg-indigo-600 dark:bg-indigo-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {feature.label}
              </button>
            ))}
          </div>
        </div>

        {/* Task Category Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Task Category
          </label>
          <div className="flex gap-2 items-center">
            <select
              value={filters.taskCategory || ""}
              onChange={(e) => onCategoryChange(e.target.value || undefined)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
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
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Clear category filter"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Search
          </label>
          <input
            type="text"
            placeholder="Search dashboard insights..."
            value={filters.searchQuery || ""}
            onChange={(e) => onSearchChange(e.target.value || undefined)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
          />
        </div>
      </div>
    </div>
  );
}
