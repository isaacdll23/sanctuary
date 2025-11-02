import { useLoaderData } from "react-router";
import { eq } from "drizzle-orm";
import { startOfDay, subDays } from "date-fns";
import { pageAccessLoader } from "~/modules/middleware/pageAccess";
import DashboardStatCard from "~/components/dashboard/DashboardStatCard";
import CompletionRateCard from "~/components/dashboard/CompletionRateCard";
import ProductivityInsightsCard from "~/components/dashboard/ProductivityInsightsCard";
import {
  PlusIcon,
  CheckCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export function meta() {
  return [{ title: "Dashboard - Sanctuary" }];
}

export const loader = pageAccessLoader("dashboard", async (user, request) => {
  // Server-only imports (React Router v7 will automatically strip these out in the client bundle)
  const { db } = await import("~/db");
  const { tasksTable } = await import("~/db/schema");

  const userTasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.userId, user.id))
    .execute();

  const newTasksLast7Days = userTasks.filter(
    (task) => task.createdAt >= startOfDay(subDays(new Date(), 7))
  );
  const completedTasksLast7Days = userTasks.filter(
    (task) =>
      task.completedAt != null &&
      task.completedAt >= startOfDay(subDays(new Date(), 7))
  );

  const newTasksLast30Days = userTasks.filter(
    (task) => task.createdAt >= startOfDay(subDays(new Date(), 30))
  );
  const completedTasksLast30Days = userTasks.filter(
    (task) =>
      task.completedAt != null &&
      task.completedAt >= startOfDay(subDays(new Date(), 30))
  );

  return {
    newTasksLast7Days: newTasksLast7Days.length,
    completedTasksLast7Days: completedTasksLast7Days.length,
    newTasksLast30Days: newTasksLast30Days.length,
    completedTasksLast30Days: completedTasksLast30Days.length,
  };
});

export default function Dashboard() {
  const {
    newTasksLast7Days,
    completedTasksLast7Days,
    newTasksLast30Days,
    completedTasksLast30Days,
  } = useLoaderData<{
    newTasksLast7Days: number;
    completedTasksLast7Days: number;
    newTasksLast30Days: number;
    completedTasksLast30Days: number;
  }>();

  // Calculate metrics for insights
  const dailyCompletion30d = completedTasksLast30Days / 30;
  const weeklyCreation30d = newTasksLast30Days / 4.29;

  const isProductivityTrending =
    completedTasksLast7Days > completedTasksLast7Days / 4;

  const insightMessage = isProductivityTrending
    ? "Your productivity is trending upward this week! Keep up the great work."
    : "Focus on completing more tasks to boost your productivity metrics.";

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
            Your personal overview with stats and insights about your task
            management progress.
          </p>
        </header>

        {/* Stats Grid Section */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-5 text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
            Task Performance Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <DashboardStatCard
              icon={PlusIcon}
              label="New Tasks"
              value={newTasksLast7Days}
              sublabel="last 7 days"
              color="indigo"
            />
            <DashboardStatCard
              icon={CheckCircleIcon}
              label="Completed"
              value={completedTasksLast7Days}
              sublabel="last 7 days"
              color="emerald"
            />
            <DashboardStatCard
              icon={PlusIcon}
              label="New Tasks"
              value={newTasksLast30Days}
              sublabel="last 30 days"
              color="indigo"
            />
            <DashboardStatCard
              icon={CheckCircleIcon}
              label="Completed"
              value={completedTasksLast30Days}
              sublabel="last 30 days"
              color="emerald"
            />
          </div>
        </section>

        {/* Metrics & Insights Grid Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CompletionRateCard
            last7Days={{
              completed: completedTasksLast7Days,
              total: newTasksLast7Days,
            }}
            last30Days={{
              completed: completedTasksLast30Days,
              total: newTasksLast30Days,
            }}
          />

          <ProductivityInsightsCard
            insights={[
              {
                label: "Daily Task Completion",
                description: "Average over 30 days",
                value: dailyCompletion30d,
              },
              {
                label: "Weekly Task Creation",
                description: "Average over 30 days",
                value: weeklyCreation30d,
              },
            ]}
            message={insightMessage}
          />
        </section>
      </div>
    </div>
  );
}
