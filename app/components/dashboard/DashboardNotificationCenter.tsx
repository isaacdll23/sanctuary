import React, { useState, useCallback } from "react";
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import type {
  DashboardAlert,
  DashboardAlertType,
  DashboardAlertPriority,
} from "~/types/dashboardAlerts";
import { sortAlerts, getActiveAlerts } from "~/types/dashboardAlerts";

interface DashboardNotificationCenterProps {
  alerts: DashboardAlert[];
  onDismiss?: (alertId: string) => void;
  maxDisplayed?: number;
  showUnreadBadge?: boolean;
}

const typeColors: Record<DashboardAlertType, Record<string, string>> = {
  error: {
    bg: "bg-red-50 dark:bg-red-500/10",
    border: "border-red-200 dark:border-red-500/30",
    text: "text-red-900 dark:text-red-300",
    icon: "text-red-600 dark:text-red-400",
  },
  warning: {
    bg: "bg-yellow-50 dark:bg-yellow-500/10",
    border: "border-yellow-200 dark:border-yellow-500/30",
    text: "text-yellow-900 dark:text-yellow-300",
    icon: "text-yellow-600 dark:text-yellow-400",
  },
  success: {
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    border: "border-emerald-200 dark:border-emerald-500/30",
    text: "text-emerald-900 dark:text-emerald-300",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  info: {
    bg: "bg-blue-50 dark:bg-blue-500/10",
    border: "border-blue-200 dark:border-blue-500/30",
    text: "text-blue-900 dark:text-blue-300",
    icon: "text-blue-600 dark:text-blue-400",
  },
};

const iconMap: Record<DashboardAlertType, React.ReactNode> = {
  error: <ExclamationTriangleIcon className="w-5 h-5" />,
  warning: <ExclamationTriangleIcon className="w-5 h-5" />,
  success: <CheckCircleIcon className="w-5 h-5" />,
  info: <InformationCircleIcon className="w-5 h-5" />,
};

export default function DashboardNotificationCenter({
  alerts,
  onDismiss,
  maxDisplayed = 3,
  showUnreadBadge = true,
}: DashboardNotificationCenterProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set()
  );

  const activeAlerts = getActiveAlerts(alerts).filter(
    (a) => !dismissedAlerts.has(a.id)
  );
  const sortedAlerts = sortAlerts(activeAlerts).slice(0, maxDisplayed);

  const handleDismiss = useCallback(
    (alertId: string) => {
      setDismissedAlerts((prev) => new Set([...prev, alertId]));
      onDismiss?.(alertId);
    },
    [onDismiss]
  );

  const unreadCount = sortedAlerts.filter((a) => a.priority === "critical" || a.priority === "high").length;

  return (
    <>
      {/* Notification Badge */}
      {showUnreadBadge && unreadCount > 0 && (
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30">
          <BellIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
          <span className="text-sm font-medium text-red-700 dark:text-red-400">
            {unreadCount} notification{unreadCount !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Notifications List */}
      {sortedAlerts.length > 0 ? (
        <div className="space-y-3 mb-6">
          {sortedAlerts.map((alert) => {
            const colors = typeColors[alert.type];

            return (
              <div
                key={alert.id}
                className={`rounded-lg border p-4 ${colors.bg} ${colors.border}`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`flex-shrink-0 mt-0.5 ${colors.icon}`}>
                    {iconMap[alert.type]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h3
                        className={`text-sm font-semibold ${colors.text}`}
                      >
                        {alert.title}
                      </h3>

                      {/* Priority Badge */}
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ml-2 flex-shrink-0 ${
                          alert.priority === "critical"
                            ? "bg-red-200 dark:bg-red-500/30 text-red-800 dark:text-red-300"
                            : alert.priority === "high"
                              ? "bg-yellow-200 dark:bg-yellow-500/30 text-yellow-800 dark:text-yellow-300"
                              : alert.priority === "medium"
                                ? "bg-blue-200 dark:bg-blue-500/30 text-blue-800 dark:text-blue-300"
                                : "bg-gray-200 dark:bg-gray-500/30 text-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {alert.priority}
                      </span>
                    </div>

                    {/* Description */}
                    <p className={`text-sm mt-1 ${colors.text}`}>
                      {alert.description}
                    </p>

                    {/* Action Button */}
                    {alert.action && (
                      <a
                        href={alert.action.href}
                        className={`inline-flex items-center mt-2 text-sm font-medium underline hover:no-underline ${colors.text}`}
                      >
                        {alert.action.label} →
                      </a>
                    )}
                  </div>

                  {/* Dismiss Button */}
                  {alert.dismissible && (
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className={`flex-shrink-0 p-1 rounded hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors ${colors.icon}`}
                      aria-label="Dismiss alert"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
