// Dashboard metrics and aggregated data types

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksWithoutDueDate: number;
  completionRate7d: number;
  completionRate30d: number;
  averageDailyCompletion30d: number;
  taskVelocity: number; // Tasks completed per day over 30 days
  completionTrend: "trending-up" | "stable" | "trending-down"; // Based on 7d vs 30d comparison
}

export interface BudgetMetrics {
  totalBudgets: number;
  activeBudgets: number;
  totalBudgetAmount: number;
  totalSpent: number;
  budgetUtilizationRate: number; // Percentage of total budget spent
  averageBudgetHealth: number; // Average health across all budgets
  highestUtilizationBudget?: {
    name: string;
    utilized: number;
    total: number;
    percentage: number;
  };
  upcomingExpenses30d: number;
  hasOverBudgetBudgets: boolean;
}

export interface NoteMetrics {
  totalNotes: number;
  totalFolders: number;
  notesCreatedLast7d: number;
  notesCreatedLast30d: number;
}

export interface DayPlannerMetrics {
  plannedDaysLast7d: number;
  plannedDaysLast30d: number;
  averageTasksPerDay30d: number;
  plannedTasksToday?: number;
  completedTasksToday?: number;
  planningConsistency: number; // Percentage of days with at least one planned task over 30 days
}

export interface EngagementMetrics {
  activeFeatures: Array<"tasks" | "finance" | "notes" | "day-planner">; // Which features user engaged with last 7 days
  lastActiveFeature?: "tasks" | "finance" | "notes" | "day-planner";
  lastActivityDate: Date;
  engagementScore: number; // 0-100 based on usage patterns
  isActiveUser: boolean; // Active in last 7 days
  daysSinceLastActivity: number;
  activityStreak: number; // Consecutive days of activity
  usageConsistency: number; // How consistently user engages across days
}

export interface GoalMetrics {
  weeklyTaskGoal?: number;
  monthlyTaskGoal?: number;
  dailyPlanningGoal?: boolean;
  budgetTargets?: Record<string, number>; // budgetId -> target completion percentage
}

export interface TimeSeriesMetric {
  date: string; // YYYY-MM-DD
  value: number;
}

export interface AggregatedDashboardData {
  taskMetrics: TaskMetrics;
  budgetMetrics: BudgetMetrics;
  noteMetrics: NoteMetrics;
  dayPlannerMetrics: DayPlannerMetrics;
  engagementMetrics: EngagementMetrics;
  goals: GoalMetrics;
  timeSeries: {
    taskCompletion: TimeSeriesMetric[]; // Last 30 days
    spending: TimeSeriesMetric[]; // Last 30 days
    planning: TimeSeriesMetric[]; // Last 30 days
  };
  insights: DashboardInsight[];
  preferences?: DashboardPreferences;
}

export interface DashboardInsight {
  type: "opportunity" | "achievement" | "warning" | "trend";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  actionable: boolean;
  actionUrl?: string;
  icon?: string;
}

export interface DashboardPreferences {
  layout: "grid" | "compact" | "detailed";
  visibleWidgets: string[];
  hiddenWidgets: string[];
  widgetOrder: string[];
  refreshInterval: number; // milliseconds
  goals?: GoalMetrics;
  theme?: "auto" | "light" | "dark";
}
