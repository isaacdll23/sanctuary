import { requireAuth, getUserFromSession } from "~/modules/auth.server";
import type { Route } from "./+types/tasks";
import { db } from "~/db";
import { tasksTable } from "~/db/schema";
import { eq, desc } from "drizzle-orm";
import { useFetcher } from "react-router";

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

  // Create task branch for new tasks
  const title = formData.get("title");
  if (typeof title !== "string" || !title.trim()) {
    return { error: "Invalid task title provided" };
  }

  await db.insert(tasksTable).values({
    title: title.trim(),
    userId: user.id,
    createdAt: new Date(),
  });
}

export default function Tasks({ loaderData }: Route.ComponentProps) {
  let fetcher = useFetcher();

  return (
    <div className="h-full flex flex-col items-center mt-4">
      <h1 className="text-3xl mb-4">Tasks</h1>
      {loaderData.userTasks.length === 0 ? (
        <div className="flex flex-col items-center gap-4 w-full">
          <p>No tasks found</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full">
          <ul className="w-1/3">
            {loaderData.userTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between border-b-2 border-gray-800 p-4"
              >
                <div>
                  <p>{task.title}</p>
                  <p>{task.createdAt.toLocaleDateString()}</p>
                </div>
                <fetcher.Form method="post">
                  <input type="hidden" name="deleteTask" value={task.id} />
                  <button
                    type="submit"
                    className="rounded bg-red-600 text-white px-3 py-1 text-xs hover:bg-red-700"
                  >
                    Delete
                  </button>
                </fetcher.Form>
              </li>
            ))}
          </ul>
        </div>
      )}

      <fetcher.Form
        method="post"
        className="w-1/3 mb-4 flex flex-col justify-center items-center border-2 border-gray-800 rounded-xl p-4 gap-4 mt-4"
      >
        <input
          type="text"
          name="title"
          placeholder="Enter task..."
          className="w-full border-2 border-gray-500 rounded-xl p-2 text-sm bg-gray-600"
          required
        />
        <input
          type="text"
          name="description"
          placeholder="Enter description..."
          className="w-full border-2 border-gray-500 rounded-xl p-2 text-sm bg-gray-600"
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
  );
}
