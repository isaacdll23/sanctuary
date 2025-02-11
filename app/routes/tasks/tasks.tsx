import { useState, useEffect } from "react";
import { requireAuth, getUserFromSession } from "~/modules/auth.server";
import type { Route } from "./+types/tasks";
import { db } from "~/db";
import { tasksTable } from "~/db/schema";
import { eq, desc } from "drizzle-orm";
import { useFetcher } from "react-router";
import TaskItem from "~/components/tasks/TaskItem";

export function meta({}: Route.MetaArgs) {
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

  return { userTasks };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);
  const user = await getUserFromSession(request);
  const formData = await request.formData();

  // Delete task branch
  const deleteTask = formData.get("deleteTask");
  if (typeof deleteTask === "string" && deleteTask.trim()) {
    const taskId = parseInt(deleteTask, 10);
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
  let fetcher = useFetcher();

  // Close the modal after successful form submission
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data === undefined) {
      setIsModalOpen(false);
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <div className="h-full w-full flex flex-col items-center mt-4">
      <div className="flex flex-row justify-between items-center w-4/5 mb-8">
        <h1 className="text-3xl mb-4">Tasks</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="mb-4 rounded-xl border-2 px-5 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-800 bg-green-600 text-white hover:bg-green-700 focus:ring-white transition-colors duration-200"
        >
          Add Task
        </button>
      </div>

      {loaderData.userTasks.length === 0 ? (
        <div className="flex flex-col items-center gap-4 w-full">
          <p>No tasks found</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full">
          <ul className="w-4/5 border-2 rounded-xl border-gray-800 divide-y-2 divide-gray-800">
            {loaderData.userTasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </ul>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-5/6 md:w-80 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-2 text-white font-bold"
            >
              X
            </button>
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
            </fetcher.Form>
          </div>
        </div>
      )}
    </div>
  );
}