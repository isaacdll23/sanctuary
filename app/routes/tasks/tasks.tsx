import { useState, useEffect, useMemo } from "react";
import { eq, desc } from "drizzle-orm";
import { useFetcher, useSearchParams, useLoaderData } from "react-router";
import type { Route } from "./+types/tasks";
import TaskItem from "~/components/tasks/TaskItem";
import TaskTableView from "~/components/tasks/TaskTableView";
import TaskModal from "~/components/tasks/TaskModal";
import AddTaskModal from "~/components/tasks/AddTaskModal";
import TaskFilterBar from "~/components/tasks/TaskFilterBar";
import type { Task, TaskStep, ViewMode } from "~/types/task.types";
import { PlusIcon } from "@heroicons/react/24/outline";
import {
  pageAccessLoader,
  pageAccessAction,
} from "~/modules/middleware/pageAccess";

export function meta() {
  return [{ title: "Tasks" }];
}

export const loader = pageAccessLoader("tasks", async (user, request) => {
  const { db } = await import("~/db");
  const { tasksTable, taskStepsTable } = await import("~/db/schema");

  const userTasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.userId, user.id))
    .orderBy(desc(tasksTable.createdAt));

  const userTaskSteps = await db
    .select()
    .from(taskStepsTable)
    .where(eq(taskStepsTable.userId, user.id))
    .orderBy(desc(taskStepsTable.createdAt));

  return { userTasks, userTaskSteps };
});

export const action = pageAccessAction("tasks", async (user, request) => {
  const { handleTaskAction } = await import("~/modules/services/TaskService");
  return handleTaskAction(request);
});

export default function Tasks() {
  const { userTasks, userTaskSteps } = useLoaderData<{
    userTasks: Task[];
    userTaskSteps: TaskStep[];
  }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const fetcher = useFetcher();

  // State initialization from URL params
  const [hideCompletedTasks, setHideCompletedTasks] = useState(
    searchParams.get("hideCompletedTasks") === "true"
  );
  const [filterCategory, setFilterCategory] = useState(
    searchParams.get("filterCategory") || ""
  );
  const [isCompactView, setIsCompactView] = useState(
    searchParams.get("compactView") === "true"
  );
  const [viewMode, setViewMode] = useState<ViewMode>(
    (searchParams.get("viewMode") as ViewMode) || "card"
  );
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Memoized derived data
  const distinctCategories = useMemo(
    () =>
      Array.from(
        new Set(userTasks.map((task) => task.category).filter(Boolean))
      ) as string[],
    [userTasks]
  );

  const filteredTasks = useMemo(
    () =>
      userTasks.filter((task) => {
        if (hideCompletedTasks && task.completedAt !== null) return false;
        if (filterCategory && task.category !== filterCategory) return false;
        return true;
      }),
    [userTasks, hideCompletedTasks, filterCategory]
  );

  const openTasksCount = useMemo(
    () =>
      userTasks.filter(
        (task) =>
          task.completedAt === null &&
          (filterCategory === "" || task.category === filterCategory)
      ).length,
    [userTasks, filterCategory]
  );

  // Sync state to URL params
  useEffect(() => {
    setSearchParams({
      hideCompletedTasks: hideCompletedTasks.toString(),
      filterCategory: filterCategory,
      compactView: isCompactView.toString(),
      viewMode: viewMode,
    });
  }, [hideCompletedTasks, filterCategory, isCompactView, viewMode, setSearchParams]);

  // Auto-close add modal on successful submission
  useEffect(() => {
    if (
      fetcher.state === "idle" &&
      fetcher.data &&
      (fetcher.data as any).success === true &&
      showAddModal
    ) {
      setShowAddModal(false);
    }
  }, [fetcher.state, fetcher.data, showAddModal]);

  // Handler functions
  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCloseTaskModal = () => {
    setSelectedTask(null);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  return (
    <div
      className={`min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 ${
        isCompactView ? "p-2 md:p-4" : "p-4 md:p-8"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header
          className={`mb-8 md:mb-12 flex flex-col sm:flex-row justify-between items-center gap-4 ${
            isCompactView ? "mb-4 md:mb-6" : ""
          }`}
        >
          <div>
            <h1
              className={`text-4xl sm:text-5xl font-bold tracking-tight text-center sm:text-left text-gray-900 dark:text-gray-100 ${
                isCompactView ? "text-3xl sm:text-4xl" : ""
              }`}
            >
              Tasks
            </h1>
            {!isCompactView && (
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400 text-center sm:text-left">
                Organize, track, and complete your work.
              </p>
            )}
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isCompactView ? "py-2 px-4 text-sm" : "py-2.5 px-5"
            }`}
          >
            <PlusIcon className={`h-5 w-5 ${isCompactView ? "h-4 w-4" : ""}`} />
            Add New Task
          </button>
        </header>

        {/* Filters and Controls Bar */}
        <TaskFilterBar
          openTasksCount={openTasksCount}
          hideCompletedTasks={hideCompletedTasks}
          onToggleHideCompleted={() => setHideCompletedTasks(!hideCompletedTasks)}
          filterCategory={filterCategory}
          onCategoryChange={setFilterCategory}
          distinctCategories={distinctCategories}
          isCompactView={isCompactView}
          onToggleCompactView={() => setIsCompactView(!isCompactView)}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Task Views */}
        {filteredTasks.length === 0 ? (
          <div className={`text-center ${isCompactView ? "py-5" : "py-10"}`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={`text-gray-500 dark:text-gray-500 mx-auto mb-4 ${
                isCompactView ? "w-12 h-12 mb-2" : "w-16 h-16"
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
              />
            </svg>
            <p
              className={`text-gray-600 dark:text-gray-400 ${
                isCompactView ? "text-base" : "text-lg"
              }`}
            >
              No tasks match your current filters.
            </p>
            {!isCompactView && (
              <p className="text-gray-500 dark:text-gray-500 text-sm">
                Try adjusting your filters or adding a new task.
              </p>
            )}
          </div>
        ) : viewMode === "table" ? (
          <TaskTableView
            tasks={filteredTasks}
            taskSteps={userTaskSteps}
            distinctCategories={distinctCategories}
            onTaskSelect={handleTaskSelect}
          />
        ) : (
          <ul
            className={`space-y-4 md:space-y-6 ${
              isCompactView ? "space-y-2 md:space-y-3" : ""
            }`}
          >
            {filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                taskSteps={userTaskSteps.filter(
                  (step) => step.taskId === task.id
                )}
                distinctCategories={distinctCategories}
                isCompactView={isCompactView}
                onSelect={handleTaskSelect}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Modals */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          taskSteps={userTaskSteps.filter(
            (step) => step.taskId === selectedTask.id
          )}
          fetcher={fetcher}
          onClose={handleCloseTaskModal}
          distinctCategories={distinctCategories}
          isCompactView={isCompactView}
        />
      )}

      {showAddModal && (
        <AddTaskModal
          fetcher={fetcher}
          onClose={handleCloseAddModal}
          distinctCategories={distinctCategories}
          filterCategory={filterCategory}
          isCompactView={isCompactView}
        />
      )}
    </div>
  );
}
