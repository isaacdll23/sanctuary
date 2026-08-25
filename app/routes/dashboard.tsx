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
  FolderIcon,
  InboxIcon,
  PlusIcon,
  SparklesIcon,
  TagIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { pageAccessLoader } from "~/modules/middleware/pageAccess";
import { getAccessibleFeatures } from "~/modules/services/DashboardFeatureAccessService";
import { getDashboardOverview } from "~/modules/services/DashboardOverviewService";
import FeatureGrid from "~/components/dashboard/FeatureGrid";
import type { DashboardLoaderData } from "~/types/dashboard.types";

type AccentKey = "sky" | "amber" | "purple" | "emerald" | "cyan";

const ACCENTS: Record<
  AccentKey,
  { text: string; bg: string; well: string; hoverBorder: string; dot: string }
> = {
  sky: {
    text: "text-sky-400",
    bg: "bg-sky-500/10",
    well: "border-sky-500/25",
    hoverBorder: "group-hover:border-sky-400/40",
    dot: "bg-sky-400",
  },
  amber: {
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    well: "border-amber-500/25",
    hoverBorder: "group-hover:border-amber-400/40",
    dot: "bg-amber-400",
  },
  purple: {
    text: "text-purple-400",
    bg: "bg-purple-500/10",
    well: "border-purple-500/25",
    hoverBorder: "group-hover:border-purple-400/40",
    dot: "bg-purple-400",
  },
  emerald: {
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    well: "border-emerald-500/25",
    hoverBorder: "group-hover:border-emerald-400/40",
    dot: "bg-emerald-400",
  },
  cyan: {
    text: "text-cyan-400",
    bg: "bg-cyan-500/10",
    well: "border-cyan-500/25",
    hoverBorder: "group-hover:border-cyan-400/40",
    dot: "bg-cyan-400",
  },
};

interface DashboardStat {
  id: string;
  label: string;
  value: string;
  detail: string;
  href: string;
  tone: "default" | "warning";
  icon: ElementType;
  accent: AccentKey;
}

const PANEL =
  "relative overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-900/60 p-4 backdrop-blur-md md:p-5";
