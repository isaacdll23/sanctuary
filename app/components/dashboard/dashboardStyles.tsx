import React from "react";

interface DashboardPanelClassOptions {
  interactive?: boolean;
  className?: string;
}

export function getDashboardPanelClasses({
  interactive = true,
  className,
}: DashboardPanelClassOptions = {}) {
  return [
    "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-all duration-150",
    interactive
      ? "hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600"
      : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

interface DashboardWidgetHeaderProps {
  title: string;
  icon: React.ReactNode;
  iconContainerClassName: string;
  className?: string;
}

export function DashboardWidgetHeader({
  title,
  icon,
  iconContainerClassName,
  className,
}: DashboardWidgetHeaderProps) {
  return (
    <h3
      className={`text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 ${className ?? ""}`.trim()}
    >
      <div className={`p-2 rounded-lg ${iconContainerClassName}`}>{icon}</div>
      {title}
    </h3>
  );
}
