import { useLoaderData, useFetcher } from "react-router";
import { useState } from "react";
import PageAccessManager from "~/components/admin/PageAccessManager";
import UserEditModal from "~/components/admin/UserEditModal";
import {
  adminOnlyLoader,
  adminOnlyAction,
} from "~/modules/middleware/adminOnly";
import {
  UsersIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

// Use React Router v7's auto-generated types (no need for manual import)

export function meta() {
  return [{ title: "Admin Portal" }];
}

// Use the adminOnlyLoader middleware to protect this route
export const loader = adminOnlyLoader(async (adminUser, request) => {
  // Server-only imports (React Router v7 will automatically strip these out in the client bundle)
  const { db } = await import("~/db");
  const { usersTable } = await import("~/db/schema");

  // Fetch all users for the admin dashboard
  const users = await db.select().from(usersTable).orderBy(usersTable.username);

  return { users, currentUser: adminUser };
});

// Use the adminOnlyAction middleware to protect this action
export const action = adminOnlyAction(async (adminUser, request) => {
  // Server-only imports (React Router v7 will automatically strip these out in the client bundle)
  const { handlePageAccessAction } = await import(
    "~/modules/services/PageAccessService"
  );
  const { handleUserManagementAction } = await import(
    "~/modules/services/UserManagementService"
  );
  const { sendEmail } = await import("~/modules/services/NotificationService");

  const formData = await request.formData();
  const intent = formData.get("intent");

  // Route to appropriate service based on intent
  if (intent === "updatePageAccess") {
    return handlePageAccessAction(request, formData);
  } else if (
    ["editUser", "changeRole", "deleteUser", "resetPassword"].includes(
      intent as string
    )
  ) {
    return handleUserManagementAction(request, formData);
  } else if (intent === "sendTestEmail") {
    const email = formData.get("email") as string;
    if (!email) return { success: false, message: "Email is required." };
    const result = await sendEmail({
      to: email,
      subject: "Sanctuary Test Email",
      html: `<p>This is a test email from Sanctuary Admin Portal.</p>`,
    });
    return result;
  }

  return { success: false, message: "Unknown action" };
});

export default function Admin() {
  const { users, currentUser } = useLoaderData<{
    users: any[];
    currentUser: any;
  }>();

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fetcher = useFetcher();
  const [testEmail, setTestEmail] = useState("");

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 md:mb-0">
              Admin Portal
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-3xl">
            Manage users, monitor system status, and configure application
            settings.
          </p>
        </header>

        <main className="grid gap-8">
          {/* Test Email Section */}
          <section className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Send Test Email</h2>
            <fetcher.Form
              method="post"
              className="flex flex-col md:flex-row gap-3 items-start md:items-end"
            >
              <input type="hidden" name="intent" value="sendTestEmail" />
              <div>
                <label
                  htmlFor="testEmail"
                  className="block text-gray-700 dark:text-gray-300 font-medium mb-1"
                >
                  Email Address
                </label>
                <input
                  id="testEmail"
                  name="email"
                  type="email"
                  required
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="bg-slate-700 border border-slate-600 text-slate-100 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors w-72"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg px-6 py-2 transition-colors mt-2 md:mt-0"
                disabled={fetcher.state === "submitting"}
              >
                {fetcher.state === "submitting"
                  ? "Sending..."
                  : "Send Test Email"}
              </button>
            </fetcher.Form>
            {fetcher.data && (
              <div
                className={`mt-3 text-sm ${
                  fetcher.data.success ? "text-green-400" : "text-red-400"
                }`}
              >
                {fetcher.data.success
                  ? "Test email sent!"
                  : `Error: ${
                      fetcher.data.error?.message || fetcher.data.message
                    }`}
              </div>
            )}
          </section>
          {/* Admin Stats */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
                  <UsersIcon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Users</p>
                  <p className="text-2xl font-bold text-white">
                    {users.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
                  <ShieldCheckIcon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Admins</p>
                  <p className="text-2xl font-bold text-white">
                    {users.filter((user) => user.role === "admin").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/20 text-green-400">
                  <UserIcon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Regular Users</p>
                  <p className="text-2xl font-bold text-white">
                    {users.filter((user) => user.role === "user").length}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Users section */}
          <section className="bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6">User Management</h2>
            {/* Responsive user list: table on md+, cards on mobile */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full border-collapse" aria-label="User list">
                <caption className="sr-only">List of users</caption>
                <thead className="bg-slate-900/50">
                  <tr>
                    <th scope="col" className="text-left p-4 rounded-tl-lg">
                      Username
                    </th>
                    <th scope="col" className="text-left p-4">
                      Email
                    </th>
                    <th scope="col" className="text-left p-4">
                      Role
                    </th>
                    <th scope="col" className="text-left p-4">
                      Created
                    </th>
                    <th scope="col" className="text-left p-4 rounded-tr-lg">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {users.map((user: any) => (
                    <tr key={user.id} className="hover:bg-slate-700/50">
                      <td className="p-4">{user.username}</td>
                      <td className="p-4">{user.email}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                            user.role === "admin"
                              ? "bg-purple-200 text-purple-900"
                              : "bg-blue-200 text-blue-900"
                          }`}
                          tabIndex={0}
                          aria-label={`Role: ${user.role}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="px-4 py-2 min-w-[44px] min-h-[44px] bg-blue-600 hover:bg-blue-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            aria-label={`Edit ${user.username}`}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile user cards */}
            <div className="md:hidden space-y-4">
              {users.map((user: any) => (
                <div
                  key={user.id}
                  className="bg-slate-900/60 rounded-xl p-4 flex flex-col gap-2 shadow border border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg">
                      {user.username}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ${
                        user.role === "admin"
                          ? "bg-purple-200 text-purple-900"
                          : "bg-blue-200 text-blue-900"
                      }`}
                      tabIndex={0}
                      aria-label={`Role: ${user.role}`}
                    >
                      {user.role}
                    </span>
                  </div>
                  <div className="text-slate-400 text-sm">{user.email}</div>
                  <div className="text-slate-400 text-xs">
                    Created: {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="px-4 py-2 min-w-[44px] min-h-[44px] bg-blue-600 hover:bg-blue-700 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full transition-colors"
                      aria-label={`Edit ${user.username}`}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Page Access Management section */}
          <PageAccessManager users={users} />
        </main>

        {/* User Edit Modal */}
        <UserEditModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={closeModal}
          currentUserId={currentUser.id}
        />
      </div>
    </div>
  );
}
