import React from "react";

interface UserTableHeaderProps {
  title: string;
  description?: string;
}

export default function UserTableHeader({
  title,
  description,
}: UserTableHeaderProps) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {description}
        </p>
      )}
    </div>
  );
}
