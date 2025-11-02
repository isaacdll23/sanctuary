import React from "react";

interface DashboardStatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  sublabel: string;
  color?: "indigo" | "emerald" | "blue" | "amber";
}

const colorStyles = {
  indigo: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-600 dark:text-indigo-400",
    icon: "text-indigo-600 dark:text-indigo-400",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    icon: "text-blue-600 dark:text-blue-400",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    icon: "text-amber-600 dark:text-amber-400",
  },
};

export default function DashboardStatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  color = "indigo",
}: DashboardStatCardProps) {
  const styles = colorStyles[color];

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 md:p-6 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-150 group">
      <div className="flex items-start gap-4">
        <div
          className={`p-2.5 rounded-lg ${styles.bg} flex-shrink-0 group-hover:scale-110 transition-transform duration-150`}
        >
          <Icon className={`w-6 h-6 ${styles.icon}`} aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
            {label}
          </p>
          <div className="flex items-end gap-1 mt-1">
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 pb-1">
              {sublabel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
