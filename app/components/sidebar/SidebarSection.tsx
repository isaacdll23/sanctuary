import React from "react";

interface SidebarSectionProps {
  title?: string;
  isCollapsed?: boolean;
  isFirst?: boolean;
  isAccountSection?: boolean;
  children: React.ReactNode;
}

export default function SidebarSection({
  title,
  isCollapsed,
  isFirst = false,
  isAccountSection = false,
  children,
}: SidebarSectionProps) {
  return (
    <div
      className={`space-y-1 ${!isFirst ? "pt-5" : "pt-2"} ${isAccountSection ? "border-t-2 border-gray-300 dark:border-gray-700 mt-5 pt-5" : ""}`}
    >
      {title && !isCollapsed && (
        <>
          <h3 className="px-3 py-2 text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400 select-none">
            {title}
          </h3>
          <div className="border-b border-gray-300 dark:border-gray-700 mx-2 mb-3 opacity-50" />
        </>
      )}
      {children}
    </div>
  );
}
