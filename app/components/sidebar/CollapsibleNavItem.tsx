import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { NavLink } from "react-router";
import SidebarLink from "./SidebarLink";
import CollapsedTooltip from "./CollapsedTooltip";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isMenuOpen]);

  const handleChildClick = () => {
    setIsMenuOpen(false);
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className="space-y-1 relative">
      {/* Parent Item with Tooltip for collapsed state */}
      <CollapsedTooltip label={parentLabel} isCollapsed={isCollapsed}>
        <button
          ref={buttonRef}
          onClick={isCollapsed ? toggleMenu : toggleExpand}
          className="flex items-center w-full px-3 py-2.5 rounded-lg text-base font-medium transition-all duration-150 group relative border-l-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:scale-[1.02] border-l-transparent dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
          title={isCollapsed ? parentLabel : undefined}
          aria-expanded={isCollapsed ? isMenuOpen : isExpanded}
          aria-label={
            isCollapsed
              ? `Open ${parentLabel} menu`
              : `${isExpanded ? "Collapse" : "Expand"} ${parentLabel}`
          }
          aria-haspopup={isCollapsed ? "menu" : undefined}
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
      </CollapsedTooltip>

      {/* Child Items - Show when expanded and not collapsed */}
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

      {/* Dropdown menu when sidebar is collapsed */}
      {isCollapsed && isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute left-14 top-0 z-50 mt-0 min-w-max bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 py-1 pointer-events-auto"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="collapsed-menu-button"
        >
          {children.map((child) => {
            const ChildIcon = child.icon;
            return (
              <NavLink
                key={child.to}
                to={child.to}
                onClick={handleChildClick}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  }`
                }
                role="menuitem"
              >
                {ChildIcon && <ChildIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />}
                <span>{child.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
