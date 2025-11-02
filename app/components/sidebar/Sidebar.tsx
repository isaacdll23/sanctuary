import { useState } from "react";
import SidebarLink from "./SidebarLink";
import SidebarSection from "./SidebarSection";
import CollapsibleNavItem from "./CollapsibleNavItem";
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
  CheckCircleIcon,
  CalendarIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
} from "@heroicons/react/24/outline";

interface SidebarProps {
  isAuthenticated: boolean;
  isAdmin?: boolean;
  accessiblePages?: string[];
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  pageId: string;
  children?: NavItem[]; // Support for nested child items
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navItemsUnauth = [
  { to: "/auth/login", label: "Login", icon: ArrowRightEndOnRectangleIcon },
  { to: "/auth/register", label: "Register", icon: UserCircleIcon },
];

// Organized auth navigation with sections
const navSectionsAuth: NavSection[] = [
  {
    title: "Core Tools",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: HomeIcon, pageId: "dashboard" },
      {
        to: "/tasks",
        label: "Tasks",
        icon: CheckCircleIcon,
        pageId: "tasks",
      },
      {
        to: "/day-planner",
        label: "Day Planner",
        icon: CalendarIcon,
        pageId: "day-planner",
      },
      {
        to: "/notes",
        label: "Notes",
        icon: BookOpenIcon,
        pageId: "notes",
      },
    ],
  },
  {
    title: "Financial",
    items: [
      {
        to: "/finance",
        label: "Finance",
        icon: CurrencyDollarIcon,
        pageId: "finance",
        children: [
          {
            to: "/finance/expenses",
            label: "Expenses",
            icon: ArrowUpRightIcon,
            pageId: "finance/expenses",
          },
          {
            to: "/finance/income",
            label: "Income",
            icon: ArrowDownLeftIcon,
            pageId: "finance/income",
          },
          {
            to: "/finance/budgets/shared",
            label: "Shared Budgets",
            icon: ClipboardDocumentListIcon,
            pageId: "finance/budgets/shared",
          },
        ],
      },
    ],
  },
  {
    title: "Tools",
    items: [
      {
        to: "/utilities/commands",
        label: "Commands",
        icon: CommandLineIcon,
        pageId: "utilities/commands",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        to: "/profile",
        label: "Profile",
        icon: UserCircleIcon,
        pageId: "profile",
      },
      {
        to: "/profile/calendar-settings",
        label: "Calendar Settings",
        icon: CalendarIcon,
        pageId: "calendar-settings",
      },
      {
        to: "/auth/logout",
        label: "Logout",
        icon: ArrowLeftEndOnRectangleIcon,
        pageId: "logout",
      },
    ],
  },
];

// Admin navigation sections
const navSectionsAdmin: NavSection[] = [
  {
    title: "Administration",
    items: [
      { to: "/admin", label: "Admin", icon: Cog8ToothIcon, pageId: "admin" },
    ],
  },
  ...navSectionsAuth,
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

  // Helper function to render nav items recursively
  function renderNavItem(
    item: NavItem,
    isSidebarCollapsed: boolean,
    onItemClick?: () => void
  ) {
    if (item.children && item.children.length > 0) {
      return (
        <CollapsibleNavItem
          key={item.to}
          parentLabel={item.label}
          parentIcon={item.icon}
          children={item.children}
          isCollapsed={isSidebarCollapsed}
          onClick={onItemClick}
        />
      );
    }
    return (
      <SidebarLink
        key={item.to}
        to={item.to}
        label={item.label}
        icon={item.icon}
        isCollapsed={isSidebarCollapsed}
        onClick={onItemClick}
      />
    );
  }

  // Determine which nav sections to show based on auth status, admin role, and page access
  let navSections: NavSection[];
  if (!isAuthenticated) {
    navSections = [];
  } else if (isAdmin) {
    navSections = navSectionsAdmin;
  } else {
    // Filter sections and items based on accessible pages
    navSections = navSectionsAuth.map((section) => ({
      ...section,
      items: section.items
        .filter((item) => {
          // Special pages like logout are always accessible
          if (item.pageId === "logout") return true;
          // For items with children, show if parent is accessible
          if (item.children) {
            return accessiblePages.includes(item.pageId);
          }
          // Check if the page is in the accessible pages list
          return accessiblePages.includes(item.pageId);
        })
        .map((item) => {
          // If item has children, filter them based on accessible pages
          if (item.children) {
            return {
              ...item,
              children: item.children.filter((child) =>
                accessiblePages.includes(child.pageId)
              ),
            };
          }
          return item;
        }),
    })).filter((section) => section.items.length > 0); // Remove empty sections
  }

  return (
    <>
      {/* Hamburger Menu - Mobile */}
      <button
        onClick={toggleMobileMenu}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg text-indigo-200 hover:text-white hover:bg-indigo-600 dark:text-indigo-300 dark:hover:text-white dark:hover:bg-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors duration-150"
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
        className={`fixed top-0 left-0 z-40 h-screen bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-white border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out shadow-lg dark:shadow-2xl ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 ${
          isDesktopCollapsed ? "md:w-20" : "md:w-64" // Dynamic width for desktop
        } w-64 md:sticky md:flex md:flex-col`}
      >
        {/* Sidebar Header (for mobile close and desktop collapse) */}
        <div
          className={`flex items-center px-4 py-3 h-16 border-b border-gray-200 dark:border-gray-700 ${
            isDesktopCollapsed && !isMobileMenuOpen
              ? "md:justify-center"
              : "justify-between"
          }`}
        >
          {/* Logo or Title - visible when expanded on desktop, or on mobile */}
          <div
            className={`flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-indigo-300 ${
              isDesktopCollapsed && !isMobileMenuOpen ? "md:hidden" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              S
            </div>
            <span className={isDesktopCollapsed && !isMobileMenuOpen ? "md:hidden" : ""}>
              {!isMobileMenuOpen ? "Sanctuary" : "Menu"}
            </span>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-gray-100 dark:text-indigo-300 dark:hover:text-white dark:hover:bg-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors duration-150"
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
            className="hidden md:block p-2 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-gray-100 dark:text-indigo-300 dark:hover:text-white dark:hover:bg-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors duration-150"
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

        <nav className="flex-1 px-3 py-6 space-y-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          {!isAuthenticated ? (
            // Render unauthenticated items
            navItemsUnauth.map((item) => (
              <SidebarLink
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
                isCollapsed={isDesktopCollapsed && !isMobileMenuOpen}
                onClick={isMobileMenuOpen ? toggleMobileMenu : undefined}
              />
            ))
          ) : (
            // Render authenticated sections
            navSections.map((section, sectionIdx) => (
              <SidebarSection
                key={section.title || `section-${sectionIdx}`}
                title={section.title}
                isCollapsed={isDesktopCollapsed && !isMobileMenuOpen}
                isFirst={sectionIdx === 0}
                isAccountSection={section.title === "Account"}
              >
                {section.items.map((item) =>
                  renderNavItem(
                    item,
                    isDesktopCollapsed && !isMobileMenuOpen,
                    isMobileMenuOpen ? toggleMobileMenu : undefined
                  )
                )}
              </SidebarSection>
            ))
          )}
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
