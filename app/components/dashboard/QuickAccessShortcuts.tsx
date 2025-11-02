import React from "react";
import {
  PlusIcon,
  CheckCircleIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  PencilSquareIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

interface QuickAccessShortcut {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: "indigo" | "emerald" | "blue" | "amber" | "purple";
  keyboardShortcut?: string;
}

const QUICK_ACCESS_SHORTCUTS: QuickAccessShortcut[] = [
  {
    id: "new-task",
    label: "New Task",
    description: "Add a task to your list",
    icon: <PlusIcon className="w-5 h-5" />,
    href: "/tasks?action=new",
    color: "indigo",
    keyboardShortcut: "⌘N",
  },
  {
    id: "plan-day",
    label: "Plan Today",
    description: "Schedule your day",
    icon: <CalendarIcon className="w-5 h-5" />,
    href: "/day-planner",
    color: "blue",
    keyboardShortcut: "⌘P",
  },
  {
    id: "view-tasks",
    label: "View Tasks",
    description: "See all tasks",
    icon: <CheckCircleIcon className="w-5 h-5" />,
    href: "/tasks",
    color: "emerald",
  },
  {
    id: "budgets",
    label: "Budgets",
    description: "Manage budgets",
    icon: <CurrencyDollarIcon className="w-5 h-5" />,
    href: "/finance",
    color: "amber",
  },
  {
    id: "notes",
    label: "Notes",
    description: "View or add notes",
    icon: <PencilSquareIcon className="w-5 h-5" />,
    href: "/notes",
    color: "purple",
  },
];

const colorClasses = {
  indigo: "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20",
  emerald:
    "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20",
  blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20",
  amber:
    "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20",
  purple:
    "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/20",
};

interface QuickAccessProps {
  maxShortcuts?: number;
  showKeyboardHints?: boolean;
}

export default function QuickAccessShortcuts({
  maxShortcuts = 5,
  showKeyboardHints = true,
}: QuickAccessProps) {
  const shortcuts = QUICK_ACCESS_SHORTCUTS.slice(0, maxShortcuts);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Quick Access
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {shortcuts.map((shortcut) => (
          <a
            key={shortcut.id}
            href={shortcut.href}
            className={`group relative p-4 rounded-lg border-2 border-transparent transition-all duration-150 flex flex-col items-center text-center ${colorClasses[shortcut.color]}`}
          >
            {/* Icon */}
            <div className="mb-2">{shortcut.icon}</div>

            {/* Label */}
            <p className="font-semibold text-sm">{shortcut.label}</p>

            {/* Description */}
            <p className="text-xs opacity-75 mt-1">{shortcut.description}</p>

            {/* Hover indicator */}
            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRightIcon className="w-4 h-4" />
            </div>
          </a>
        ))}
      </div>

      {/* Keyboard shortcuts hint */}
      {/* {showKeyboardHints && (
        <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            💡 <strong>Pro tip:</strong> Use keyboard shortcuts above for faster access. Press{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white font-mono text-xs">
              ?
            </kbd>{" "}
            to see all shortcuts.
          </p>
        </div>
      )} */}
    </div>
  );
}
