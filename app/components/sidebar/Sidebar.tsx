import { useState } from "react";
import SidebarLink from "./SidebarLink";
import {
  HomeIcon,
  UserCircleIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ArrowRightEndOnRectangleIcon,
  ArrowLeftEndOnRectangleIcon,
  CommandLineIcon,
  BookOpenIcon,
  Cog8ToothIcon,
} from "@heroicons/react/24/outline";

interface SidebarProps {
  isAuthenticated: boolean;
  isAdmin?: boolean;
  accessiblePages?: string[];
}

const navItemsUnauth = [
  { to: "/auth/login", label: "Login", icon: ArrowRightEndOnRectangleIcon },
  { to: "/auth/register", label: "Register", icon: UserCircleIcon },
];

const navItemsAuth = [
  { to: "/dashboard", label: "Dashboard", icon: HomeIcon, pageId: "dashboard" },
  {
    to: "/finance",
    label: "Finance",
    icon: CurrencyDollarIcon,
    pageId: "finance",
  },
  {
    to: "/tasks",
    label: "Tasks",
    icon: ClipboardDocumentListIcon,
    pageId: "tasks",
  },
  {
    to: "/notes",
    label: "Notes",
    icon: BookOpenIcon,
    pageId: "notes",
  },
  {
    to: "/utilities/commands",
    label: "Commands",
    icon: CommandLineIcon,
    pageId: "utilities/commands",
  },
  {
    to: "/profile",
    label: "Profile",
    icon: UserCircleIcon,
    pageId: "profile",
  },
  {
    to: "/auth/logout",
    label: "Logout",
    icon: ArrowLeftEndOnRectangleIcon,
    pageId: "logout",
  },
];

// Admin-only navigation items
const navItemsAdmin = [
  { to: "/admin", label: "Admin", icon: Cog8ToothIcon, pageId: "admin" },
];

export default function Sidebar({
  isAuthenticated,
  isAdmin = false,
  accessiblePages = [],
}: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false); // New state for desktop collapse

  function toggleMobileMenu() {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  }

  function toggleDesktopCollapse() {
    setIsDesktopCollapsed(!isDesktopCollapsed);
  }

  // Determine which nav items to show based on auth status, admin role, and page access
  let navItems = isAuthenticated
    ? navItemsAuth.filter((item) => {
        // Special pages like logout are always accessible
        if (item.pageId === "logout") return true;

        // Check if the page is in the accessible pages list
        return accessiblePages.includes(item.pageId);
      })
    : navItemsUnauth;

  // Add admin nav items if the user is an admin (admins always have access to admin pages)
  if (isAuthenticated && isAdmin) {
    navItems = [...navItemsAdmin, ...navItems];
  }

  return (
    <>
      {/* Hamburger Menu - Mobile */}
      <button
        onClick={toggleMobileMenu}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md text-indigo-200 hover:text-white hover:bg-indigo-600 dark:text-indigo-300 dark:hover:text-white dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
        aria-controls="sidebar"
        aria-expanded={isMobileMenuOpen}
        aria-label="Open sidebar"
      >
        <svg
          className="h-6 w-6"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`fixed top-0 left-0 z-40 h-screen bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-white border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 ${
          isDesktopCollapsed ? "md:w-20" : "md:w-64" // Dynamic width for desktop
        } w-64 md:sticky md:flex md:flex-col`}
      >
        {/* Sidebar Header (for mobile close and desktop collapse) */}
        <div
          className={`flex items-center p-4 h-16 ${
            isDesktopCollapsed && !isMobileMenuOpen
              ? "md:justify-center"
              : "justify-between"
          }`}
        >
          {/* Logo or Title - visible when expanded on desktop, or on mobile */}
          <span
            className={`text-xl font-semibold ${
              isDesktopCollapsed && !isMobileMenuOpen ? "md:hidden" : ""
            }`}
          >
            {!isMobileMenuOpen ? "Sanctuary" : "Menu"}
          </span>

          {/* Mobile Close Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-md text-indigo-600 hover:text-indigo-800 hover:bg-gray-100 dark:text-indigo-300 dark:hover:text-white dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            aria-label="Close sidebar"
          >
            <svg
              className="h-6 w-6"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Desktop Collapse/Expand Button */}
          <button
            onClick={toggleDesktopCollapse}
            className="hidden md:block p-2 rounded-md text-indigo-600 hover:text-indigo-800 hover:bg-gray-100 dark:text-indigo-300 dark:hover:text-white dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            aria-label={
              isDesktopCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            aria-expanded={!isDesktopCollapsed}
          >
            {isDesktopCollapsed ? (
              <ChevronDoubleRightIcon className="h-6 w-6" />
            ) : (
              <ChevronDoubleLeftIcon className="h-6 w-6" />
            )}
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <SidebarLink
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              isCollapsed={isDesktopCollapsed && !isMobileMenuOpen} // Pass collapsed state
              onClick={isMobileMenuOpen ? toggleMobileMenu : undefined}
            />
          ))}
        </nav>
      </aside>
      {/* Overlay for mobile when sidebar is open */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={toggleMobileMenu}
          aria-hidden="true"
        ></div>
      )}
    </>
  );
}
