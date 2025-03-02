import { getUserFromSession, requireAuth } from "~/modules/auth.server";
import type { Route } from "./+types/dashboard";
import { db } from "~/db";
import { tasksTable } from "~/db/schema";
import { and, gte, eq } from "drizzle-orm";
import { startOfDay, subDays } from "date-fns";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Dashboard" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAuth(request);

  const user = await getUserFromSession(request);

  const userTasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.userId, user.id))
    .execute();

  const newTasksLast7Days = userTasks.filter(task => task.createdAt >= startOfDay(subDays(new Date(), 7)));
  const completedTasksLast7Days = userTasks.filter(task => task.completedAt != null && task.completedAt >= startOfDay(subDays(new Date(), 7)));

  const newTasksLast30Days = userTasks.filter(task => task.createdAt >= startOfDay(subDays(new Date(), 30)));
  const completedTasksLast30Days = userTasks.filter(task => task.completedAt != null && task.completedAt >= startOfDay(subDays(new Date(), 30)));

  return {
    newTasksLast7Days: newTasksLast7Days.length,
    completedTasksLast7Days: completedTasksLast7Days.length,
    newTasksLast30Days: newTasksLast30Days.length,
    completedTasksLast30Days: completedTasksLast30Days.length,
  };
}

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const {
    newTasksLast7Days,
    completedTasksLast7Days,
    newTasksLast30Days,
    completedTasksLast30Days,
  } = loaderData as {
    newTasksLast7Days: number;
    completedTasksLast7Days: number;
    newTasksLast30Days: number;
    completedTasksLast30Days: number;
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
          <p className="text-3xl font-bold">{newTasksLast7Days}</p>
          <p className="mt-2 text-gray-500">Last 7 days</p>
        </div>

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
          <p className="text-3xl font-bold">{newTasksLast30Days}</p>
          <p className="mt-2 text-gray-500">Last 30 days</p>
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
          <p className="text-3xl font-bold">{completedTasksLast7Days}</p>
          <p className="mt-2 text-gray-500">Last 7 days</p>
        </div>

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
          <p className="text-3xl font-bold">{completedTasksLast30Days}</p>
          <p className="mt-2 text-gray-500">Last 30 days</p>
        </div>
      </div>
    </div>
  );
}