const PANEL_TITLE =
  "text-sm font-semibold tracking-wide text-gray-100";

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
      accent: "sky",
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
      accent: "amber",
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
      accent: "purple",
    });
  }

  if (hasFinance) {
    stats.push({
      id: "monthly-expense",
      label: "Monthly Expenses",
      value: formatCurrency(summary.monthlyExpenseTotalCents),
      detail: `${summary.activeExpenses} active · monthly equivalent`,
      href: "/finance/expenses",
      tone: "default",
      icon: CurrencyDollarIcon,
      accent: "emerald",
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
      accent: "cyan",
    });
  }

  const hasFocusHub = hasTasks || hasDayPlanner;
  const hasActivityHub = hasNotes;

  return (
    <div className="relative min-h-screen bg-transparent p-3 md:p-6">
      {/* Ambient radial glows for optical depth */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-purple-500/[0.07] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-4 md:space-y-5">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2.5">
              <div className="rounded-xl border border-white/[0.08] bg-zinc-900/70 p-2 backdrop-blur-md">
                <SparklesIcon className="h-5 w-5 text-indigo-400" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-50 md:text-3xl">
                Dashboard
              </h1>
            </div>
            <p className="ml-10 text-sm text-gray-400">{todayLabel}</p>
          </div>

          <div className="ml-10 flex items-center gap-2">
            {hasTasks && (
              <Link
                to="/tasks"
                className="group inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-900/70 px-3 py-2 text-sm font-medium text-gray-300 backdrop-blur-md transition-colors hover:border-white/20 hover:bg-zinc-900 hover:text-gray-100"
              >
                <PlusIcon className="h-4 w-4" />
                Task
              </Link>
            )}
            {hasNotes && (
              <Link
                to="/notes"
                className="group inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-900/70 px-3 py-2 text-sm font-medium text-gray-300 backdrop-blur-md transition-colors hover:border-white/20 hover:bg-zinc-900 hover:text-gray-100"
              >
                <PlusIcon className="h-4 w-4" />
                Note
              </Link>
            )}
            <p className="hidden text-xs font-medium uppercase tracking-[0.14em] text-gray-500 lg:block">
              {features.length} module{features.length === 1 ? "" : "s"}
            </p>
          </div>
        </header>

        {stats.length > 0 && (
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-5 [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
            {stats.map((stat) => {
              const Icon = stat.icon;
              const accent = ACCENTS[stat.accent];
              return (
                <Link
                  key={stat.id}
                  to={stat.href}
                  className={`group relative overflow-hidden rounded-2xl border bg-zinc-900/60 p-3.5 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-900/80 hover:shadow-lg hover:shadow-black/20 lg:p-4 ${
                    stat.tone === "warning"
                      ? "border-amber-500/30"
                      : "border-white/[0.07]"
                  } ${accent.hoverBorder}`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`inline-flex rounded-lg border p-2 ${accent.bg} ${accent.well}`}>
                      <Icon className={`h-5 w-5 ${accent.text}`} />
                    </div>
                    {stat.tone === "warning" && (
                      <ExclamationTriangleIcon className="h-4 w-4 shrink-0 text-amber-300/80" />
                    )}
                  </div>
                  <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-xl font-semibold text-gray-50 lg:text-2xl">
                    {stat.value}
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      stat.tone === "warning" ? "text-amber-300/90" : "text-gray-400"
                    }`}
                  >
                    {stat.detail}
                  </p>
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 bg-gradient-to-br from-white/[0.03] to-transparent" />
                </Link>
              );
            })}
          </section>
        )}

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          {/* LEFT — Today's Focus */}
          {hasFocusHub && (
            <div className="lg:col-span-3">
              <div className={PANEL}>
                <div className="mb-3 flex items-center gap-2">
                  <div className="inline-flex rounded-lg bg-amber-500/10 p-1.5">
                    <ClockIcon className="h-4 w-4 text-amber-400" />
                  </div>
                  <h2 className={PANEL_TITLE}>Today's Focus</h2>
                </div>

                {hasDayPlanner && (
                  <div className="mb-4 flex items-center gap-4">
                    <VelocityRing
                      completed={summary.completedTasksToday}
                      planned={summary.plannedTasksToday}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-200">
                        {summary.plannedTasksToday > 0
                          ? `${summary.completedTasksToday} of ${summary.plannedTasksToday} planned tasks done`
                          : "No plan created for today"}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        Set a plan to track daily momentum
                      </p>
                      <Link
                        to="/day-planner"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300"
                      >
                        Open day planner
                        <ArrowUpRightIcon className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {priorityItems.length > 0 ? (
                    priorityItems.map((item) => (
                      <Link
                        key={item.id}
                        to={item.href}
                        className={`group flex items-start justify-between gap-3 rounded-xl border px-3.5 py-3 transition-colors ${
                          item.tone === "warning"
                            ? "border-amber-500/25 bg-amber-500/[0.06] hover:bg-amber-500/[0.1]"
                            : "border-white/[0.07] bg-zinc-900/70 hover:bg-zinc-900"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                              item.tone === "warning" ? "bg-amber-400" : "bg-gray-500"
                            }`}
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-100">
                              {item.title}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-400">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        {item.tone === "warning" ? (
                          <ExclamationTriangleIcon className="h-4 w-4 shrink-0 text-amber-300/80" />
                        ) : (
                          <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-gray-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gray-300" />
                        )}
                      </Link>
                    ))
                  ) : (
                    <EmptyState
                      icon={CheckCircleIcon}
                      title="All caught up with tasks for today"
                      message="Nothing is demanding your attention right now."
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* RIGHT — Recent Activity */}
          {hasActivityHub && (
            <div className="lg:col-span-2">
              {hasNotes && (
                <div className={PANEL}>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="inline-flex rounded-lg bg-purple-500/10 p-1.5">
                        <DocumentTextIcon className="h-4 w-4 text-purple-400" />
                      </div>
                      <h2 className={PANEL_TITLE}>Recent Notes</h2>
                    </div>
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
                        <Link
                          key={note.id}
                          to="/notes"
                          className="group flex items-start justify-between gap-3 rounded-xl border border-white/[0.07] bg-zinc-900/70 px-3.5 py-3 transition-colors hover:bg-zinc-900"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-100">
                              {note.title}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              {note.folderName && (
                                <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-zinc-800/70 px-1.5 py-0.5 text-[10px] font-medium text-gray-300">
                                  <FolderIcon className="h-3 w-3 text-gray-400" />
                                  {note.folderName}
                                </span>
                              )}
                              <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-zinc-800/70 px-1.5 py-0.5 text-[10px] font-medium text-gray-300">
                                <TagIcon className="h-3 w-3 text-purple-400" />
                                {formatRelativeTimestamp(note.updatedAt)}
                              </span>
                            </div>
                          </div>
                          <ArrowUpRightIcon className="mt-1 h-4 w-4 shrink-0 text-gray-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gray-300" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={DocumentTextIcon}
                      title="Capture your first idea"
                      message="Notes keep decisions and context documented."
                      actionLabel="Create Note"
                      actionHref="/notes"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {hasTasks && (
            <div className="lg:col-span-5">
              <div className={PANEL}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-lg bg-sky-500/10 p-1.5">
                      <InboxIcon className="h-4 w-4 text-sky-400" />
                    </div>
                    <h2 className={PANEL_TITLE}>Upcoming Tasks</h2>
                  </div>
                  <Link
                    to="/tasks"
                    className="text-xs font-medium text-gray-400 hover:text-gray-200"
                  >
                    Open Tasks
                  </Link>
                </div>

                {upcomingTasks.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                    {upcomingTasks.map((task) => (
                      <Link
                        key={task.id}
                        to="/tasks"
                        className="group flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-zinc-900/70 px-3.5 py-2.5 transition-colors hover:bg-zinc-900"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircleIcon className="h-4 w-4 shrink-0 text-gray-600 group-hover:text-sky-400" />
                          <div>
                            <p className="text-sm text-gray-100">{task.title}</p>
                            <p
                              className={`mt-0.5 text-xs ${
                                task.isOverdue
                                  ? "text-amber-300/90"
                                  : "text-gray-400"
                              }`}
                            >
                              {formatDueDate(task.dueDate, task.isOverdue)}
                            </p>
                          </div>
                        </div>
                        <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-gray-500 group-hover:text-gray-300" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={InboxIcon}
                    title="No scheduled due dates"
                    message="All caught up with tasks for today."
                    actionLabel="Create Task"
                    actionHref="/tasks"
                  />
                )}
              </div>
            </div>
          )}
        </section>

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

function VelocityRing({
  completed,
  planned,
}: {
  completed: number;
  planned: number;
}) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const pct = planned > 0 ? Math.min(100, (completed / planned) * 100) : 0;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 72 72">
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="6"
        />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          stroke={pct > 0 ? "#fbbf24" : "rgba(255,255,255,0.15)"}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold text-gray-100">
          {Math.round(pct)}%
        </span>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  message,
  actionLabel,
  actionHref,
}: {
  icon: ElementType;
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-white/[0.08] bg-zinc-900/40 px-4 py-8 text-center">
      <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.08] bg-zinc-800/60">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-200">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-xs text-gray-400">{message}</p>
      {actionLabel && actionHref && (
        <Link
          to={actionHref}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-zinc-800/70 px-3 py-1.5 text-xs font-medium text-gray-100 transition-colors hover:bg-zinc-800"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          {actionLabel}
        </Link>
      )}
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