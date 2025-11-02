import { NavLink, type NavLinkProps } from "react-router"; // Corrected import path
import React from "react";
import CollapsedTooltip from "./CollapsedTooltip";

interface SidebarLinkProps extends NavLinkProps {
  label: string;
  onClick?: () => void;
  icon?: React.ElementType;
  isCollapsed?: boolean;
  to: NavLinkProps["to"]; // Ensure 'to' is part of the props
}

export default function SidebarLink({
  to,
  label,
  onClick,
  icon: Icon,
  isCollapsed,
  ...rest
}: SidebarLinkProps) {
  const navLink = (
    <NavLink
      to={to}
      onClick={onClick}
      className={(
        { isActive }: { isActive: boolean } // Added type for isActive
      ) =>
        `flex items-center px-3 py-2.5 rounded-lg text-base font-medium transition-all duration-150 group relative border-l-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800
        ${isCollapsed ? "justify-center" : ""} 
        ${
          isActive
            ? "bg-indigo-600 text-white shadow-md border-l-indigo-400 dark:bg-indigo-600 dark:text-white"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:scale-[1.02] border-l-transparent dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
        }`
      }
      {...rest}
      title={isCollapsed ? label : undefined}
    >
      {Icon && (
        <Icon
          className={`h-6 w-6 flex-shrink-0 ${isCollapsed ? "" : "mr-2.5"} transition-transform duration-150 group-hover:scale-110`}
          aria-hidden="true"
        />
      )}
      <span className={`${isCollapsed ? "sr-only" : ""} transition-opacity duration-150`}>{label}</span>
    </NavLink>
  );

  return (
    <CollapsedTooltip label={label} isCollapsed={isCollapsed || false}>
      {navLink}
    </CollapsedTooltip>
  );
}

// Update any references from principles to notes and add folder support if needed
