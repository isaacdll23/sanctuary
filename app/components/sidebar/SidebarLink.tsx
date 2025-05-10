import { NavLink, type NavLinkProps } from 'react-router'; // Corrected import path
import React from 'react';

interface SidebarLinkProps extends NavLinkProps {
  label: string;
  onClick?: () => void;
  icon?: React.ElementType;
  isCollapsed?: boolean; 
  to: NavLinkProps['to']; // Ensure 'to' is part of the props
}

export default function SidebarLink({ to, label, onClick, icon: Icon, isCollapsed, ...rest }: SidebarLinkProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }: { isActive: boolean }) => // Added type for isActive
        `flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-150
        ${isCollapsed ? 'justify-center' : ''} 
        ${
          isActive
            ? 'bg-indigo-700 text-white' 
            : 'text-indigo-100 hover:bg-indigo-700 hover:text-white' 
        }`
      }
      {...rest}
      title={isCollapsed ? label : undefined} 
    >
      {Icon && <Icon className={`h-6 w-6 ${isCollapsed ? '' : 'mr-3'}`} aria-hidden="true" />} 
      <span className={`${isCollapsed ? 'sr-only' : ''}`}>{label}</span> 
    </NavLink>
  );
}
