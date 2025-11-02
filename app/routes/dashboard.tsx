import { useLoaderData } from "react-router";
import { pageAccessLoader } from "~/modules/middleware/pageAccess";
import { getDashboardData } from "~/modules/services/DashboardService";
import { getVisibleWidgets } from "~/components/dashboard/WidgetRegistry";
import DashboardStatCard from "~/components/dashboard/DashboardStatCard";
import CompletionRateCard from "~/components/dashboard/CompletionRateCard";
import ProductivityInsightsCard from "~/components/dashboard/ProductivityInsightsCard";
import TodayAtAGlanceWidget from "~/components/dashboard/widgets/TodayAtAGlanceWidget";
import ProgressSummaryWidget from "~/components/dashboard/widgets/ProgressSummaryWidget";
import ActionItemsPriorityWidget from "~/components/dashboard/widgets/ActionItemsPriorityWidget";
import FinancialSnapshotWidget from "~/components/dashboard/widgets/FinancialSnapshotWidget";
import WeeklyAchievementsWidget from "~/components/dashboard/widgets/WeeklyAchievementsWidget";
import { SparklesIcon } from "@heroicons/react/24/outline";
import type { AggregatedDashboardData } from "~/routes/dashboard/+types/dashboard";
import type { WidgetType } from "~/components/dashboard/WidgetRegistry";

export function meta() {
  return [{ title: "Dashboard - Sanctuary" }];
}

export const loader = pageAccessLoader("dashboard", async (user, request) => {
  // Aggregate all dashboard data using the new service
  const dashboardData = await getDashboardData(user);

  return dashboardData;
});

export default function Dashboard() {
  const dashboardData = useLoaderData<AggregatedDashboardData>();
  const visibleWidgets = getVisibleWidgets(dashboardData, dashboardData.preferences);

  // Map widget IDs to their components
  const widgetComponents: Record<WidgetType, React.ReactNode> = {
    "today-at-glance": <TodayAtAGlanceWidget data={dashboardData} />,
    "progress-summary": <ProgressSummaryWidget data={dashboardData} />,
    "action-items-priority": <ActionItemsPriorityWidget data={dashboardData} />,
    "financial-snapshot": <FinancialSnapshotWidget data={dashboardData} />,
    "weekly-achievements": <WeeklyAchievementsWidget data={dashboardData} />,
    "completion-rate": <CompletionRateCard last7Days={{ completed: dashboardData.taskMetrics.completionRate7d, total: 100 }} last30Days={{ completed: dashboardData.taskMetrics.completionRate30d, total: 100 }} />,
    "productivity-insights": (
      <ProductivityInsightsCard
        insights={[
          {
            label: "Daily Completion",
            description: "Average over 30 days",
            value: dashboardData.taskMetrics.averageDailyCompletion30d,
          },
          {
            label: "Task Velocity",
            description: "Tasks per day",
            value: dashboardData.taskMetrics.taskVelocity,
          },
          {
            label: "Planning Consistency",
            description: "Days with plans",
            value: dashboardData.dayPlannerMetrics.planningConsistency,
          },
          {
            label: "Budget Health",
            description: "Average utilization",
            value: dashboardData.budgetMetrics.averageBudgetHealth,
          },
        ]}
        message={generateWelcomeMessage(dashboardData.engagementMetrics, dashboardData.taskMetrics)}
      />
    ),
  };

  const hasActiveWidgets = visibleWidgets.length > 0;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 md:mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10">
              <SparklesIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base ml-14 max-w-2xl">
            Your personalized overview with stats and insights across all your productivity areas.
          </p>
        </header>

        {!hasActiveWidgets ? (
          <div className="py-16 text-center">
            <div className="mb-4">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <SparklesIcon className="h-6 w-6 text-gray-400 dark:text-gray-600" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Get Started
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start using Sanctuary features to see your dashboard come to life with personalized insights.
            </p>
            <a
              href="/tasks"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Create Your First Task
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Render visible widgets */}
            {visibleWidgets.map((widget) => (
              <div
                key={widget.config.id}
                className={`${
                  widget.config.defaultWidth === "full"
                    ? "grid-cols-1"
                    : widget.config.defaultWidth === "half"
                      ? "lg:grid-cols-2"
                      : "lg:grid-cols-3"
                }`}
              >
                {widgetComponents[widget.config.id]}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Generate personalized welcome message based on metrics
 */
function generateWelcomeMessage(engagementMetrics: any, taskMetrics: any): string {
  if (taskMetrics.completionTrend === "trending-up") {
    return "📈 Your productivity is trending upward! Keep up the momentum.";
  }
  if (taskMetrics.overdueTasks > 0) {
    return `⚠️ You have ${taskMetrics.overdueTasks} overdue task${taskMetrics.overdueTasks !== 1 ? "s" : ""}. Focus on clearing these first.`;
  }
  if (engagementMetrics.daysSinceLastActivity > 7) {
    return "👋 Welcome back! What's on your plate today?";
  }
  return "✨ Great to see you! Your dashboard is ready with all your productivity metrics.";
}
