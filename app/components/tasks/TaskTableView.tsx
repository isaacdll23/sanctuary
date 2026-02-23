import { useState, Fragment } from "react";
import { useFetcher } from "react-router";
import type { Task, TaskStep } from "~/types/task.types";
import { format } from "date-fns";
import {
  CheckCircleIcon,
  XCircleIcon,
  CheckIcon,
  TrashIcon,
  ArrowsUpDownIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

type SortKey = "title" | "createdAt" | "dueDate" | "completedAt" | "category";
type SortDir = "asc" | "desc";

interface TaskTableViewProps {
  tasks: Task[];
  taskSteps: TaskStep[];
  distinctCategories: string[];
  onTaskSelect?: (task: Task) => void;
}

export default function TaskTableView({
  tasks,
  taskSteps,
  distinctCategories,
  onTaskSelect,
}: TaskTableViewProps) {
  const fetcher = useFetcher();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);

  const filteredTasks = tasks.filter((task) => {
    const query = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(query) ||
      (task.description?.toLowerCase().includes(query) ?? false) ||
      (task.category?.toLowerCase().includes(query) ?? false)
    );
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortKey) {
      case "title":
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case "createdAt":
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case "dueDate":
        aValue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        bValue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        break;
      case "completedAt":
        aValue = a.completedAt ? 1 : 0;
        bValue = b.completedAt ? 1 : 0;
        break;
      case "category":
        aValue = (a.category || "").toLowerCase();
        bValue = (b.category || "").toLowerCase();
        break;
    }

    if (aValue < bValue) return sortDir === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const getProgressPercentage = (taskId: number) => {
    const taskStepsList = taskSteps.filter((step) => step.taskId === taskId);
    if (taskStepsList.length === 0) return 0;
    const completed = taskStepsList.filter(
      (step) => step.completedAt !== null
    ).length;
    return Math.round((completed / taskStepsList.length) * 100);
  };

  const SortHeader = ({ label, sortKey: key }: { label: string; sortKey: SortKey }) => (
    <button
      onClick={() => toggleSort(key)}
      className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-150"
    >
      {label}
      <ArrowsUpDownIcon className="w-4 h-4 opacity-60" />
    </button>
  );

  if (sortedTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <MagnifyingGlassIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          {searchQuery ? "No tasks match your search." : "No tasks found."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="Search tasks by title, description, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-base md:text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-gray-400 dark:focus:border-gray-600 transition-colors duration-150"
        />
      </div>

      {/* Mobile Card List */}
      <div className="space-y-3 md:hidden">
        {sortedTasks.map((task) => {
          const progress = getProgressPercentage(task.id);
          const taskStepsList = taskSteps.filter((step) => step.taskId === task.id);
          const isExpanded = expandedTaskId === task.id;

          return (
            <article
              key={task.id}
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-3.5 shadow-sm"
            >
              <button
                type="button"
                onClick={() => onTaskSelect?.(task)}
                className="w-full text-left"
              >
                <p
                  className={`font-semibold text-sm transition-colors duration-150 ${
                    task.completedAt
                      ? "line-through text-gray-400 dark:text-gray-500"
                      : "text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </button>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {task.category ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {task.category}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400 dark:text-gray-500">No category</span>
                )}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {format(new Date(task.createdAt), "MMM d, yyyy")}
                </span>
              </div>

              <div className="mt-3">
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {taskStepsList.length > 0 ? `${progress}%` : "No steps"}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gray-600 dark:bg-gray-400 h-2 rounded-full transition-all duration-150"
                    style={{ width: `${taskStepsList.length > 0 ? progress : 0}%` }}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <fetcher.Form method="post">
                  <input
                    type="hidden"
                    name={task.completedAt ? "incompleteTask" : "completeTask"}
                    value={task.id}
                  />
                  <button
                    type="submit"
                    className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-gray-300 bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    title={task.completedAt ? "Mark as Incomplete" : "Mark as Complete"}
                    aria-label={task.completedAt ? "Mark as Incomplete" : "Mark as Complete"}
                  >
                    {task.completedAt ? (
                      <XCircleIcon className="w-5 h-5" />
                    ) : (
                      <CheckIcon className="w-5 h-5" />
                    )}
                  </button>
                </fetcher.Form>

                <button
                  type="button"
                  onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-gray-300 bg-gray-100 px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Details
                  <ChevronDownIcon
                    className={`w-4 h-4 transition-transform duration-150 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <fetcher.Form method="post">
                  <input type="hidden" name="deleteTask" value={task.id} />
                  <button
                    type="submit"
                    onClick={(e) => {
                      if (!confirm("Are you sure you want to delete this task?")) {
                        e.preventDefault();
                      }
                    }}
                    className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-gray-300 bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    title="Delete Task"
                    aria-label="Delete Task"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </fetcher.Form>
              </div>

              {isExpanded && (
                <div className="mt-3 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                  {task.description && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {task.description}
                    </p>
                  )}
                  {taskStepsList.length > 0 && (
                    <ul className="space-y-1.5">
                      {taskStepsList.map((step) => (
                        <li
                          key={step.id}
                          className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2.5"
                        >
                          <span className="mt-0.5 flex-shrink-0">
                            {step.completedAt ? (
                              <CheckIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            ) : (
                              <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded" />
                            )}
                          </span>
                          <span
                            className={
                              step.completedAt
                                ? "line-through text-gray-500 dark:text-gray-400"
                                : ""
                            }
                          >
                            {step.description}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {task.dueDate && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Due:</span>{" "}
                      {format(new Date(task.dueDate), "MMM d, yyyy")}
                    </p>
                  )}
                  {task.reminderDate && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Reminder:</span>{" "}
                      {format(new Date(task.reminderDate), "MMM d, yyyy p")}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => onTaskSelect?.(task)}
                    className="pt-1 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-150"
                  >
                    Open Full Details
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 w-1/4">
                  <SortHeader label="Task" sortKey="title" />
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 w-1/6">
                  <SortHeader label="Category" sortKey="category" />
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 w-1/8">
                  Status
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 w-1/5">
                  Progress
                </th>
                <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 w-1/6">
                  <SortHeader label="Created" sortKey="createdAt" />
                </th>
                <th className="px-4 py-3.5 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 w-1/8">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sortedTasks.map((task, idx) => {
                const progress = getProgressPercentage(task.id);
                const taskStepsList = taskSteps.filter(
                  (step) => step.taskId === task.id
                );
                const isExpanded = expandedTaskId === task.id;

                return (
                  <Fragment key={task.id}>
                    <tr
                      className={`transition-colors duration-150 cursor-pointer ${
                        idx % 2 === 0
                          ? "bg-white dark:bg-gray-900/50"
                          : "bg-gray-50 dark:bg-gray-800/30"
                      } hover:bg-gray-100 dark:hover:bg-gray-700/50`}
                      onClick={() => onTaskSelect?.(task)}
                    >
                      <td className="px-4 py-3.5">
                        <div>
                          <p
                            className={`font-medium text-sm transition-colors duration-150 ${
                              task.completedAt
                                ? "line-through text-gray-400 dark:text-gray-500"
                                : "text-gray-900 dark:text-gray-100"
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {task.category ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            {task.category}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {task.completedAt ? (
                            <>
                              <CheckCircleIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Done
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Open
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {taskStepsList.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-xs">
                              <div
                                className="bg-gray-600 dark:bg-gray-400 h-2 rounded-full transition-all duration-150"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-fit">
                              {progress}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {format(new Date(task.createdAt), "MMM d, yyyy")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-center gap-1.5">
                          <fetcher.Form method="post" className="inline">
                            <input
                              type="hidden"
                              name={
                                task.completedAt
                                  ? "incompleteTask"
                                  : "completeTask"
                              }
                              value={task.id}
                            />
                            <button
                              type="submit"
                              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150 min-h-[40px] min-w-[40px] flex items-center justify-center"
                              title={
                                task.completedAt
                                  ? "Mark as Incomplete"
                                  : "Mark as Complete"
                              }
                            >
                              {task.completedAt ? (
                                <XCircleIcon className="w-4 h-4" />
                              ) : (
                                <CheckIcon className="w-4 h-4" />
                              )}
                            </button>
                          </fetcher.Form>
                          <fetcher.Form method="post" className="inline">
                            <input
                              type="hidden"
                              name="deleteTask"
                              value={task.id}
                            />
                            <button
                              type="submit"
                              onClick={(e) => {
                                if (
                                  !confirm(
                                    "Are you sure you want to delete this task?"
                                  )
                                ) {
                                  e.preventDefault();
                                }
                              }}
                              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-150 min-h-[40px] min-w-[40px] flex items-center justify-center"
                              title="Delete Task"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </fetcher.Form>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedTaskId(isExpanded ? null : task.id);
                            }}
                            className={`p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-150 min-h-[40px] min-w-[40px] flex items-center justify-center ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                            title="View details"
                          >
                            <ChevronDownIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                        <td colSpan={6} className="px-4 py-4">
                          <div className="space-y-3">
                            {task.description && (
                              <div>
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                                  Description
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                  {task.description}
                                </p>
                              </div>
                            )}
                            {taskStepsList.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                                  Steps ({taskStepsList.length})
                                </p>
                                <ul className="space-y-2">
                                  {taskStepsList.map((step) => (
                                    <li
                                      key={step.id}
                                      className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-3"
                                    >
                                      <span className="mt-0.5 flex-shrink-0">
                                        {step.completedAt ? (
                                          <CheckIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                        ) : (
                                          <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 rounded" />
                                        )}
                                      </span>
                                      <span
                                        className={
                                          step.completedAt
                                            ? "line-through text-gray-500 dark:text-gray-400"
                                            : ""
                                        }
                                      >
                                        {step.description}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {task.dueDate && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                <span className="font-semibold">Due:</span>{" "}
                                {format(new Date(task.dueDate), "MMM d, yyyy")}
                              </div>
                            )}
                            {task.reminderDate && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                <span className="font-semibold">Reminder:</span>{" "}
                                {format(
                                  new Date(task.reminderDate),
                                  "MMM d, yyyy p"
                                )}
                              </div>
                            )}
                            <button
                              onClick={() => onTaskSelect?.(task)}
                              className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 mt-3 transition-colors duration-150"
                            >
                              Open Full Details →
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
