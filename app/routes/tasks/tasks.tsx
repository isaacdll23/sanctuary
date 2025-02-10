import { requireAuth, getUserFromSession } from "~/modules/auth.server";
import type { Route } from "./+types/tasks";
import { db } from "~/db";
import { tasksTable } from "~/db/schema";
import { eq, desc } from "drizzle-orm";

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

export default function Tasks({ loaderData }: Route.ComponentProps) {
  return (
    <div className="h-full flex flex-col items-center mt-4">
      <h1 className="text-3xl mb-4">Tasks</h1>
      {loaderData.userTasks.length === 0 ? (
        <>
          <p>No tasks found</p>
        </>
      ) : (
        <ul className="w-1/3">
          {loaderData.userTasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between border-b-2 border-gray-800 p-4"
            >
              <p>{task.title}</p>
              <p>{task.createdAt.toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
