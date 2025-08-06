import React, { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import { useToast } from "~/hooks/useToast";
import { XMarkIcon } from "@heroicons/react/24/outline";

type User = {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: Date;
};

type UserEditModalProps = {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: number;
};

export default function UserEditModal({
  user,
  isOpen,
  onClose,
  currentUserId,
}: UserEditModalProps) {
  const fetcher = useFetcher();
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "",
    newPassword: "",
  });

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        role: user.role,
        newPassword: "",
      });
    }
  }, [user]);

  // Close modal on successful submission and show toast
  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      if (fetcher.data.success) {
        addToast(fetcher.data.message, "success");
        onClose();
      } else {
        addToast(fetcher.data.message, "error");
      }
    }
  }, [fetcher.data, fetcher.state, onClose, addToast]);

  if (!isOpen || !user) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (intent: string) => {
    const submitData: any = {
      intent,
      userId: user.id.toString(),
    };

    if (intent === "editUser") {
      submitData.username = formData.username;
      submitData.email = formData.email;
    } else if (intent === "changeRole") {
      submitData.role = formData.role;
    } else if (intent === "resetPassword") {
      submitData.newPassword = formData.newPassword;
    }

    fetcher.submit(submitData, { method: "post" });
  };

  const handleDelete = () => {
    if (
      window.confirm(
        `Are you sure you want to delete user "${user.username}"? This action cannot be undone.`
      )
    ) {
      fetcher.submit(
        {
          intent: "deleteUser",
          userId: user.id.toString(),
        },
        { method: "post" }
      );
    }
  };

  const isCurrentUser = user.id === currentUserId;
  const isSubmitting = fetcher.state === "submitting";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-700 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-300 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Edit User: {user.username}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Basic Information
            </h3>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleSubmit("editUser")}
                disabled={isSubmitting || !formData.username || !formData.email}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 rounded-md text-white font-medium transition-colors"
              >
                {isSubmitting ? "Updating..." : "Update Info"}
              </button>
            </div>
          </div>

          {/* Role Management */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Role Management
            </h3>

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting || isCurrentUser}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              {isCurrentUser && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  You cannot change your own role
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleSubmit("changeRole")}
                disabled={
                  isSubmitting || isCurrentUser || formData.role === user.role
                }
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 rounded-md text-white font-medium transition-colors"
              >
                {isSubmitting ? "Updating..." : "Update Role"}
              </button>
            </div>
          </div>

          {/* Password Reset */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Password Reset
            </h3>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                placeholder="Enter new password (min 6 characters)"
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleSubmit("resetPassword")}
                disabled={
                  isSubmitting ||
                  !formData.newPassword ||
                  formData.newPassword.length < 6
                }
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 disabled:opacity-50 rounded-md text-white font-medium transition-colors"
              >
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="space-y-4 border-t border-gray-300 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-300 text-sm mb-3">
                Permanently delete this user account. This action cannot be
                undone.
              </p>
              <button
                onClick={handleDelete}
                disabled={isSubmitting || isCurrentUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 rounded-md text-white font-medium transition-colors"
              >
                {isSubmitting ? "Deleting..." : "Delete User"}
              </button>
              {isCurrentUser && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  You cannot delete your own account
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
