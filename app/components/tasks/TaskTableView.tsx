import { useState, Fragment } from "react";
import { useFetcher } from "react-router";
import type { Task, TaskStep } from "~/types/task.types";
import { format } from "date-fns";
import {
  CheckCircleIcon,
  XCircleIcon,
  EllipsisVerticalIcon,
  CheckIcon,
  TrashIcon,
  ArrowsUpDownIcon,
  MagnifyingGlassIcon,
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

  // Filter tasks based on search query
  const filteredTasks = tasks.filter((task) => {
    const query = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(query) ||
      (task.description?.toLowerCase().includes(query) ?? false) ||
      (task.category?.toLowerCase().includes(query) ?? false)
    );
  });

  // Sort tasks
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
      className="flex items-center gap-1 hover:text-purple-400 transition-colors"
    >
      {label}
      <ArrowsUpDownIcon className="w-4 h-4 opacity-50" />
    </button>
  );

  if (sortedTasks.length === 0) {
    return (
      <div className="text-center py-12">
        <MagnifyingGlassIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
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
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="Search tasks by title, description, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-600">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 w-1/4">
                <SortHeader label="Task" sortKey="title" />
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 w-1/6">
                <SortHeader label="Category" sortKey="category" />
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 w-1/8">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 w-1/5">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 w-1/6">
                <SortHeader label="Created" sortKey="createdAt" />
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-100 w-1/8">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map((task) => {
              const progress = getProgressPercentage(task.id);
              const taskStepsList = taskSteps.filter(
                (step) => step.taskId === task.id
              );
              const isExpanded = expandedTaskId === task.id;

              return (
                <Fragment key={task.id}>
                  <tr
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() => onTaskSelect?.(task)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p
                          className={`font-medium text-gray-900 dark:text-gray-100 ${
                            task.completedAt
                              ? "line-through text-gray-500 dark:text-gray-400"
                              : ""
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
                    <td className="px-6 py-4">
                      {task.category ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                          {task.category}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {task.completedAt ? (
                          <>
                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
                            <span className="text-xs font-medium text-green-600 dark:text-green-400">
                              Complete
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="w-5 h-5 text-amber-500" />
                            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                              Open
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {taskStepsList.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 max-w-xs">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-300 min-w-fit">
                            {progress}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(task.createdAt), "MMM d, yyyy")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
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
                            className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                            title={
                              task.completedAt
                                ? "Mark as Incomplete"
                                : "Mark as Complete"
                            }
                          >
                            {task.completedAt ? (
                              <XCircleIcon className="w-5 h-5" />
                            ) : (
                              <CheckIcon className="w-5 h-5" />
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
                            className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                            title="Delete Task"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </fetcher.Form>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedTaskId(
                              isExpanded ? null : task.id
                            );
                          }}
                          className="p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                          title="More options"
                        >
                          <EllipsisVerticalIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="space-y-3">
                          {task.description && (
                            <div>
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Description
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {task.description}
                              </p>
                            </div>
                          )}
                          {taskStepsList.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                Steps ({taskStepsList.length})
                              </p>
                              <ul className="space-y-1">
                                {taskStepsList.map((step) => (
                                  <li
                                    key={step.id}
                                    className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2"
                                  >
                                    <span className="mt-1">
                                      {step.completedAt ? (
                                        <CheckIcon className="w-3.5 h-3.5 text-green-500" />
                                      ) : (
                                        <div className="w-3.5 h-3.5 border border-gray-300 dark:border-gray-600 rounded" />
                                      )}
                                    </span>
                                    <span
                                      className={
                                        step.completedAt
                                          ? "line-through text-gray-400"
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
                              <span className="font-medium">Due:</span>{" "}
                              {format(new Date(task.dueDate), "MMM d, yyyy")}
                            </div>
                          )}
                          {task.reminderDate && (
                            <div className="text-xs text-purple-600 dark:text-purple-400">
                              <span className="font-medium">Reminder:</span>{" "}
                              {format(
                                new Date(task.reminderDate),
                                "MMM d, yyyy p"
                              )}
                            </div>
                          )}
                          <button
                            onClick={() => onTaskSelect?.(task)}
                            className="text-xs font-medium text-purple-500 hover:text-purple-600 dark:hover:text-purple-400 mt-2"
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
  );
}
