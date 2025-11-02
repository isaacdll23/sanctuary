import { subDays, startOfDay, endOfDay, eachDayOfInterval, format } from "date-fns";
import type {
  TaskMetrics,
  BudgetMetrics,
  NoteMetrics,
  DayPlannerMetrics,
  EngagementMetrics,
  TimeSeriesMetric,
  DashboardInsight,
} from "~/routes/dashboard/+types/dashboard";

/**
 * Calculate task metrics for a user
 */
export function calculateTaskMetrics(tasks: any[]): TaskMetrics {
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const thirtyDaysAgo = subDays(now, 30);
  const today = startOfDay(now);

  const allTasks = tasks || [];
  const tasksLast7d = allTasks.filter(
    (t) => t.createdAt >= startOfDay(sevenDaysAgo)
  );
  const tasksLast30d = allTasks.filter(
    (t) => t.createdAt >= startOfDay(thirtyDaysAgo)
  );

  const completedLast7d = tasksLast7d.filter((t) => t.completedAt != null);
  const completedLast30d = tasksLast30d.filter((t) => t.completedAt != null);
  const completedToday = allTasks.filter(
    (t) => t.completedAt != null && t.completedAt >= today
  );

  const overdueTasks = allTasks.filter(
    (t) =>
      t.completedAt == null &&
      t.dueDate != null &&
      new Date(t.dueDate) < startOfDay(now)
  );

  const tasksWithoutDueDate = allTasks.filter((t) => t.dueDate == null);

  // Calculate completion rates
  const completionRate7d =
    tasksLast7d.length > 0
      ? Math.round((completedLast7d.length / tasksLast7d.length) * 100)
      : 0;

  const completionRate30d =
    tasksLast30d.length > 0
      ? Math.round((completedLast30d.length / tasksLast30d.length) * 100)
      : 0;

  // Daily average completion over 30 days
  const averageDailyCompletion30d =
    completedLast30d.length > 0 ? completedLast30d.length / 30 : 0;

  // Weekly average creation over 30 days
  const averageWeeklyCreation30d =
    tasksLast30d.length > 0 ? tasksLast30d.length / 4.29 : 0;

  // Task velocity: completed per day over 30 days
  const taskVelocity = averageDailyCompletion30d;

  // Determine completion trend
  const completionTrend: "trending-up" | "stable" | "trending-down" =
    completionRate7d > completionRate30d + 10
      ? "trending-up"
      : completionRate7d < completionRate30d - 10
        ? "trending-down"
        : "stable";

  // Find top category
  const categoryMap = new Map<string, number>();
  allTasks.forEach((t) => {
    if (t.category) {
      categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + 1);
    }
  });
  let topCategory: string | undefined;
  let topCategoryCount: number | undefined;
  if (categoryMap.size > 0) {
    const entries = Array.from(categoryMap.entries());
    const [category, count] = entries.reduce((a, b) =>
      a[1] > b[1] ? a : b
    );
    topCategory = category;
    topCategoryCount = count;
  }

  return {
    totalTasks: allTasks.length,
    completedTasks: allTasks.filter((t) => t.completedAt != null).length,
    overdueTasks: overdueTasks.length,
    tasksWithoutDueDate: tasksWithoutDueDate.length,
    completionRate7d,
    completionRate30d,
    averageDailyCompletion30d: parseFloat(averageDailyCompletion30d.toFixed(2)),
    averageWeeklyCreation30d: parseFloat(averageWeeklyCreation30d.toFixed(2)),
    taskVelocity: parseFloat(taskVelocity.toFixed(2)),
    completionTrend,
    topCategory,
    topCategoryCount,
  };
}

/**
 * Calculate budget metrics for a user
 */
