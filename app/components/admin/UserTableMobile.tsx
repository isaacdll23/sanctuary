import React from "react";
import UserRow from "./UserRow";

interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  createdAt: Date | string;
}

interface UserTableMobileProps {
  users: User[];
  onEditUser: (user: User) => void;
}

export default function UserTableMobile({
  users,
  onEditUser,
}: UserTableMobileProps) {
  return (
    <div className="md:hidden space-y-3">
      {users.length > 0 ? (
        users.map((user) => (
          <UserRow
            key={user.id}
            user={user}
            onEdit={onEditUser}
            isMobile={true}
          />
        ))
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-gray-600 dark:text-gray-400">No users found</p>
        </div>
      )}
    </div>
  );
}
