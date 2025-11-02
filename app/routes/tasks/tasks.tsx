import { useState, useEffect, useMemo } from "react";
import { eq, desc } from "drizzle-orm";
import { useFetcher, useSearchParams, useLoaderData } from "react-router";
import type { Route } from "./+types/tasks";
import TaskTableView from "~/components/tasks/TaskTableView";
import TaskModal from "~/components/tasks/TaskModal";
import AddTaskModal from "~/components/tasks/AddTaskModal";
import TaskFilterBar from "~/components/tasks/TaskFilterBar";
import type { Task, TaskStep } from "~/types/task.types";
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

  const [hideCompletedTasks, setHideCompletedTasks] = useState(
    searchParams.get("hideCompletedTasks") === "true"
  );
  const [filterCategory, setFilterCategory] = useState(
    searchParams.get("filterCategory") || ""
  );
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [lastProcessedDataKey, setLastProcessedDataKey] = useState<string | null>(null);

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

  useEffect(() => {
    setSearchParams({
      hideCompletedTasks: hideCompletedTasks.toString(),
      filterCategory: filterCategory,
    });
  }, [hideCompletedTasks, filterCategory, setSearchParams]);

  useEffect(() => {
    if (
      fetcher.state === "idle" &&
      fetcher.data &&
      (fetcher.data as any).success === true &&
      showAddModal
    ) {
      const dataKey = `${JSON.stringify(fetcher.data)}`;
      if (dataKey !== lastProcessedDataKey) {
        setShowAddModal(false);
        setLastProcessedDataKey(dataKey);
      }
    }
  }, [fetcher.state, fetcher.data, showAddModal, lastProcessedDataKey]);

  useEffect(() => {
    if (selectedTask && !userTasks.some((task) => task.id === selectedTask.id)) {
      setSelectedTask(null);
    }
  }, [userTasks, selectedTask]);

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCloseTaskModal = () => {
    setSelectedTask(null);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setLastProcessedDataKey(null);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Tasks
            </h1>
            <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
              Organize and track your work efficiently.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 shadow-sm hover:shadow-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:ring-offset-2 dark:focus:ring-offset-gray-900 whitespace-nowrap"
          >
            <PlusIcon className="h-5 w-5" />
            Add Task
          </button>
        </header>

        {/* Filters */}
        <TaskFilterBar
          openTasksCount={openTasksCount}
          hideCompletedTasks={hideCompletedTasks}
          onToggleHideCompleted={() => setHideCompletedTasks(!hideCompletedTasks)}
          filterCategory={filterCategory}
          onCategoryChange={setFilterCategory}
          distinctCategories={distinctCategories}
        />

        {/* Empty State */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-300 dark:text-gray-600 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-1">
              No tasks match your filters
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Try adjusting your filters or create a new task to get started.
            </p>
          </div>
        ) : (
          /* Tasks Table */
          <TaskTableView
            tasks={filteredTasks}
            taskSteps={userTaskSteps}
            distinctCategories={distinctCategories}
            onTaskSelect={handleTaskSelect}
          />
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
        />
      )}

      {showAddModal && (
        <AddTaskModal
          fetcher={fetcher}
          onClose={handleCloseAddModal}
          distinctCategories={distinctCategories}
          filterCategory={filterCategory}
        />
      )}
    </div>
  );
}
