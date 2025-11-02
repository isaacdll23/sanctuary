import { useLoaderData } from "react-router";
import { useState } from "react";
import PageAccessManager from "~/components/admin/PageAccessManager";
import UserEditModal from "~/components/admin/UserEditModal";
import StatCard from "~/components/admin/StatCard";
import EmailForm from "~/components/admin/EmailForm";
import UserTableHeader from "~/components/admin/UserTableHeader";
import UserTableDesktop from "~/components/admin/UserTableDesktop";
import UserTableMobile from "~/components/admin/UserTableMobile";
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

  const adminCount = users.filter((user) => user.role === "admin").length;
  const regularUserCount = users.filter((user) => user.role === "user").length;

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Header Section */}
        <header className="mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 text-gray-900 dark:text-white">
            Admin Portal
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
            Manage users, configure access permissions, and administer the
            Sanctuary platform.
          </p>
        </header>

        <main className="space-y-8">
          {/* Quick Actions & Email Utilities */}
          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 md:p-8 hover:shadow-md transition-all duration-150">
            <EmailForm />
          </section>

          {/* Stats Section */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
              System Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <StatCard
                icon={UsersIcon}
                label="Total Users"
                value={users.length}
                description={`${adminCount} admin${adminCount !== 1 ? "s" : ""}`}
              />
              <StatCard
                icon={ShieldCheckIcon}
                label="Administrators"
                value={adminCount}
                description="Full system access"
              />
              <StatCard
                icon={UserIcon}
                label="Regular Users"
                value={regularUserCount}
                description="Limited access"
              />
            </div>
          </section>

          {/* User Management Section */}
          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 md:p-8 hover:shadow-md transition-all duration-150">
            <UserTableHeader
              title="User Management"
              description={`${users.length} registered user${users.length !== 1 ? "s" : ""}`}
            />
            <UserTableDesktop users={users} onEditUser={handleEditUser} />
            <UserTableMobile users={users} onEditUser={handleEditUser} />
          </section>

          {/* Page Access Management Section */}
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
