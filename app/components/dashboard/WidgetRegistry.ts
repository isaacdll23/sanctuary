/**
 * Widget Registry System for Dashboard
 * Manages available widgets, their configuration, and visibility rules
 */

import type {
  AggregatedDashboardData,
  EngagementMetrics,
  TaskMetrics,
  BudgetMetrics,
  DayPlannerMetrics,
  NoteMetrics,
} from "~/routes/dashboard/+types/dashboard";

export type WidgetType =
  | "today-at-glance"
  | "progress-summary"
  | "action-items-priority"
  | "financial-snapshot"
  | "weekly-achievements"
  | "completion-rate"
  | "productivity-insights";

export interface WidgetConfig {
  id: WidgetType;
  title: string;
  description: string;
  category: "overview" | "tasks" | "finance" | "planning" | "insights";
  priority: number; // Higher = shows first by default
  isResizable: boolean;
  defaultWidth: "full" | "half" | "third"; // Grid layout hint
  minHeight: number; // Minimum pixels
  canHide: boolean;
  requiredData: (keyof AggregatedDashboardData)[]; // Which data fields this widget needs
}

export interface WidgetVisibilityRules {
  shouldShow: (data: AggregatedDashboardData) => boolean;
  isAdaptive: boolean; // Changes based on engagement
  recommendedFor: string[]; // User segments this is good for
}

export interface WidgetInstance {
  config: WidgetConfig;
  visibility: WidgetVisibilityRules;
  position?: number; // Order in dashboard
  isVisible: boolean;
  isCollapsed?: boolean;
}

/**
 * Complete widget registry
 */
export const WIDGET_REGISTRY: Record<WidgetType, WidgetConfig> = {
  "today-at-glance": {
    id: "today-at-glance",
    title: "Today at a Glance",
    description: "Scheduled tasks, due items, and budget transactions for today",
    category: "overview",
    priority: 100,
    isResizable: false,
    defaultWidth: "full",
    minHeight: 200,
    canHide: true,
    requiredData: ["dayPlannerMetrics", "taskMetrics", "budgetMetrics"],
  },
  "progress-summary": {
    id: "progress-summary",
    title: "Progress Summary",
    description: "Visual progress across all productivity areas",
    category: "overview",
    priority: 90,
    isResizable: true,
    defaultWidth: "half",
    minHeight: 180,
    canHide: true,
    requiredData: ["taskMetrics", "budgetMetrics", "dayPlannerMetrics", "noteMetrics"],
  },
  "action-items-priority": {
    id: "action-items-priority",
    title: "Action Items Priority Stack",
    description: "Top prioritized tasks requiring your attention",
    category: "tasks",
    priority: 80,
    isResizable: true,
    defaultWidth: "half",
    minHeight: 200,
    canHide: true,
    requiredData: ["taskMetrics"],
  },
  "financial-snapshot": {
    id: "financial-snapshot",
    title: "Financial Snapshot",
    description: "Budget status, spending overview, and upcoming expenses",
    category: "finance",
    priority: 85,
    isResizable: true,
    defaultWidth: "half",
    minHeight: 200,
    canHide: true,
    requiredData: ["budgetMetrics"],
  },
  "weekly-achievements": {
    id: "weekly-achievements",
    title: "Weekly Achievements",
    description: "Milestones reached and consistency streaks",
    category: "insights",
    priority: 70,
    isResizable: true,
    defaultWidth: "half",
    minHeight: 150,
    canHide: true,
    requiredData: ["taskMetrics", "engagementMetrics"],
  },
  "completion-rate": {
    id: "completion-rate",
    title: "Task Completion Rate",
    description: "Visual representation of task completion trends",
    category: "tasks",
    priority: 60,
    isResizable: true,
    defaultWidth: "half",
    minHeight: 200,
    canHide: true,
    requiredData: ["taskMetrics"],
  },
  "productivity-insights": {
    id: "productivity-insights",
    title: "Productivity Insights",
    description: "Actionable insights and recommendations",
    category: "insights",
    priority: 50,
    isResizable: true,
    defaultWidth: "full",
    minHeight: 150,
    canHide: true,
    requiredData: ["taskMetrics", "budgetMetrics", "dayPlannerMetrics", "engagementMetrics"],
  },
};

/**
 * Visibility rules for each widget
 */
