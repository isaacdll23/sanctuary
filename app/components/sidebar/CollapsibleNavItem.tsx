import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import SidebarLink from "./SidebarLink";
import React from "react";

interface ChildItem {
  to: string;
  label: string;
  icon: React.ElementType;
  pageId: string;
}

interface CollapsibleNavItemProps {
  parentLabel: string;
  parentIcon: React.ElementType;
  children: ChildItem[];
  isCollapsed?: boolean;
  onClick?: () => void;
}

export default function CollapsibleNavItem({
  parentLabel,
  parentIcon: ParentIcon,
  children,
  isCollapsed = false,
  onClick,
}: CollapsibleNavItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="space-y-1">
      {/* Parent Item */}
      <button
        onClick={toggleExpand}
        className="flex items-center w-full px-3 py-2.5 rounded-lg text-base font-medium transition-all duration-150 group relative border-l-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:scale-[1.02] border-l-transparent dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
        title={isCollapsed ? parentLabel : undefined}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? "Collapse" : "Expand"} ${parentLabel}`}
      >
        {ParentIcon && (
          <ParentIcon
            className={`h-6 w-6 flex-shrink-0 ${isCollapsed ? "" : "mr-2.5"} transition-transform duration-150 group-hover:scale-110`}
            aria-hidden="true"
          />
        )}
        <span
          className={`flex-1 text-left ${isCollapsed ? "sr-only" : ""} transition-opacity duration-150`}
        >
          {parentLabel}
        </span>
        {!isCollapsed && (
          <ChevronDownIcon
            className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 ${
              isExpanded ? "rotate-0" : "-rotate-90"
            }`}
            aria-hidden="true"
          />
        )}
      </button>

      {/* Child Items - Only show when expanded and not collapsed */}
      {isExpanded && !isCollapsed && (
        <div className="ml-4 space-y-1 border-l-2 border-gray-300 dark:border-gray-600 pl-0">
          {children.map((child) => (
            <SidebarLink
              key={child.to}
              to={child.to}
              label={child.label}
              icon={child.icon}
              isCollapsed={false}
              onClick={onClick}
              className="!px-3 !py-2 text-sm"
            />
          ))}
        </div>
      )}

      {/* Show only parent when sidebar is collapsed */}
      {isCollapsed && (
        <div
          className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400"
          title={`${parentLabel} (${children.length} items)`}
        >
          {children.length}
        </div>
      )}
    </div>
  );
}
