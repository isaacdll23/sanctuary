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
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 md:mb-12 text-center md:text-left">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-600">
              Dashboard
            </span>
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto md:mx-0">
            Your personal overview with stats and insights.
          </p>
        </header>

        {/* Stats Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-6 text-slate-300 border-b border-slate-800 pb-2">
            Task Performance Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* New Tasks - 7 Days */}
            <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-xl p-6 hover:shadow-indigo-500/10 hover:border-slate-600 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
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
                <div>
                  <p className="text-sm text-slate-400">New Tasks</p>
                  <div className="flex items-end gap-1">
                    <p className="text-3xl font-bold text-white">{newTasksLast7Days}</p>
                    <p className="text-xs text-slate-500 mb-1">last 7 days</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Completed Tasks - 7 Days */}
            <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-xl p-6 hover:shadow-emerald-500/10 hover:border-slate-600 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
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
                <div>
                  <p className="text-sm text-slate-400">Completed Tasks</p>
                  <div className="flex items-end gap-1">
                    <p className="text-3xl font-bold text-white">{completedTasksLast7Days}</p>
                    <p className="text-xs text-slate-500 mb-1">last 7 days</p>
                  </div>
                </div>
              </div>
            </div>

            {/* New Tasks - 30 Days */}
            <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-xl p-6 hover:shadow-indigo-500/10 hover:border-slate-600 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
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
                <div>
                  <p className="text-sm text-slate-400">New Tasks</p>
                  <div className="flex items-end gap-1">
                    <p className="text-3xl font-bold text-white">{newTasksLast30Days}</p>
                    <p className="text-xs text-slate-500 mb-1">last 30 days</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Completed Tasks - 30 Days */}
            <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-xl p-6 hover:shadow-emerald-500/10 hover:border-slate-600 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
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
                <div>
                  <p className="text-sm text-slate-400">Completed Tasks</p>
                  <div className="flex items-end gap-1">
                    <p className="text-3xl font-bold text-white">{completedTasksLast30Days}</p>
                    <p className="text-xs text-slate-500 mb-1">last 30 days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Performance Metrics */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Completion Rate Card */}
          <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-200 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-purple-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              Task Completion Rate
            </h3>
            <div>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-400">Last 7 Days</span>
                  <span className="text-sm font-medium text-indigo-400">
                    {newTasksLast7Days === 0 ? 0 : Math.round((completedTasksLast7Days / newTasksLast7Days) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                    style={{ width: `${newTasksLast7Days === 0 ? 0 : Math.min(100, Math.round((completedTasksLast7Days / newTasksLast7Days) * 100))}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-400">Last 30 Days</span>
                  <span className="text-sm font-medium text-indigo-400">
                    {newTasksLast30Days === 0 ? 0 : Math.round((completedTasksLast30Days / newTasksLast30Days) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                    style={{ width: `${newTasksLast30Days === 0 ? 0 : Math.min(100, Math.round((completedTasksLast30Days / newTasksLast30Days) * 100))}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Productivity Insights */}
          <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-200 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
              </svg>
              Productivity Insights
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                <div>
                  <p className="text-sm text-slate-300">Daily Task Completion</p>
                  <p className="text-xs text-slate-400">Average over 30 days</p>
                </div>
                <div className="text-xl font-semibold text-white">
                  {(completedTasksLast30Days / 30).toFixed(1)}
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                <div>
                  <p className="text-sm text-slate-300">Weekly Task Creation</p>
                  <p className="text-xs text-slate-400">Average over 30 days</p>
                </div>
                <div className="text-xl font-semibold text-white">
                  {(newTasksLast30Days / 4.29).toFixed(1)}
                </div>
              </div>
              
              <p className="text-sm text-slate-400 italic mt-4">
                {completedTasksLast7Days > completedTasksLast7Days / 4 ? 
                  "Your productivity is trending upward this week! Keep up the great work." :
                  "Focus on completing more tasks to boost your productivity metrics."
                }
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
