import { getUserFromSession, requireAuth } from "~/modules/auth.server";
import type { Route } from "./+types/dashboard";
import { db } from "~/db";
import { tasksTable } from "~/db/schema";
import { and, gte, eq } from "drizzle-orm";
import { startOfWeek } from "date-fns";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Dashboard" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);

  const user = await getUserFromSession(request);

  // Get number of tasks created this week
  const newTasksThisWeek = await db
    .select()
    .from(tasksTable)
    .where(
      and(
        eq(tasksTable.userId, user.id),
        gte(tasksTable.createdAt, startOfWeek(new Date()))
      )
    )
    .execute();

  // Get number of tasks completed this week
  const completedTasksThisWeek = await db
    .select()
    .from(tasksTable)
    .where(
      and(
        eq(tasksTable.userId, user.id),
        gte(tasksTable.completedAt, startOfWeek(new Date()))
      )
    )
    .execute();

  return {
    newTasksCount: newTasksThisWeek.length,
    completedTasksCount: completedTasksThisWeek.length,
  };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const { newTasksCount, completedTasksCount } = loaderData as {
    newTasksCount: number;
    completedTasksCount: number;
  };

  return (
    <div className="h-full p-6">
      <h1 className="text-3xl mb-8 text-center">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Card for New Tasks */}
        <div className="bg-gray-800 shadow-lg rounded-lg p-6 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            {/* Icon for new tasks */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">New Tasks</h2>
          <p className="text-3xl font-bold">{newTasksCount}</p>
          <p className="mt-2 text-gray-500">This week</p>
        </div>

        {/* Card for Completed Tasks */}
        <div className="bg-gray-800 shadow-lg rounded-lg p-6 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            {/* Icon for completed tasks */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Completed Tasks</h2>
          <p className="text-3xl font-bold">{completedTasksCount}</p>
          <p className="mt-2 text-gray-500">This week</p>
        </div>
      </div>
    </div>
  );
}
