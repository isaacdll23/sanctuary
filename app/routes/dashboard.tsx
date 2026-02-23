import { useMemo } from "react";
import type { ElementType } from "react";
import { Link, useLoaderData } from "react-router";
import {
  ArrowUpRightIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { pageAccessLoader } from "~/modules/middleware/pageAccess";
import { getAccessibleFeatures } from "~/modules/services/DashboardFeatureAccessService";
import { getDashboardOverview } from "~/modules/services/DashboardOverviewService";
import FeatureGrid from "~/components/dashboard/FeatureGrid";
import type { DashboardLoaderData } from "~/types/dashboard.types";

interface DashboardStat {
  id: string;
  label: string;
  value: string;
  detail: string;
  href: string;
  tone: "default" | "warning";
  icon: ElementType;
}

export function meta() {
  return [{ title: "Dashboard - Sanctuary" }];
}

export const loader = pageAccessLoader("dashboard", async (user) => {
  const features = await getAccessibleFeatures(user.id);
  const overview = await getDashboardOverview({
    userId: user.id,
    timeZone: user.timeZone || "America/Chicago",
    featureIds: features.map((feature) => feature.id),
  });

  return {
    features,
    ...overview,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  };
});

export default function Dashboard() {
  const { features, summary, priorityItems, upcomingTasks, recentNotes, todayLabel } =
    useLoaderData<DashboardLoaderData>();

  const featureIds = useMemo(
    () => new Set(features.map((feature) => feature.id)),
    [features]
  );
  const hasTasks = featureIds.has("tasks");
  const hasDayPlanner = featureIds.has("day-planner");
  const hasNotes = featureIds.has("notes");
  const hasFinance = featureIds.has("finance");
  const hasCommands = featureIds.has("utilities/commands");

  const stats: DashboardStat[] = [];

  if (hasTasks) {
    stats.push({
      id: "open-tasks",
      label: "Open Tasks",
      value: summary.openTasks.toString(),
      detail:
        summary.overdueTasks > 0
          ? `${summary.overdueTasks} overdue`
          : "No overdue work",
      href: "/tasks",
      tone: summary.overdueTasks > 0 ? "warning" : "default",
      icon: CheckCircleIcon,
    });
  }

  if (hasDayPlanner) {
    stats.push({
      id: "planned-today",
      label: "Planned Today",
      value: `${summary.completedTasksToday}/${summary.plannedTasksToday}`,
      detail:
        summary.plannedTasksToday > 0
          ? "Completed / planned"
          : "No plan created",
      href: "/day-planner",
      tone: "default",
      icon: CalendarDaysIcon,
    });
  }

  if (hasNotes) {
    stats.push({
      id: "notes-week",
      label: "Notes Updated",
      value: summary.notesUpdatedLast7Days.toString(),
      detail: "Last 7 days",
      href: "/notes",
      tone: "default",
      icon: DocumentTextIcon,
    });
  }

  if (hasFinance) {
    stats.push({
      id: "monthly-expense",
      label: "Monthly Expenses",
      value: formatCurrency(summary.monthlyExpenseTotalCents),
      detail: `${summary.activeExpenses} active`,
      href: "/finance/expenses",
      tone: "default",
      icon: CurrencyDollarIcon,
    });
  }

  if (hasCommands) {
    stats.push({
      id: "commands",
      label: "Command Snippets",
      value: summary.commandCount.toString(),
      detail: "Saved snippets",
      href: "/utilities/commands",
      tone: "default",
      icon: WrenchScrewdriverIcon,
    });
  }

  return (
    <div className="min-h-screen bg-transparent p-3 md:p-4">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2.5">
              <div className="rounded-md border border-gray-700 bg-gray-900 p-2">
                <SparklesIcon className="h-5 w-5 text-gray-300" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-100 md:text-3xl">
                Dashboard
              </h1>
            </div>
            <p className="ml-11 text-sm text-gray-400">{todayLabel}</p>
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-500">
            {features.length} accessible module{features.length === 1 ? "" : "s"}
          </p>
        </header>

        {stats.length > 0 && (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link
                  key={stat.id}
                  to={stat.href}
                  className={`group rounded-lg border bg-gray-900/70 px-4 py-3 transition-all duration-150 hover:border-gray-700 hover:bg-gray-900 ${
                    stat.tone === "warning"
                      ? "border-amber-900/40"
                      : "border-gray-800"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                      {stat.label}
                    </p>
                    <Icon className="h-4 w-4 text-gray-500 group-hover:text-gray-300" />
                  </div>
                  <p className="text-2xl font-semibold text-gray-100">{stat.value}</p>
                  <p
                    className={`mt-1 text-xs ${
                      stat.tone === "warning" ? "text-amber-300/90" : "text-gray-400"
                    }`}
                  >
                    {stat.detail}
                  </p>
                </Link>
              );
            })}
          </section>
        )}

        <section className="rounded-lg border border-gray-800 bg-gray-900/60 p-3">
          <div className="mb-2 flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-100">Focus Queue</h2>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {priorityItems.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                className={`group flex items-start justify-between gap-3 rounded-md border px-3 py-2.5 transition-colors ${
                  item.tone === "warning"
                    ? "border-amber-900/40 bg-amber-950/20 hover:bg-amber-950/30"
                    : "border-gray-800 bg-gray-900 hover:bg-gray-800"
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-100">{item.title}</p>
                  <p
                    className={`mt-0.5 text-xs ${
                      item.tone === "warning" ? "text-amber-200/80" : "text-gray-400"
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
                {item.tone === "warning" ? (
                  <ExclamationTriangleIcon className="h-4 w-4 shrink-0 text-amber-300/80" />
                ) : (
                  <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-gray-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gray-300" />
                )}
              </Link>
            ))}
          </div>
        </section>

        {(hasTasks || hasNotes) && (
          <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {hasTasks && (
              <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-100">Upcoming Tasks</h2>
                  <Link
                    to="/tasks"
                    className="text-xs font-medium text-gray-400 hover:text-gray-200"
                  >
                    Open Tasks
                  </Link>
                </div>
                {upcomingTasks.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingTasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-md border border-gray-800 bg-gray-900 px-3 py-2"
                      >
                        <p className="text-sm text-gray-100">{task.title}</p>
                        <p
                          className={`mt-0.5 text-xs ${
                            task.isOverdue ? "text-amber-300/90" : "text-gray-400"
                          }`}
                        >
                          {formatDueDate(task.dueDate, task.isOverdue)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No scheduled due dates.</p>
                )}
              </div>
            )}

            {hasNotes && (
              <div className="rounded-lg border border-gray-800 bg-gray-900/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-100">
                    Recently Updated Notes
                  </h2>
                  <Link
                    to="/notes"
                    className="text-xs font-medium text-gray-400 hover:text-gray-200"
                  >
                    Open Notes
                  </Link>
                </div>
                {recentNotes.length > 0 ? (
                  <div className="space-y-2">
                    {recentNotes.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-md border border-gray-800 bg-gray-900 px-3 py-2"
                      >
                        <p className="text-sm text-gray-100">{note.title}</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {note.folderName ? `${note.folderName} • ` : ""}
                          {formatRelativeTimestamp(note.updatedAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No notes yet.</p>
                )}
              </div>
            )}
          </section>
        )}

        <FeatureGrid
          features={features}
          title="Workspace Shortcuts"
          subtitle="Direct access to each module."
          showEmptyState={true}
        />
      </div>
    </div>
  );
}

function formatCurrency(amountInCents: number): string {
  const dollars = amountInCents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(dollars);
}

function formatDueDate(dateInput: Date | string | null, isOverdue: boolean) {
  if (!dateInput) return "No due date";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "No due date";
  const formatted = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return isOverdue ? `Overdue • ${formatted}` : `Due ${formatted}`;
}

function formatRelativeTimestamp(dateInput: Date | string | null) {
  if (!dateInput) return "Unknown";
  const timestamp = new Date(dateInput);
  if (Number.isNaN(timestamp.getTime())) return "Unknown";

  const diffMs = Date.now() - timestamp.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return timestamp.toLocaleDateString();
}
