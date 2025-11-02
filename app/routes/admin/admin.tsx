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
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { useFetcher } from "react-router";

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
  const { bulkEncryptAllNotes } = await import(
    "~/modules/services/NoteService"
  );

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
  } else if (intent === "bulkEncryptNotes") {
    return bulkEncryptAllNotes();
  }

  return { success: false, message: "Unknown action" };
});

export default function Admin() {
  const { users, currentUser } = useLoaderData<{
    users: any[];
    currentUser: any;
  }>();
  const encryptionFetcher = useFetcher<any>();

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

  const handleBulkEncryptNotes = () => {
    if (
      window.confirm(
        "This will encrypt all unencrypted notes in the system. This process may take a few moments. Continue?"
      )
    ) {
      encryptionFetcher.submit(
        { intent: "bulkEncryptNotes" },
        { method: "post", action: "/admin" }
      );
    }
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

          {/* Bulk Encryption Section */}
          <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 md:p-8 hover:shadow-md transition-all duration-150">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Note Encryption
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Encrypt all unencrypted notes in the system for enhanced security. This process is one-way and permanent.
                </p>
              </div>
              <button
                onClick={handleBulkEncryptNotes}
                disabled={encryptionFetcher.state === "submitting"}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 min-h-[40px]"
              >
                <LockClosedIcon className="w-5 h-5" />
                {encryptionFetcher.state === "submitting"
                  ? "Encrypting..."
                  : "Encrypt Now"}
              </button>
            </div>

            {/* Encryption Status Message */}
            {encryptionFetcher.data && (
              <div
                className={`mt-4 p-4 rounded-lg ${
                  encryptionFetcher.data.success
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    encryptionFetcher.data.success
                      ? "text-green-800 dark:text-green-200"
                      : "text-red-800 dark:text-red-200"
                  }`}
                >
                  {encryptionFetcher.data.message}
                </p>
                {encryptionFetcher.data.encrypted !== undefined && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    Encrypted: {encryptionFetcher.data.encrypted} | Failed:{" "}
                    {encryptionFetcher.data.failed} | Total:{" "}
                    {encryptionFetcher.data.total}
                  </p>
                )}
                {encryptionFetcher.data.failedNotes &&
                  encryptionFetcher.data.failedNotes.length > 0 && (
                    <details className="mt-3 text-xs">
                      <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                        View failed notes ({encryptionFetcher.data.failedNotes.length})
                      </summary>
                      <ul className="mt-2 space-y-1 pl-4 list-disc text-gray-600 dark:text-gray-400">
                        {encryptionFetcher.data.failedNotes.map(
                          (failedNote: any) => (
                            <li key={failedNote.id}>
                              Note {failedNote.id}: {failedNote.error}
                            </li>
                          )
                        )}
                      </ul>
                    </details>
                  )}
              </div>
            )}
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
