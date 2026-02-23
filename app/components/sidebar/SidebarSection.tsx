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
      className={`space-y-1 ${!isFirst ? "pt-4" : "pt-1"} ${isAccountSection ? "border-t border-gray-800 mt-4 pt-4" : ""}`}
    >
      {title && !isCollapsed && (
        <>
          <h3 className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500 select-none">
            {title}
          </h3>
          <div className="border-b border-gray-800 mx-2 mb-2" />
        </>
      )}
      {children}
    </div>
  );
}
