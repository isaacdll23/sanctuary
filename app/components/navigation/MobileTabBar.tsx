import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router";
import type { ComponentType, SVGProps } from "react";
import {
  BookOpenIcon,
  CalendarIcon,
  CheckCircleIcon,
  Cog8ToothIcon,
  CommandLineIcon,
  CurrencyDollarIcon,
  HomeIcon,
  Squares2X2Icon,
  XMarkIcon,
  ArrowLeftEndOnRectangleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

interface MobileTabBarProps {
  isAuthenticated: boolean;
  isAdmin?: boolean;
  accessiblePages?: string[];
}

type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

type NavItem = {
  to: string;
  label: string;
  icon: NavIcon;
  pageId: string;
};

const coreTabs: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: HomeIcon, pageId: "dashboard" },
  { to: "/tasks", label: "Tasks", icon: CheckCircleIcon, pageId: "tasks" },
  { to: "/notes", label: "Notes", icon: BookOpenIcon, pageId: "notes" },
  { to: "/day-planner", label: "Plan", icon: CalendarIcon, pageId: "day-planner" },
];

const baseMoreNavItems: NavItem[] = [
  {
    to: "/finance/expenses",
    label: "Finance",
    icon: CurrencyDollarIcon,
    pageId: "finance",
  },
  {
    to: "/utilities/commands",
    label: "Commands",
    icon: CommandLineIcon,
    pageId: "utilities/commands",
  },
  { to: "/settings", label: "Settings", icon: Cog8ToothIcon, pageId: "settings" },
  {
    to: "/auth/logout",
    label: "Logout",
    icon: ArrowLeftEndOnRectangleIcon,
    pageId: "logout",
  },
];

function isPageAccessible(
  pageId: string,
  isAdmin: boolean,
  accessiblePages: Set<string>
) {
  if (isAdmin) return true;
  if (pageId === "logout") return true;
  return accessiblePages.has(pageId);
}

function getTabClasses(isActive: boolean) {
  return [
    "flex min-h-[56px] flex-1 flex-col items-center justify-center rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors",
    isActive
      ? "bg-gray-800 text-gray-100"
      : "text-gray-400 hover:bg-gray-900 hover:text-gray-200",
  ].join(" ");
}

export default function MobileTabBar({
  isAuthenticated,
  isAdmin = false,
  accessiblePages = [],
}: MobileTabBarProps) {
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const accessiblePagesSet = useMemo(
    () => new Set(accessiblePages),
    [accessiblePages]
  );

  const visibleCoreTabs = useMemo(
    () =>
      coreTabs.filter((item) =>
        isPageAccessible(item.pageId, isAdmin, accessiblePagesSet)
      ),
    [isAdmin, accessiblePagesSet]
  );

  const visibleMoreLinks = useMemo(() => {
    const dynamicItems = [...baseMoreNavItems];
    if (isAdmin) {
      dynamicItems.unshift({
        to: "/admin",
        label: "Admin",
        icon: ShieldCheckIcon,
        pageId: "admin",
      });
    }

    return dynamicItems.filter((item) =>
      isPageAccessible(item.pageId, isAdmin, accessiblePagesSet)
    );
  }, [isAdmin, accessiblePagesSet]);

  useEffect(() => {
    setIsMoreOpen(false);
  }, [location.pathname]);

  if (!isAuthenticated) return null;

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-800 bg-gray-950/95 px-3 pt-2 pb-2 backdrop-blur md:hidden"
        style={{
          paddingBottom: "max(0.5rem, var(--safe-area-inset-bottom))",
          paddingLeft: "max(0.75rem, var(--safe-area-inset-left))",
          paddingRight: "max(0.75rem, var(--safe-area-inset-right))",
        }}
        aria-label="Primary"
      >
        <div className="mx-auto flex max-w-screen-sm items-center gap-1.5">
          {visibleCoreTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink key={tab.to} to={tab.to} className={({ isActive }) => getTabClasses(isActive)}>
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </NavLink>
            );
          })}

          {visibleMoreLinks.length > 0 && (
            <button
              type="button"
              onClick={() => setIsMoreOpen(true)}
              className={getTabClasses(isMoreOpen)}
              aria-haspopup="dialog"
              aria-expanded={isMoreOpen}
              aria-label="More options"
            >
              <Squares2X2Icon className="h-5 w-5" />
              <span>More</span>
            </button>
          )}
        </div>
      </nav>

      {isMoreOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMoreOpen(false)}
            aria-label="Close menu overlay"
          />

          <div
            role="dialog"
            aria-modal="true"
            className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-gray-800 bg-gray-950 p-4 shadow-xl"
            style={{
              paddingBottom: "max(1rem, var(--safe-area-inset-bottom))",
              paddingLeft: "max(1rem, var(--safe-area-inset-left))",
              paddingRight: "max(1rem, var(--safe-area-inset-right))",
            }}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-100">More</h2>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                aria-label="Close more menu"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              {visibleMoreLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-gray-800 text-gray-100"
                          : "text-gray-300 hover:bg-gray-900 hover:text-gray-100",
                      ].join(" ")
                    }
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
