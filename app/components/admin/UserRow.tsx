import React from "react";
import { PencilIcon } from "@heroicons/react/24/outline";

interface UserRowProps {
  user: {
    id: string;
    username: string;
    email: string;
    role: "admin" | "user";
    createdAt: Date | string;
  };
  onEdit: (user: any) => void;
  isMobile?: boolean;
}

export default function UserRow({ user, onEdit, isMobile = false }: UserRowProps) {
  const createdDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const isAdmin = user.role === "admin";

  if (isMobile) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors duration-150">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
              {user.username}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
              {user.email}
            </p>
          </div>
          <span
            className={`flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
              isAdmin
                ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
            }`}
            role="status"
            aria-label={`Role: ${user.role}`}
          >
            {user.role}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Created {createdDate}
          </p>
          <button
            onClick={() => onEdit(user)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-medium rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 min-h-[40px]"
            aria-label={`Edit ${user.username}`}
          >
            <PencilIcon className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Edit</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 focus-within:bg-gray-50 dark:focus-within:bg-gray-700/50">
      <td className="px-4 py-3.5 text-sm font-medium text-gray-900 dark:text-white">
        {user.username}
      </td>
      <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400">
        {user.email}
      </td>
      <td className="px-4 py-3.5">
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            isAdmin
              ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
              : "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
          }`}
          role="status"
          aria-label={`Role: ${user.role}`}
        >
          {user.role}
        </span>
      </td>
      <td className="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400">
        {createdDate}
      </td>
      <td className="px-4 py-3.5 text-sm">
        <button
          onClick={() => onEdit(user)}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-medium rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 min-h-[40px]"
          aria-label={`Edit ${user.username}`}
        >
          <PencilIcon className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Edit</span>
        </button>
      </td>
    </tr>
  );
}