export function calculateBudgetMetrics(
  budgets: any[],
  transactions: any[]
): BudgetMetrics {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const startOfThirtyDays = startOfDay(thirtyDaysAgo);

  const activeBudgets = budgets.filter((b) => {
    const member = b.budgetMembers?.[0]; // Assuming this relationship exists
    return member?.status === "active";
  });

  let totalBudgetAmount = 0;
  let totalSpent = 0;
  const budgetUtilizations: number[] = [];
  let highestUtilizationBudget: any;
  let maxUtilization = 0;

  // For each budget, calculate spending
  activeBudgets.forEach((budget) => {
    const amount = parseFloat(budget.totalAmount || "0");
    totalBudgetAmount += amount;

    const budgetTransactions = transactions.filter(
      (t) => t.budgetId === budget.id
    );
    const spent = budgetTransactions.reduce((sum, t) => {
      return sum + parseFloat(t.amount || "0");
    }, 0);

    totalSpent += spent;
    const utilization = amount > 0 ? (spent / amount) * 100 : 0;
    budgetUtilizations.push(utilization);

    if (utilization > maxUtilization) {
      maxUtilization = utilization;
      highestUtilizationBudget = {
        name: budget.name,
        utilized: parseFloat(spent.toFixed(2)),
        total: amount,
        percentage: Math.round(utilization),
      };
    }
  });

  // Upcoming expenses (next 30 days)
  const upcomingTransactions = transactions.filter(
    (t) =>
      t.transactionDate >= startOfThirtyDays &&
      t.transactionDate <= endOfDay(now)
  );
  const upcomingExpenses = upcomingTransactions.reduce((sum, t) => {
    return sum + parseFloat(t.amount || "0");
  }, 0);

  const averageBudgetHealth =
    budgetUtilizations.length > 0
      ? 100 -
        budgetUtilizations.reduce((sum, u) => sum + u, 0) /
          budgetUtilizations.length
      : 100;

  const hasOverBudgetBudgets = budgetUtilizations.some((u) => u > 100);

  return {
    totalBudgets: budgets.length,
    activeBudgets: activeBudgets.length,
    totalBudgetAmount: parseFloat(totalBudgetAmount.toFixed(2)),
    totalSpent: parseFloat(totalSpent.toFixed(2)),
    budgetUtilizationRate: Math.round(
      totalBudgetAmount > 0 ? (totalSpent / totalBudgetAmount) * 100 : 0
    ),
    averageBudgetHealth: parseFloat(averageBudgetHealth.toFixed(2)),
    highestUtilizationBudget,
    upcomingExpenses30d: parseFloat(upcomingExpenses.toFixed(2)),
    hasOverBudgetBudgets,
  };
}

/**
 * Calculate note metrics for a user
 */
export function calculateNoteMetrics(
  notes: any[],
  folders: any[]
): NoteMetrics {
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const thirtyDaysAgo = subDays(now, 30);

  const notesLast7d = notes.filter(
    (n) => n.createdAt >= startOfDay(sevenDaysAgo)
  );
  const notesLast30d = notes.filter(
    (n) => n.createdAt >= startOfDay(thirtyDaysAgo)
  );

  const notesCreationTrend =
    notesLast30d.length > 0 ? notesLast30d.length / 30 : 0;

  // Find most used folder
  const folderUsage = new Map<number, number>();
  notes.forEach((n) => {
    if (n.folderId) {
      folderUsage.set(n.folderId, (folderUsage.get(n.folderId) || 0) + 1);
    }
  });

  let mostUsedFolder: string | undefined;
  if (folderUsage.size > 0) {
    const entries = Array.from(folderUsage.entries());
    const [folderId] = entries.reduce((a, b) => (a[1] > b[1] ? a : b));
    const folder = folders.find((f) => f.id === folderId);
    mostUsedFolder = folder?.name;
  }

  const averageNotesPerFolder =
    folders.length > 0 ? notes.length / folders.length : 0;

  return {
    totalNotes: notes.length,
    totalFolders: folders.length,
    notesCreatedLast7d: notesLast7d.length,
    notesCreatedLast30d: notesLast30d.length,
    averageNotesPerFolder: parseFloat(averageNotesPerFolder.toFixed(2)),
    mostUsedFolder,
    notesCreationTrend: parseFloat(notesCreationTrend.toFixed(2)),
  };
}

/**
 * Calculate day planner metrics for a user
 */
