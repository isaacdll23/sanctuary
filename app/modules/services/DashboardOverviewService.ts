import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "~/db";
import {
  dayPlansTable,
  dayPlanSectionsTable,
  financeExpensesTable,
  foldersTable,
  notesTable,
  tasksTable,
  utilitiesCommandsTable,
} from "~/db/schema";
import type {
  DashboardNotePreview,
  DashboardPriorityItem,
  DashboardSummary,
  DashboardTaskPreview,
} from "~/types/dashboard.types";

interface DashboardOverviewOptions {
  userId: number;
  timeZone: string;
  featureIds: string[];
}

interface DashboardOverviewData {
  summary: DashboardSummary;
  priorityItems: DashboardPriorityItem[];
  upcomingTasks: DashboardTaskPreview[];
  recentNotes: DashboardNotePreview[];
  todayLabel: string;
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDateKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getTodayLabel(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

function getTaskDueDateKey(
  dueDate: Date | string | null,
  timeZone: string
): string | null {
  const parsedDate = toDate(dueDate);
  if (!parsedDate) return null;
  return getDateKey(parsedDate, timeZone);
}

export async function getDashboardOverview({
  userId,
  timeZone,
  featureIds,
}: DashboardOverviewOptions): Promise<DashboardOverviewData> {
  const featureSet = new Set(featureIds);
  const hasTasks = featureSet.has("tasks");
  const hasDayPlanner = featureSet.has("day-planner");
  const hasNotes = featureSet.has("notes");
  const hasFinance = featureSet.has("finance");
  const hasCommands = featureSet.has("utilities/commands");
  const now = new Date();
  const todayKey = getDateKey(now, timeZone);
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [taskRows, noteRows, expenseRows, commandRows, todayPlan] =
    await Promise.all([
      hasTasks
        ? db
            .select({
              id: tasksTable.id,
              title: tasksTable.title,
              dueDate: tasksTable.dueDate,
              completedAt: tasksTable.completedAt,
            })
            .from(tasksTable)
            .where(eq(tasksTable.userId, userId))
            .execute()
        : Promise.resolve([]),
      hasNotes
        ? db
            .select({
              id: notesTable.id,
              title: notesTable.title,
              folderId: notesTable.folderId,
              updatedAt: notesTable.updatedAt,
              createdAt: notesTable.createdAt,
            })
            .from(notesTable)
            .where(eq(notesTable.userId, userId))
            .orderBy(desc(notesTable.updatedAt))
            .execute()
        : Promise.resolve([]),
      hasFinance
        ? db
            .select({
              monthlyCost: financeExpensesTable.monthlyCost,
              isActive: financeExpensesTable.isActive,
            })
            .from(financeExpensesTable)
            .where(eq(financeExpensesTable.userId, userId))
            .execute()
        : Promise.resolve([]),
      hasCommands
        ? db
            .select({ id: utilitiesCommandsTable.id })
            .from(utilitiesCommandsTable)
            .where(eq(utilitiesCommandsTable.userId, userId))
            .execute()
        : Promise.resolve([]),
      hasDayPlanner
        ? db
            .select({
              id: dayPlansTable.id,
            })
            .from(dayPlansTable)
            .where(and(eq(dayPlansTable.userId, userId), eq(dayPlansTable.planDate, todayKey)))
            .limit(1)
            .execute()
        : Promise.resolve([]),
    ]);

  const sections =
    hasDayPlanner && todayPlan.length > 0
      ? await db
          .select({ completedAt: dayPlanSectionsTable.completedAt })
          .from(dayPlanSectionsTable)
          .where(eq(dayPlanSectionsTable.planId, todayPlan[0].id))
          .execute()
      : [];

  const openTasks = taskRows.filter((task) => task.completedAt == null);
  const overdueTasks = openTasks.filter((task) => {
    const dueDateKey = getTaskDueDateKey(task.dueDate, timeZone);
    return dueDateKey != null && dueDateKey < todayKey;
  });
  const dueTodayTasks = openTasks.filter((task) => {
    const dueDateKey = getTaskDueDateKey(task.dueDate, timeZone);
    return dueDateKey === todayKey;
  });

  const upcomingTasks: DashboardTaskPreview[] = openTasks
    .filter((task) => task.dueDate != null)
    .sort((a, b) => {
      const aDate = toDate(a.dueDate);
      const bDate = toDate(b.dueDate);
      if (!aDate || !bDate) return 0;
      return aDate.getTime() - bDate.getTime();
    })
    .slice(0, 5)
    .map((task) => ({
      id: task.id,
      title: task.title,
      dueDate: task.dueDate,
      isOverdue: overdueTasks.some((overdueTask) => overdueTask.id === task.id),
    }));

  const notesUpdatedLast7Days = noteRows.filter((note) => {
    const timestamp = toDate(note.updatedAt ?? note.createdAt);
    return timestamp != null && timestamp >= last7Days;
  }).length;

  const activeExpenses = expenseRows.filter((expense) => expense.isActive !== 0);
  const monthlyExpenseTotalCents = activeExpenses.reduce(
    (sum, expense) => sum + (expense.monthlyCost ?? 0),
    0
  );

  const summary: DashboardSummary = {
    openTasks: openTasks.length,
    overdueTasks: overdueTasks.length,
    dueTodayTasks: dueTodayTasks.length,
    plannedTasksToday: sections.length,
    completedTasksToday: sections.filter((section) => section.completedAt != null).length,
    totalNotes: noteRows.length,
    notesUpdatedLast7Days,
    activeExpenses: activeExpenses.length,
    monthlyExpenseTotalCents,
    commandCount: commandRows.length,
  };

  const recentNotesBase = noteRows.slice(0, 5);
  const folderIds = Array.from(
    new Set(recentNotesBase.map((note) => note.folderId).filter((folderId): folderId is number => folderId != null))
  );

  const folders =
    folderIds.length > 0
      ? await db
          .select({ id: foldersTable.id, name: foldersTable.name })
          .from(foldersTable)
          .where(and(eq(foldersTable.userId, userId), inArray(foldersTable.id, folderIds)))
          .execute()
      : [];
  const folderNameById = new Map(folders.map((folder) => [folder.id, folder.name]));

  const recentNotes: DashboardNotePreview[] = recentNotesBase.map((note) => ({
    id: note.id,
    title: note.title,
    updatedAt: note.updatedAt ?? note.createdAt,
    folderName: note.folderId ? folderNameById.get(note.folderId) ?? null : null,
  }));

  const priorityItems: DashboardPriorityItem[] = [];

  if (hasTasks && summary.overdueTasks > 0) {
    priorityItems.push({
      id: "overdue-tasks",
      title: `${summary.overdueTasks} overdue task${summary.overdueTasks === 1 ? "" : "s"}`,
      description: "Clear overdue items first to reduce scheduling drag.",
      href: "/tasks",
      tone: "warning",
    });
  }

  if (hasDayPlanner && summary.plannedTasksToday === 0) {
    priorityItems.push({
      id: "plan-today",
      title: "No day plan for today",
      description: "Set up a plan so the rest of the dashboard has context.",
      href: "/day-planner",
      tone: "default",
    });
  }

  if (hasTasks && summary.dueTodayTasks > 0) {
    priorityItems.push({
      id: "due-today",
      title: `${summary.dueTodayTasks} task${summary.dueTodayTasks === 1 ? "" : "s"} due today`,
      description: "Review deadlines before starting lower-priority work.",
      href: "/tasks",
      tone: "default",
    });
  }

  if (hasNotes && summary.totalNotes > 0 && summary.notesUpdatedLast7Days === 0) {
    priorityItems.push({
      id: "stale-notes",
      title: "Notes are stale this week",
      description: "Capture at least one update so decisions stay documented.",
      href: "/notes",
      tone: "default",
    });
  }

  if (hasFinance && summary.activeExpenses === 0) {
    priorityItems.push({
      id: "finance-setup",
      title: "Finance setup is empty",
      description: "Add recurring expenses to keep your monthly baseline accurate.",
      href: "/finance/expenses",
      tone: "default",
    });
  }

  if (hasTasks && summary.openTasks === 0) {
    priorityItems.push({
      id: "new-task",
      title: "No open tasks",
      description: "Add your next priority to avoid context switching later.",
      href: "/tasks",
      tone: "default",
    });
  }

  if (priorityItems.length === 0) {
    priorityItems.push({
      id: "steady",
      title: "No blockers right now",
      description: "Use shortcuts below to continue where you left off.",
      href: featureSet.has("tasks") ? "/tasks" : "/settings",
      tone: "default",
    });
  }

  return {
    summary,
    priorityItems: priorityItems.slice(0, 4),
    upcomingTasks,
    recentNotes,
    todayLabel: getTodayLabel(now, timeZone),
  };
}
