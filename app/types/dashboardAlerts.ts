/**
 * Dashboard Notifications and Alerts
 * Integration point for displaying key alerts, achievements, and notifications
 */

import type { DashboardInsight } from "~/routes/dashboard/+types/dashboard";

export type DashboardAlertType = "error" | "warning" | "success" | "info";
export type DashboardAlertPriority = "critical" | "high" | "medium" | "low";

export interface DashboardAlert {
  id: string;
  type: DashboardAlertType;
  priority: DashboardAlertPriority;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  dismissible: boolean;
  createdAt: Date;
  expiresAt?: Date;
  relatedWidget?: string;
}

export interface DashboardNotification {
  id: string;
  type: "achievement" | "alert" | "reminder" | "suggestion";
  title: string;
  message: string;
  icon?: string;
  color?: "emerald" | "amber" | "red" | "blue" | "purple";
  action?: {
    label: string;
    href: string;
  };
  createdAt: Date;
  read: boolean;
}

/**
 * Convert dashboard insights to alerts
 */
export function insightsToAlerts(insights: DashboardInsight[]): DashboardAlert[] {
  return insights.map((insight, idx) => {
    const typeMap: Record<string, DashboardAlertType> = {
      warning: "warning",
      opportunity: "info",
      achievement: "success",
      trend: "info",
    };

    const priorityMap: Record<string, DashboardAlertPriority> = {
      high: "critical",
      medium: "high",
      low: "medium",
    };

    return {
      id: `insight-${idx}-${insight.title.replace(/\s/g, "-")}`,
      type: typeMap[insight.type] || "info",
      priority: priorityMap[insight.priority] || "low",
      title: insight.title,
      description: insight.description,
      action: insight.actionUrl
        ? {
            label: "View",
            href: insight.actionUrl,
          }
        : undefined,
      dismissible: insight.type !== "warning",
      createdAt: new Date(),
      relatedWidget: insight.icon,
    };
  });
}

/**
 * Filter alerts by type or priority
 */
export function filterAlerts(
  alerts: DashboardAlert[],
  filters?: {
    types?: DashboardAlertType[];
    priorities?: DashboardAlertPriority[];
  }
): DashboardAlert[] {
  if (!filters) return alerts;

  return alerts.filter((alert) => {
    if (filters.types && !filters.types.includes(alert.type)) return false;
    if (filters.priorities && !filters.priorities.includes(alert.priority))
      return false;
    return true;
  });
}

/**
 * Sort alerts by priority and recency
 */
export function sortAlerts(alerts: DashboardAlert[]): DashboardAlert[] {
  const priorityOrder: Record<DashboardAlertPriority, number> = {
    critical: 1,
    high: 2,
    medium: 3,
    low: 4,
  };

  return [...alerts].sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

/**
 * Check if an alert should be shown (not expired)
 */
export function isAlertActive(alert: DashboardAlert): boolean {
  if (!alert.expiresAt) return true;
  return new Date() < alert.expiresAt;
}

/**
 * Get active alerts only
 */
export function getActiveAlerts(alerts: DashboardAlert[]): DashboardAlert[] {
  return alerts.filter(isAlertActive);
}
