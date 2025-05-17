import { redirect } from "react-router";
import { requireAuth, getUserFromSession } from "~/modules/auth.server";
import { db } from "~/db";
import { usersTable } from "~/db/schema";
import type { Route } from "./+types/admin";
import { handlePageAccessAction } from "~/modules/services/PageAccessService";
import PageAccessManager from "~/components/admin/PageAccessManager";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Admin Portal" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  // First ensure the user is authenticated
  await requireAuth(request);
  
  // Then get the user
  const user = await getUserFromSession(request);
  
  // Check if the user has admin role
  if (user.role !== "admin") {
    // Redirect non-admin users
    return redirect("/dashboard");
  }
  
  // Fetch all users for the admin dashboard
  const users = await db
    .select()
    .from(usersTable)
    .orderBy(usersTable.username);
  
  return { users, currentUser: user };
}

export async function action({ request }: Route.ActionArgs) {
  // Ensure the user is authenticated and has admin role
  await requireAuth(request);
  const currentUser = await getUserFromSession(request);
  if (currentUser.role !== 'admin') {
    throw new Response('Unauthorized', { status: 403 });
  }
  
  // Handle page access actions (grant/revoke permissions)
  return handlePageAccessAction(request);
}

export default function Admin({ loaderData }: Route.ComponentProps) {
  const { users, currentUser } = loaderData;
  
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 md:mb-0">
              Admin Portal
            </h1>
          </div>
          <p className="text-slate-400 text-lg max-w-3xl">
            Manage users, monitor system status, and configure application settings.
          </p>
        </header>

        <main className="grid gap-8">
          {/* Users section */}
          <section className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">User Management</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="text-left p-4 rounded-tl-lg">Username</th>
                    <th className="text-left p-4">Email</th>
                    <th className="text-left p-4">Role</th>
                    <th className="text-left p-4">Created</th>
                    <th className="text-left p-4 rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-slate-700/50">
                      <td className="p-4">{user.username}</td>
                      <td className="p-4">{user.email}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-sm">
                            View
                          </button>
                          {/* Additional action buttons would go here */}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>          {/* System Status section */}
          <section className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">System Status</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-slate-700/50 rounded-xl p-4">
                <h3 className="text-lg font-medium mb-2">User Count</h3>
                <p className="text-3xl font-bold">{users.length}</p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-4">
                <h3 className="text-lg font-medium mb-2">Server Status</h3>
                <div className="flex items-center">
                  <span className="h-3 w-3 bg-green-500 rounded-full mr-2"></span>
                  <span>Online</span>
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-4">
                <h3 className="text-lg font-medium mb-2">Last Backup</h3>
                <p>Today at 04:00 AM</p>
              </div>
            </div>
          </section>

          {/* Page Access Management section */}
          <PageAccessManager users={users} />
        </main>
      </div>
    </div>
  );
}