export const WIDGET_VISIBILITY: Record<WidgetType, WidgetVisibilityRules> = {
  "today-at-glance": {
    shouldShow: (data) => {
      // Show if user has any of: planned tasks today, due tasks, or budget activity
      return (
        (data.dayPlannerMetrics.plannedTasksToday ?? 0) > 0 ||
        data.taskMetrics.overdueTasks > 0 ||
        data.budgetMetrics.activeBudgets > 0
      );
    },
    isAdaptive: true,
    recommendedFor: ["active-users", "power-users"],
  },
  "progress-summary": {
    shouldShow: (data) => {
      // Show if user uses multiple features
      return data.engagementMetrics.activeFeatures.length >= 2;
    },
    isAdaptive: true,
    recommendedFor: ["all-users"],
  },
  "action-items-priority": {
    shouldShow: (data) => {
      // Show if user has tasks to work on
      return (
        data.taskMetrics.totalTasks > 0 &&
        data.engagementMetrics.activeFeatures.includes("tasks")
      );
    },
    isAdaptive: true,
    recommendedFor: ["task-focused", "power-users"],
  },
  "financial-snapshot": {
    shouldShow: (data) => {
      // Show if user has active budgets
      return (
        data.budgetMetrics.activeBudgets > 0 ||
        data.engagementMetrics.activeFeatures.includes("finance")
      );
    },
    isAdaptive: true,
    recommendedFor: ["finance-users", "power-users"],
  },
  "weekly-achievements": {
    shouldShow: (data) => {
      // Show if user has had any activity in the past week
      return data.engagementMetrics.isActiveUser;
    },
    isAdaptive: true,
    recommendedFor: ["all-users"],
  },
  "completion-rate": {
    shouldShow: (data) => {
      // Show if user has completed tasks recently
      return (
        data.taskMetrics.completedTasks > 0 &&
        data.engagementMetrics.activeFeatures.includes("tasks")
      );
    },
    isAdaptive: false,
    recommendedFor: ["task-focused", "power-users"],
  },
  "productivity-insights": {
    shouldShow: (data) => {
      // Always show insights if user is active
      return data.engagementMetrics.isActiveUser || data.taskMetrics.totalTasks > 0;
    },
    isAdaptive: true,
    recommendedFor: ["all-users"],
  },
};

/**
 * Get all widgets that should be shown for a user
 * Filters based on visibility rules and data availability
 */
export function getVisibleWidgets(
  data: AggregatedDashboardData,
  userPreferences?: Record<string, any>
): WidgetInstance[] {
  const visibleWidgets: WidgetInstance[] = [];

  // Get hidden widgets from user preferences
  const hiddenWidgets = userPreferences?.hiddenWidgets || [];
  const widgetOrder = userPreferences?.widgetOrder || [];

  Object.entries(WIDGET_REGISTRY).forEach(([widgetId, config]) => {
    const typedId = widgetId as WidgetType;
    const visibility = WIDGET_VISIBILITY[typedId];

    // Skip if user has hidden this widget
    if (hiddenWidgets.includes(widgetId)) {
      return;
    }

    // Check if widget should be visible based on rules
    if (visibility.shouldShow(data)) {
      visibleWidgets.push({
        config,
        visibility,
        position: widgetOrder.indexOf(widgetId),
        isVisible: true,
      });
    }
  });

  // Sort by position (custom order) then by priority
  visibleWidgets.sort((a, b) => {
    // If both have positions set, use custom order
    if (a.position !== undefined && b.position !== undefined) {
      return a.position - b.position;
    }
    // Otherwise, use priority
    return b.config.priority - a.config.priority;
  });

  return visibleWidgets;
}

/**
 * Get widget configuration by ID
 */
export function getWidgetConfig(widgetId: WidgetType): WidgetConfig | null {
  return WIDGET_REGISTRY[widgetId] || null;
}

/**
 * Get widget visibility rules by ID
 */
export function getWidgetVisibility(widgetId: WidgetType): WidgetVisibilityRules | null {
  return WIDGET_VISIBILITY[widgetId] || null;
}

/**
 * Check if a widget has all required data
 */
export function hasRequiredData(
  config: WidgetConfig,
  data: AggregatedDashboardData
): boolean {
  return config.requiredData.every((field) => {
    const value = data[field];
    return value !== null && value !== undefined;
  });
}
