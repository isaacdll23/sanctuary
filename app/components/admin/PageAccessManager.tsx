import React, { useState } from "react";
import { useFetcher } from "react-router";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

// Available pages in the app
const APP_PAGES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "tasks", label: "Tasks" },
  { id: "finance", label: "Finance" },
  { id: "day-planner", label: "Day Planner" },
  { id: "notes", label: "Notes" },
  { id: "utilities/commands", label: "Utilities Commands" },
  { id: "settings", label: "Settings" },
];

type User = {
  id: number;
  username: string;
  email: string;
  passwordHash: string;
  role: string;
  allowedPages?: any;
  createdAt: Date;
};

type PageAccessManagerProps = {
  users: User[];
};

export default function PageAccessManager({ users }: PageAccessManagerProps) {
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const fetcher = useFetcher();

  // Toggle user expansion
  const toggleUserExpansion = (userId: number) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  // Handle checkbox change
  const handlePageAccessChange = (
    userId: number,
    pageId: string,
    isChecked: boolean
  ) => {
    fetcher.submit(
      {
        userId: userId.toString(),
        pageId,
        action: isChecked ? "grant" : "revoke",
        intent: "updatePageAccess",
      },
      { method: "post" }
    );
  };

  return (
    <section className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Page Access Management</h2>

      <div className="space-y-4">
        {users.map((user) => {
          const isExpanded = expandedUser === user.id;
          const allowedPages = user.allowedPages
            ? typeof user.allowedPages === "string"
              ? JSON.parse(user.allowedPages)
              : user.allowedPages
            : [];

          return (
            <div
              key={user.id}
              className="border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden"
            >
              {/* User header - clickable to expand */}
              <div
                className={`flex justify-between items-center p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/30 ${
                  isExpanded ? "bg-gray-50 dark:bg-gray-700/50" : ""
                }`}
                onClick={() => toggleUserExpansion(user.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-lg">{user.username}</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  {isExpanded ? (
                    <ChevronUpIcon className="h-5 w-5" />
                  ) : (
                    <ChevronDownIcon className="h-5 w-5" />
                  )}
                </div>
              </div>

              {/* Expanded content with page access controls */}
              {isExpanded && (
                <div className="p-4 pt-0 bg-gray-50 dark:bg-gray-700/20">
                  {/* Add gap above the grid without reintroducing the colored line */}
                  <div style={{ height: "0.75rem" }} />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {APP_PAGES.map((page) => {
                      // Admin users always have access to all pages
                      const isAdminUser = user.role === "admin";
                      const hasAccess =
                        isAdminUser || allowedPages.includes(page.id);

                      return (
                        <div key={page.id} className="flex items-center">
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={hasAccess}
                              disabled={isAdminUser || fetcher.state !== "idle"}
                              onChange={(e) =>
                                handlePageAccessChange(
                                  user.id,
                                  page.id,
                                  e.target.checked
                                )
                              }
                              className={`
                                form-checkbox h-5 w-5 rounded-md focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-700 focus:ring-blue-500
                                ${isAdminUser ? "opacity-60" : "opacity-100"}
                                ${
                                  hasAccess
                                    ? "text-blue-500 border-blue-500"
                                    : "text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-500"
                                }
                              `}
                            />
                            <span
                              className={`text-base ${
                                hasAccess
                                  ? "font-medium"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {page.label}
                            </span>
                            {isAdminUser && (
                              <span className="text-xs text-gray-500 dark:text-gray-500 ml-auto italic opacity-0 group-hover:opacity-100 transition-opacity">
                                (Always allowed)
                              </span>
                            )}
                          </label>
                        </div>
                      );
                    })}
                  </div>

                  {fetcher.state !== "idle" && (
                    <div className="mt-4 text-sm text-blue-400">
                      Updating permissions...
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
