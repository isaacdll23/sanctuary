import React from "react";
import {
  FireIcon,
  SparklesIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import type { AggregatedDashboardData } from "~/routes/dashboard/+types/dashboard";

interface WeeklyAchievementsProps {
  data: AggregatedDashboardData;
}

interface Achievement {
  title: string;
  description: string;
  value: number | string;
  icon: React.ReactNode;
  color: "emerald" | "amber" | "blue" | "purple" | "pink";
}

export default function WeeklyAchievementsWidget({
  data,
}: WeeklyAchievementsProps) {
  const { taskMetrics, dayPlannerMetrics, engagementMetrics } = data;

  const achievements: Achievement[] = [];

  // Task completion achievement
  if (taskMetrics.completedTasks > 0) {
    achievements.push({
      title: "Tasks Completed",
      description: "All-time completion",
      value: taskMetrics.completedTasks,
      icon: <CheckCircleIcon className="w-5 h-5" />,
      color: "emerald",
    });
  }

  // Weekly completion streak
  if (taskMetrics.completionRate7d > 50) {
    achievements.push({
      title: "Strong Week",
      description: `${taskMetrics.completionRate7d}% completion rate`,
      value: `${taskMetrics.completionRate7d}%`,
      icon: <FireIcon className="w-5 h-5" />,
      color: "amber",
    });
  }

  // Planning consistency
  if (dayPlannerMetrics.planningConsistency > 50) {
    achievements.push({
      title: "Consistent Planner",
      description: `${dayPlannerMetrics.plannedDaysLast30d} days planned`,
      value: `${dayPlannerMetrics.plannedDaysLast30d}/30`,
      icon: <SparklesIcon className="w-5 h-5" />,
      color: "blue",
    });
  }

  // Multi-feature user
  if (engagementMetrics.activeFeatures.length >= 3) {
    achievements.push({
      title: "Power User",
      description: `Using ${engagementMetrics.activeFeatures.length} features`,
      value: `${engagementMetrics.activeFeatures.length}`,
      icon: <FireIcon className="w-5 h-5" />,
      color: "purple",
    });
  }

  // Activity streak
  if (engagementMetrics.daysSinceLastActivity === 0) {
    achievements.push({
      title: "Active Today",
      description: "Staying on top of things",
      value: "🎯",
      icon: <CheckCircleIcon className="w-5 h-5" />,
      color: "pink",
    });
  }

  const colorClasses: Record<
    string,
    { bg: string; text: string; icon: string }
  > = {
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      text: "text-emerald-700 dark:text-emerald-400",
      icon: "text-emerald-600 dark:text-emerald-400",
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-500/10",
      text: "text-amber-700 dark:text-amber-400",
      icon: "text-amber-600 dark:text-amber-400",
    },
    blue: {
      bg: "bg-blue-50 dark:bg-blue-500/10",
      text: "text-blue-700 dark:text-blue-400",
      icon: "text-blue-600 dark:text-blue-400",
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-500/10",
      text: "text-purple-700 dark:text-purple-400",
      icon: "text-purple-600 dark:text-purple-400",
    },
    pink: {
      bg: "bg-pink-50 dark:bg-pink-500/10",
      text: "text-pink-700 dark:text-pink-400",
      icon: "text-pink-600 dark:text-pink-400",
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
        <div className="p-2 rounded-lg bg-yellow-500/10">
          <FireIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
        </div>
        Weekly Achievements
      </h3>

      {achievements.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Start completing tasks to earn achievements!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {achievements.map((achievement, idx) => {
            const colors = colorClasses[achievement.color];

            return (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${colors.bg} ${colors.text}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg flex-shrink-0 ${colors.bg} ${colors.icon}`}
                  >
                    {achievement.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">
                      {achievement.title}
                    </p>
                    <p className="text-xs opacity-75 mt-0.5">
                      {achievement.description}
                    </p>
                    <p className="text-xl font-bold mt-1">
                      {achievement.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Engagement Score */}
      <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-500/10 dark:to-blue-500/10 border border-indigo-200 dark:border-indigo-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
              Overall Engagement Score
            </p>
            <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">
              Based on your activity this week
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {engagementMetrics.engagementScore}
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400">
              /100
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