export function calculateDayPlannerMetrics(
  dayPlans: any[],
  dayPlanSections: any[]
): DayPlannerMetrics {
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const thirtyDaysAgo = subDays(now, 30);
  const today = startOfDay(now);

  const plansLast7d = dayPlans.filter(
    (p) => p.planDate >= startOfDay(sevenDaysAgo)
  );
  const plansLast30d = dayPlans.filter(
    (p) => p.planDate >= startOfDay(thirtyDaysAgo)
  );

  // Count planned days (days with at least one planned task)
  const plannedDaysLast7d = new Set(plansLast7d.map((p) => p.planDate)).size;
  const plannedDaysLast30d = new Set(plansLast30d.map((p) => p.planDate)).size;

  // Completed tasks in last 7 and 30 days
  const completedTasksLast7d = dayPlanSections.filter(
    (s) =>
      s.completedAt != null && s.completedAt >= startOfDay(sevenDaysAgo)
  ).length;
  const completedTasksLast30d = dayPlanSections.filter(
    (s) =>
      s.completedAt != null && s.completedAt >= startOfDay(thirtyDaysAgo)
  ).length;

  // Average tasks per day over 30 days
  const averageTasksPerDay30d =
    plansLast30d.length > 0
      ? dayPlanSections.filter((s) => {
          const plan = plansLast30d.find((p) => p.id === s.planId);
          return plan != null;
        }).length / 30
      : 0;

  // Today's plan
  const todayPlan = dayPlans.find((p) => p.planDate >= today);
  const plannedTasksToday = todayPlan
    ? dayPlanSections.filter((s) => s.planId === todayPlan.id).length
    : 0;
  const completedTasksToday = todayPlan
    ? dayPlanSections.filter(
        (s) =>
          s.planId === todayPlan.id &&
          s.completedAt != null &&
          s.completedAt >= today
      ).length
    : 0;

  // Planning consistency: percentage of days with at least one plan
  const planningConsistency =
    plannedDaysLast30d > 0 ? (plannedDaysLast30d / 30) * 100 : 0;

  return {
    plannedDaysLast7d,
    plannedDaysLast30d,
    averageTasksPerDay30d: parseFloat(averageTasksPerDay30d.toFixed(2)),
    completedTasksLast7d,
    completedTasksLast30d,
    plannedTasksToday,
    completedTasksToday,
    planningConsistency: parseFloat(planningConsistency.toFixed(2)),
  };
}

/**
 * Calculate engagement metrics for a user based on activity
 */
export function calculateEngagementMetrics(
  taskActivity: Date | null,
  budgetActivity: Date | null,
  noteActivity: Date | null,
  dayPlannerActivity: Date | null
): EngagementMetrics {
  const now = new Date();
  const sevenDaysAgo = startOfDay(subDays(now, 7));
  const activities = [
    { feature: "tasks" as const, date: taskActivity },
    { feature: "finance" as const, date: budgetActivity },
    { feature: "notes" as const, date: noteActivity },
    { feature: "day-planner" as const, date: dayPlannerActivity },
  ];

  // Determine active features (engaged in last 7 days)
  const activeFeatures = activities
    .filter((a) => a.date != null && new Date(a.date) >= sevenDaysAgo)
    .map((a) => a.feature);

  // Find most recent activity
  const allDates = activities
    .filter((a) => a.date != null)
    .map((a) => ({ feature: a.feature, date: new Date(a.date!) }));

  const lastActivity =
    allDates.length > 0
      ? allDates.reduce((a, b) => (a.date > b.date ? a : b))
      : null;

  const lastActivityDate = lastActivity?.date || new Date();
  const daysSinceLastActivity = Math.floor(
    (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Engagement score (0-100)
  const baseScore = activeFeatures.length * 25; // 0-100 based on feature count
  const activityBonus =
    daysSinceLastActivity === 0 ? 10 : daysSinceLastActivity <= 3 ? 5 : 0;
  const engagementScore = Math.min(100, baseScore + activityBonus);

  // Activity streak (approximate - would need more data in real implementation)
  const activityStreak = activeFeatures.length > 0 ? 1 : 0;

  // Usage consistency (simplified - based on feature diversity)
  const usageConsistency =
    activeFeatures.length > 0 ? (activeFeatures.length / 4) * 100 : 0;

  return {
    activeFeatures,
    lastActiveFeature: lastActivity?.feature,
    lastActivityDate,
    engagementScore: Math.round(engagementScore),
    isActiveUser: daysSinceLastActivity <= 7,
    daysSinceLastActivity,
    activityStreak,
    usageConsistency: parseFloat(usageConsistency.toFixed(2)),
  };
}

/**
 * Generate time-series data for task completions over last 30 days
 */
export function generateTaskCompletionTimeSeries(
  tasks: any[]
): TimeSeriesMetric[] {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const dateRange = eachDayOfInterval({
    start: thirtyDaysAgo,
    end: now,
  });

  return dateRange.map((date) => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    const completedCount = tasks.filter(
      (t) =>
        t.completedAt != null &&
        t.completedAt >= dayStart &&
        t.completedAt <= dayEnd
    ).length;

    return {
      date: format(date, "yyyy-MM-dd"),
      value: completedCount,
    };
  });
}

/**
 * Generate time-series data for spending over last 30 days
 */
export function generateSpendingTimeSeries(transactions: any[]): TimeSeriesMetric[] {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const dateRange = eachDayOfInterval({
    start: thirtyDaysAgo,
    end: now,
  });

  return dateRange.map((date) => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    const daySpending = transactions
      .filter(
        (t) =>
          t.transactionDate >= dayStart && t.transactionDate <= dayEnd
      )
      .reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);

    return {
      date: format(date, "yyyy-MM-dd"),
      value: parseFloat(daySpending.toFixed(2)),
    };
  });
}

