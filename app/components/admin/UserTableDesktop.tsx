import React from "react";
import UserRow from "./UserRow";

interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  createdAt: Date | string;
}

interface UserTableDesktopProps {
  users: User[];
  onEditUser: (user: User) => void;
}

export default function UserTableDesktop({
  users,
  onEditUser,
}: UserTableDesktopProps) {
  return (
    <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table
        className="w-full border-collapse bg-white dark:bg-gray-800"
        role="table"
        aria-label="User management table"
      >
        <caption className="sr-only">List of all registered users</caption>
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <th
              scope="col"
              className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-400"
            >
              Username
            </th>
            <th
              scope="col"
              className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-400"
            >
              Email
            </th>
            <th
              scope="col"
              className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-400"
            >
              Role
            </th>
            <th
              scope="col"
              className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-400"
            >
              Created
            </th>
            <th
              scope="col"
              className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-400"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              onEdit={onEditUser}
              isMobile={false}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
