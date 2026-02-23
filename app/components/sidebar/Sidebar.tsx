import { useMemo, useState } from "react";
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
        to: "/finance/expenses",
        label: "Finance",
        icon: CurrencyDollarIcon,
        pageId: "finance",
        children: [
          {
            to: "/finance/expenses",
            label: "Expenses",
            icon: ArrowUpRightIcon,
            pageId: "finance",
          },
          {
            to: "/finance/income",
            label: "Income",
            icon: ArrowDownLeftIcon,
            pageId: "finance",
          },
          {
            to: "/finance/budgets/shared",
            label: "Shared Budgets",
            icon: ClipboardDocumentListIcon,
            pageId: "finance",
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
        to: "/settings",
        label: "Settings",
        icon: Cog8ToothIcon,
        pageId: "settings",
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

function isPageAccessible(pageId: string, accessiblePages: Set<string>) {
  if (pageId === "logout") return true;
  return accessiblePages.has(pageId);
}

function filterNavSectionsByAccess(
  navSections: readonly NavSection[],
  accessiblePages: Set<string>
) {
  return navSections
    .map((section) => ({
      ...section,
      items: section.items
        .filter((item) => isPageAccessible(item.pageId, accessiblePages))
        .map((item) => {
          if (!item.children?.length) {
            return item;
          }

          return {
            ...item,
            children: item.children.filter((child) =>
              isPageAccessible(child.pageId, accessiblePages)
            ),
          };
        }),
    }))
    .filter((section) => section.items.length > 0);
}

export default function Sidebar({
  isAuthenticated,
  isAdmin = false,
  accessiblePages = [],
}: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const accessiblePagesSet = useMemo(
    () => new Set(accessiblePages),
    [accessiblePages]
  );
  const isSidebarCollapsed = isDesktopCollapsed && !isMobileMenuOpen;
  const onNavItemClick = isMobileMenuOpen ? toggleMobileMenu : undefined;

  function toggleMobileMenu() {
    setIsMobileMenuOpen((value) => !value);
  }

  function toggleDesktopCollapse() {
    setIsDesktopCollapsed((value) => !value);
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

  const navSections = useMemo(() => {
    if (!isAuthenticated) return [];
    if (isAdmin) return navSectionsAdmin;
    return filterNavSectionsByAccess(navSectionsAuth, accessiblePagesSet);
  }, [isAuthenticated, isAdmin, accessiblePagesSet]);

  return (
    <>
      {/* Hamburger Menu - Mobile */}
      <button
        onClick={toggleMobileMenu}
        className="md:hidden fixed top-3 left-3 z-50 p-2 rounded-md text-gray-400 hover:text-gray-100 hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 transition-colors duration-150"
        style={{
          top: "calc(var(--safe-area-inset-top) + 0.75rem)",
          left: "calc(var(--safe-area-inset-left) + 0.75rem)",
        }}
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
        className={`fixed top-0 left-0 z-40 h-dvh bg-gray-950 text-gray-100 border-r border-gray-800 transition-all duration-300 ease-in-out shadow-lg ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 ${
          isDesktopCollapsed ? "md:w-20" : "md:w-56" // Dynamic width for desktop
        } w-56 md:sticky md:flex md:flex-col`}
        style={{
          paddingTop: "var(--safe-area-inset-top)",
          paddingBottom: "var(--safe-area-inset-bottom)",
        }}
      >
        {/* Sidebar Header (for mobile close and desktop collapse) */}
        <div
          className={`flex items-center px-4 py-3 h-14 border-b border-gray-800 ${
            isDesktopCollapsed && !isMobileMenuOpen
              ? "md:justify-center"
              : "justify-between"
          }`}
        >
          {/* Logo or Title - visible when expanded on desktop, or on mobile */}
          <div
            className={`flex items-center gap-2 text-sm font-semibold tracking-wide text-gray-100 ${
              isDesktopCollapsed && !isMobileMenuOpen ? "md:hidden" : ""
            }`}
          >
            <div className="w-7 h-7 rounded-md bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-200 font-semibold text-xs">
              S
            </div>
            <span className={isDesktopCollapsed && !isMobileMenuOpen ? "md:hidden" : ""}>
              {!isMobileMenuOpen ? "Sanctuary" : "Menu"}
            </span>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-100 hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 transition-colors duration-150"
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
            className="hidden md:block p-2 rounded-md text-gray-400 hover:text-gray-100 hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 transition-colors duration-150"
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

        <nav className="flex-1 px-2.5 py-3 space-y-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {!isAuthenticated ? (
            // Render unauthenticated items
            navItemsUnauth.map((item) => (
              <SidebarLink
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
                isCollapsed={isSidebarCollapsed}
                onClick={onNavItemClick}
              />
            ))
          ) : (
            // Render authenticated sections
            navSections.map((section, sectionIdx) => (
              <SidebarSection
                key={section.title || `section-${sectionIdx}`}
                title={section.title}
                isCollapsed={isSidebarCollapsed}
                isFirst={sectionIdx === 0}
                isAccountSection={section.title === "Account"}
              >
                {section.items.map((item) =>
                  renderNavItem(
                    item,
                    isSidebarCollapsed,
                    onNavItemClick
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
