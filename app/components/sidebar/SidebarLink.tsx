import { NavLink, type NavLinkProps } from "react-router";
import React from "react";
import CollapsedTooltip from "./CollapsedTooltip";
import {
  getSidebarItemClasses,
  getSidebarItemIconClasses,
} from "./sidebarStyles";

interface SidebarLinkProps extends NavLinkProps {
  label: string;
  onClick?: () => void;
  icon?: React.ElementType;
  isCollapsed?: boolean;
  to: NavLinkProps["to"];
  className?: string;
}

export default function SidebarLink({
  to,
  label,
  onClick,
  icon: Icon,
  isCollapsed,
  className,
  ...rest
}: SidebarLinkProps) {
  const navLink = (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }: { isActive: boolean }) =>
        getSidebarItemClasses({ isActive, isCollapsed, className })
      }
      {...rest}
      title={isCollapsed ? label : undefined}
    >
      {Icon && (
        <Icon
          className={getSidebarItemIconClasses(isCollapsed)}
          aria-hidden="true"
        />
      )}
      <span
        className={`${isCollapsed ? "sr-only" : ""} transition-opacity duration-150`}
      >
        {label}
      </span>
    </NavLink>
  );

  return (
    <CollapsedTooltip label={label} isCollapsed={isCollapsed || false}>
      {navLink}
    </CollapsedTooltip>
  );
}
