/**
 * Feature Card Type - Represents a single accessible feature on the dashboard
 */
export interface FeatureCard {
  id: string;
  pageId: string;
  title: string;
  description: string;
  icon: 
    | "CheckCircleIcon"
    | "CalendarIcon"
    | "BookOpenIcon"
    | "CurrencyDollarIcon"
    | "CommandLineIcon"
    | "Cog8ToothIcon"
    | "ShieldCheckIcon";
  route: string;
  isAccessible: boolean;
}

export interface DashboardSummary {
  openTasks: number;
  overdueTasks: number;
  dueTodayTasks: number;
  plannedTasksToday: number;
  completedTasksToday: number;
  totalNotes: number;
  notesUpdatedLast7Days: number;
  activeExpenses: number;
  monthlyExpenseTotalCents: number;
  commandCount: number;
}

export interface DashboardPriorityItem {
  id: string;
  title: string;
  description: string;
  href: string;
  tone: "default" | "warning";
}

export interface DashboardTaskPreview {
  id: number;
  title: string;
  dueDate: Date | string | null;
  isOverdue: boolean;
}

export interface DashboardNotePreview {
  id: number;
  title: string;
  updatedAt: Date | string | null;
  folderName: string | null;
}

/**
 * Dashboard loader data - simplified from previous aggregated metrics
 */
export interface DashboardLoaderData {
  features: FeatureCard[];
  summary: DashboardSummary;
  priorityItems: DashboardPriorityItem[];
  upcomingTasks: DashboardTaskPreview[];
  recentNotes: DashboardNotePreview[];
  todayLabel: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}