/**
 * Generate time-series data for planning (days with plans) over last 30 days
 */
export function generatePlanningTimeSeries(dayPlans: any[]): TimeSeriesMetric[] {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const dateRange = eachDayOfInterval({
    start: thirtyDaysAgo,
    end: now,
  });

  return dateRange.map((date) => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    const hasPlans = dayPlans.filter(
      (p) =>
        p.planDate >= dayStart && p.planDate <= dayEnd
    ).length > 0 ? 1 : 0;

    return {
      date: format(date, "yyyy-MM-dd"),
      value: hasPlans,
    };
  });
}

/**
 * Generate actionable insights based on metrics
 */
export function generateInsights(
  taskMetrics: TaskMetrics,
  budgetMetrics: BudgetMetrics,
  noteMetrics: NoteMetrics,
  dayPlannerMetrics: DayPlannerMetrics,
  engagementMetrics: EngagementMetrics
): DashboardInsight[] {
  const insights: DashboardInsight[] = [];

  // Task insights
  if (taskMetrics.overdueTasks > 0) {
    insights.push({
      type: "warning",
      title: "Overdue Tasks",
      description: `You have ${taskMetrics.overdueTasks} overdue task${taskMetrics.overdueTasks !== 1 ? "s" : ""}. Consider reviewing and rescheduling.`,
      priority: "high",
      actionable: true,
      actionUrl: "/tasks",
      icon: "alert-circle",
    });
  }

  if (taskMetrics.completionTrend === "trending-up") {
    insights.push({
      type: "achievement",
      title: "Productivity Boost",
      description:
        "Your task completion rate is trending upward! Keep up the momentum.",
      priority: "medium",
      actionable: false,
      icon: "trending-up",
    });
  }

  if (
    taskMetrics.completionTrend === "trending-down" &&
    taskMetrics.completionRate30d > 0
  ) {
    insights.push({
      type: "opportunity",
      title: "Focus Time Needed",
      description:
        "Your completion rate is declining. Consider blocking focused time for tasks.",
      priority: "medium",
      actionable: true,
      actionUrl: "/day-planner",
      icon: "calendar",
    });
  }

  // Budget insights
  if (budgetMetrics.hasOverBudgetBudgets) {
    insights.push({
      type: "warning",
      title: "Budget Exceeded",
      description: "One or more budgets have exceeded their limits.",
      priority: "high",
      actionable: true,
      actionUrl: "/finance",
      icon: "alert-circle",
    });
  }

  if (budgetMetrics.budgetUtilizationRate > 80) {
    insights.push({
      type: "opportunity",
      title: "Budget Alert",
      description: `Your budgets are ${budgetMetrics.budgetUtilizationRate}% utilized. Monitor spending carefully.`,
      priority: "medium",
      actionable: true,
      actionUrl: "/finance",
      icon: "trending-up",
    });
  }

  // Day planner insights
  if (dayPlannerMetrics.planningConsistency < 30) {
    insights.push({
      type: "opportunity",
      title: "Low Planning Consistency",
      description:
        "You rarely plan your days. Try planning at least 3 days per week.",
      priority: "low",
      actionable: true,
      actionUrl: "/day-planner",
      icon: "calendar",
    });
  }

  if (
    dayPlannerMetrics.plannedTasksToday != null &&
    dayPlannerMetrics.completedTasksToday != null &&
    dayPlannerMetrics.completedTasksToday === dayPlannerMetrics.plannedTasksToday &&
    dayPlannerMetrics.plannedTasksToday > 0
  ) {
    insights.push({
      type: "achievement",
      title: "Today's Plan Complete",
      description: "You've completed all planned tasks for today!",
      priority: "high",
      actionable: false,
      icon: "check-circle",
    });
  }

  // Engagement insights
  if (engagementMetrics.daysSinceLastActivity > 7) {
    insights.push({
      type: "opportunity",
      title: "Welcome Back",
      description: "You haven't used Sanctuary in a while. What's on your plate today?",
      priority: "low",
      actionable: true,
      actionUrl: "/tasks",
      icon: "inbox",
    });
  }

  if (engagementMetrics.activeFeatures.length < 2) {
    insights.push({
      type: "opportunity",
      title: "Explore More Features",
      description: "You're only using one feature. Try day planning or budgeting.",
      priority: "low",
      actionable: false,
      icon: "sparkles",
    });
  }

  return insights;
}
