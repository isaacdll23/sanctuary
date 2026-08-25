export interface DashboardAccess {
  hasTasks: boolean;
  hasDayPlanner: boolean;
  hasNotes: boolean;
}

export interface HeaderQuickLink {
  label: string;
  href: string;
}

export interface DashboardLayout {
  headerQuickLinks: HeaderQuickLink[];
  showFocusHub: boolean;
  showVelocityRing: boolean;
  showDayPlannerCta: boolean;
  showRecentNotes: boolean;
  showUpcomingTasks: boolean;
}

export function computeDashboardLayout(access: DashboardAccess): DashboardLayout {
  const showFocusHub = access.hasTasks || access.hasDayPlanner;

  return {
    headerQuickLinks: [
      ...(access.hasTasks ? [{ label: "Task", href: "/tasks" }] : []),
      ...(access.hasNotes ? [{ label: "Note", href: "/notes" }] : []),
    ],
    showFocusHub,
    showVelocityRing: access.hasDayPlanner,
    showDayPlannerCta: access.hasDayPlanner,
    showRecentNotes: access.hasNotes,
    showUpcomingTasks: access.hasTasks,
  };
}