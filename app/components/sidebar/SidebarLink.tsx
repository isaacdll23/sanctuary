import { NavLink, type NavLinkProps } from "react-router"; // Corrected import path
import React from "react";

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
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={(
        { isActive }: { isActive: boolean } // Added type for isActive
      ) =>
        `flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-150
        ${isCollapsed ? "justify-center" : ""} 
        ${
          isActive
            ? "bg-indigo-600 text-white dark:bg-indigo-600 dark:text-white"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
        }`
      }
      {...rest}
      title={isCollapsed ? label : undefined}
    >
      {Icon && (
        <Icon
          className={`h-6 w-6 ${isCollapsed ? "" : "mr-3"}`}
          aria-hidden="true"
        />
      )}
      <span className={`${isCollapsed ? "sr-only" : ""}`}>{label}</span>
    </NavLink>
  );
}

// Update any references from principles to notes and add folder support if needed
