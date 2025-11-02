/**
 * Dashboard Filters Hook
 * Manages date range, category, and feature filters with persistence
 */

import { useState, useCallback, useEffect } from "react";

export interface DashboardFilters {
  dateRange: "7d" | "30d" | "90d" | "all";
  selectedFeatures: ("tasks" | "finance" | "notes" | "day-planner")[];
  taskCategory?: string;
  searchQuery?: string;
}

const STORAGE_KEY = "dashboard-filters";

/**
 * Hook for managing dashboard filters
 */
export function useDashboardFilters() {
  const [filters, setFilters] = useState<DashboardFilters>(() => {
    // Load from localStorage on mount
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return getDefaultFilters();
        }
      }
    }
    return getDefaultFilters();
  });

  // Persist filters to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    }
  }, [filters]);

  const updateDateRange = useCallback(
    (dateRange: DashboardFilters["dateRange"]) => {
      setFilters((prev) => ({ ...prev, dateRange }));
    },
    []
  );

  const toggleFeature = useCallback(
    (feature: "tasks" | "finance" | "notes" | "day-planner") => {
      setFilters((prev) => {
        const isSelected = prev.selectedFeatures.includes(feature);
        return {
          ...prev,
          selectedFeatures: isSelected
            ? prev.selectedFeatures.filter((f) => f !== feature)
            : [...prev.selectedFeatures, feature],
        };
      });
    },
    []
  );

  const setTaskCategory = useCallback((category: string | undefined) => {
    setFilters((prev) => ({ ...prev, taskCategory: category }));
  }, []);

  const setSearchQuery = useCallback((query: string | undefined) => {
    setFilters((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(getDefaultFilters());
  }, []);

  const hasActiveFilters =
    filters.dateRange !== "30d" ||
    filters.selectedFeatures.length < 4 ||
    filters.taskCategory !== undefined ||
    filters.searchQuery !== undefined;

  return {
    filters,
    updateDateRange,
    toggleFeature,
    setTaskCategory,
    setSearchQuery,
    resetFilters,
    hasActiveFilters,
  };
}

/**
 * Get default filter values
 */
function getDefaultFilters(): DashboardFilters {
  return {
    dateRange: "30d",
    selectedFeatures: ["tasks", "finance", "notes", "day-planner"],
    taskCategory: undefined,
    searchQuery: undefined,
  };
}

/**
 * Filter aggregated dashboard data based on selected filters
 */
export function applyDashboardFilters(
  data: any,
  filters: DashboardFilters
): any {
  // Filter time-series data based on date range
  const filtered = { ...data };

  // This function can be expanded to filter various data based on filters
  // For now, it's a placeholder that returns the data as-is
  // The actual filtering happens in child widgets

  return filtered;
}

/**
 * Get date range in days
 */
export function getDateRangeInDays(dateRange: string): number {
  switch (dateRange) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    default:
      return 365;
  }
}
