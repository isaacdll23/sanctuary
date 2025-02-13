import { useState, useEffect } from "react";
import { requireAuth, getUserFromSession } from "~/modules/auth.server";
import type { Route } from "./+types/tasks";
import { db } from "~/db";
import { tasksTable, taskStepsTable } from "~/db/schema";
import { eq, desc } from "drizzle-orm";
import { useFetcher } from "react-router";
import TaskItem from "~/components/tasks/TaskItem";

export function meta({ }: Route.MetaArgs) {
  return [{ title: "Tasks" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);

  const user = await getUserFromSession(request);

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
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const user = await getUserFromSession(request);
  const formData = await request.formData();

  // Delete task branch
  const deleteTask = formData.get("deleteTask");
  if (typeof deleteTask === "string" && deleteTask.trim()) {
    const taskId = parseInt(deleteTask, 10);

    // Delete any task steps associated with the task
    await db.delete(taskStepsTable).where(eq(taskStepsTable.taskId, taskId));

    await db.delete(tasksTable).where(eq(tasksTable.id, taskId));
  }

  // Complete task branch
  const completeTask = formData.get("completeTask");
  if (typeof completeTask === "string" && completeTask.trim()) {
    const taskId = parseInt(completeTask, 10);
    // Assuming tasksTable has a column 'completedAt'
    await db
      .update(tasksTable)
      .set({ completedAt: new Date() })
      .where(eq(tasksTable.id, taskId));
  }

  // Update step branch (complete/uncomplete)
  const completeStep = formData.get("completeStep");
  const isChecked = formData.get("isChecked");
  if (
    typeof completeStep === "string" &&
    completeStep.trim() &&
    typeof isChecked === "string"
  ) {
    const stepId = parseInt(completeStep, 10);
    if (isChecked === "true") {
      await db
        .update(taskStepsTable)
        .set({ completedAt: new Date() })
        .where(eq(taskStepsTable.id, stepId));
    } else {
      await db
        .update(taskStepsTable)
        .set({ completedAt: null })
        .where(eq(taskStepsTable.id, stepId));
    }

    // Determine the related task and update its completedAt status
    const [stepRecord] = await db
      .select()
      .from(taskStepsTable)
      .where(eq(taskStepsTable.id, stepId));
    if (stepRecord) {
      const allSteps = await db
        .select()
        .from(taskStepsTable)
        .where(eq(taskStepsTable.taskId, stepRecord.taskId));
      const allComplete =
        allSteps.length > 0 && allSteps.every((s) => s.completedAt !== null);
      if (allComplete) {
        await db
          .update(tasksTable)
          .set({ completedAt: new Date() })
          .where(eq(tasksTable.id, stepRecord.taskId));
      } else {
        await db
          .update(tasksTable)
          .set({ completedAt: null })
          .where(eq(tasksTable.id, stepRecord.taskId));
      }
    }
    return null;
  }
  // Create a new task step branch
  const stepDescription = formData.get("stepDescription");
  const taskIdForStep = formData.get("taskId");
  if (
    typeof stepDescription === "string" &&
    stepDescription.trim() &&
    typeof taskIdForStep === "string"
  ) {
    const taskId = parseInt(taskIdForStep, 10);
    await db.insert(taskStepsTable).values({
      taskId,
      userId: user.id,
      description: stepDescription.trim(),
      createdAt: new Date(),
    });
    return null;
  }

  // Create task branch for new tasks
  const title = formData.get("title");
  if (typeof title !== "string" || !title.trim()) {
    return { error: "Invalid task title provided" };
  }

  const description = formData.get("description");
  if (typeof description !== "string" || !description.trim()) {
    return { error: "Invalid task description provided" };
  }

  await db.insert(tasksTable).values({
    title: title.trim(),
    userId: user.id,
    description: description.trim(),
    createdAt: new Date(),
  });
}

export default function Tasks({ loaderData }: Route.ComponentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hideCompletedTasks, setHideCompletedTasks] = useState(true);
  let fetcher = useFetcher();

  const filteredTasks = loaderData.userTasks.filter((task) => {
    if (hideCompletedTasks) {
      return task.completedAt === null;
    }
    return true;
  });

  // Close the modal after successful form submission
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data === undefined) {
      setIsModalOpen(false);
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <div className="h-full w-full flex flex-col items-center mt-4">
      <div className="flex flex-row justify-between items-center w-4/5 mb-2">
        <h1 className="text-3xl mb-4">Tasks</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="mb-4 rounded-xl border-2 px-5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-800 bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
        >
          Add Task
        </button>
      </div>

      <div className="flex flex-row justify-end items-center w-4/5 mb-8">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            onChange={() => setHideCompletedTasks(!hideCompletedTasks)}
            checked={hideCompletedTasks}
          />
          <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
          <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
            Hide Completed Tasks
          </span>
        </label>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center gap-4 w-full">
          <p>No tasks found</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full">
          <ul className="w-4/5 border-4 rounded-2xl border-gray-800 divide-y-2 divide-gray-800">
            {filteredTasks.map((task) => (
              <TaskItem key={task.id} task={task} taskSteps={loaderData.userTaskSteps.filter((step) => {
                return step.taskId === task.id;
              })} />
            ))}
          </ul>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-5/6 md:w-1/3 relative">
            <h2 className="text-2xl font-bold mb-4">Add Task</h2>
            <fetcher.Form
              method="post"
              className="flex flex-col justify-center items-center gap-4"
            >
              <input
                type="text"
                name="title"
                placeholder="Enter task..."
                className="w-full border-2 border-gray-500 rounded-xl p-2 text-sm bg-gray-600 text-white"
                required
              />
              <input
                type="text"
                name="description"
                placeholder="Enter description..."
                className="w-full border-2 border-gray-500 rounded-xl p-2 text-sm bg-gray-600 text-white"
                required
              />
              <button
                type="submit"
                className="w-full rounded-xl border-2 px-8 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-800 bg-blue-700 text-white hover:bg-blue-800 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Add Task
              </button>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full rounded-xl border-2 px-8 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-800 bg-gray-700 text-white hover:bg-gray-900 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Cancel
              </button>
            </fetcher.Form>
          </div>
        </div>
      )}
    </div>
  );
}
