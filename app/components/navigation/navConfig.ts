import type { ComponentType, SVGProps } from "react";
import {
  ArrowDownLeftIcon,
  ArrowLeftEndOnRectangleIcon,
  ArrowUpRightIcon,
  BookOpenIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  CommandLineIcon,
  Cog8ToothIcon,
  CurrencyDollarIcon,
  HomeIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import type { FeatureId } from "~/modules/featureFlags";
import {
  DEFAULT_MOBILE_TAB_IDS,
  MOBILE_TAB_LIMIT,
  type NavPageId,
} from "~/modules/navigation";

export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

export interface NavItemDef {
  pageId: NavPageId;
  to: string;
  label: string;
  /** Compact label for the mobile tab bar; falls back to label. */
  shortLabel?: string;
  icon: NavIcon;
  /**
   * Route prefix for active-state matching; defaults to `to`. Needed when a
   * page has child routes under a different path segment (e.g. /finance).
   */
  activePrefix?: string;
  /** Gated independently of pageId (e.g. Shared Budgets under finance). */
  featureId?: FeatureId;
  /** Sidebar-only nested links rendered under this item. */
  children?: NavChildDef[];
}

export interface NavChildDef {
  pageId: NavPageId;
  to: string;
  label: string;
  icon: NavIcon;
  featureId?: FeatureId;
}

export interface NavSectionDef {
  title?: string;
  items: NavItemDef[];
}

export const logoutNavItem: NavItemDef = {
  pageId: "logout",
  to: "/auth/logout",
  label: "Logout",
  icon: ArrowLeftEndOnRectangleIcon,
};

const dashboardNavItem: NavItemDef = {
  pageId: "dashboard",
  to: "/dashboard",
  label: "Dashboard",
  shortLabel: "Home",
  icon: HomeIcon,
};

const tasksNavItem: NavItemDef = {
  pageId: "tasks",
  to: "/tasks",
  label: "Tasks",
  icon: CheckCircleIcon,
};

const dayPlannerNavItem: NavItemDef = {
  pageId: "day-planner",
  to: "/day-planner",
  label: "Day Planner",
  shortLabel: "Plan",
  icon: CalendarIcon,
};

const notesNavItem: NavItemDef = {
  pageId: "notes",
  to: "/notes",
  label: "Notes",
  icon: BookOpenIcon,
};

const financeNavItem: NavItemDef = {
  pageId: "finance",
  to: "/finance/expenses",
  label: "Finance",
  icon: CurrencyDollarIcon,
  activePrefix: "/finance",
  children: [
    {
      pageId: "finance",
      to: "/finance/expenses",
      label: "Expenses",
      icon: ArrowUpRightIcon,
    },
    {
      pageId: "finance",
      to: "/finance/income",
      label: "Income",
      icon: ArrowDownLeftIcon,
    },
    {
      pageId: "finance",
      to: "/finance/budgets/shared",
      label: "Shared Budgets",
      icon: ClipboardDocumentListIcon,
      featureId: "shared-budgets",
    },
  ],
};

const commandsNavItem: NavItemDef = {
  pageId: "utilities/commands",
  to: "/utilities/commands",
  label: "Commands",
  icon: CommandLineIcon,
};

const settingsNavItem: NavItemDef = {
  pageId: "settings",
  to: "/settings",
  label: "Settings",
  icon: Cog8ToothIcon,
};

/**
 * Every navigable page, in sidebar order. The desktop sidebar renders these
 * grouped into sections; the mobile tab bar picks from them for pinned tabs
 * and the "More" sheet.
 */
export const navItems: readonly NavItemDef[] = [
  dashboardNavItem,
  tasksNavItem,
  dayPlannerNavItem,
  notesNavItem,
  financeNavItem,
  commandsNavItem,
  settingsNavItem,
];

export const adminNavItem: NavItemDef = {
  pageId: "admin",
  to: "/admin",
  label: "Admin",
  icon: ShieldCheckIcon,
};

export const navSections: readonly NavSectionDef[] = [
  {
    title: "Core Tools",
    items: [dashboardNavItem, tasksNavItem, dayPlannerNavItem, notesNavItem],
  },
  {
    title: "Financial",
    items: [financeNavItem],
  },
  {
    title: "Tools",
    items: [commandsNavItem],
  },
  {
    title: "Account",
    items: [settingsNavItem, logoutNavItem],
  },
];

export const adminNavSection: NavSectionDef = {
  title: "Administration",
  items: [adminNavItem],
};

/**
 * Logout is reachable for every authenticated user; everything else goes
 * through the per-user accessible pages list.
 */
export function isPageAccessible(
  pageId: string,
  accessiblePages: ReadonlySet<string>
) {
  if (pageId === "logout") return true;
  return accessiblePages.has(pageId);
}

export function isNavItemVisible(
  item: NavItemDef | NavChildDef,
  accessiblePages: ReadonlySet<string>,
  enabledFeatures: ReadonlySet<string>
) {
  if (!isPageAccessible(item.pageId, accessiblePages)) return false;
  if (item.featureId && !enabledFeatures.has(item.featureId)) return false;
  return true;
}

/** Is this nav item the current page? Matches by route prefix so child
 * routes (e.g. /finance/income) highlight their parent tab. */
export function isNavItemActive(
  item: Pick<NavItemDef, "to" | "activePrefix">,
  pathname: string
) {
  const prefix = item.activePrefix ?? item.to;
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Resolve the mobile bar's pinned tabs: the user's stored order first, minus
 * anything they can no longer access, capped at MOBILE_TAB_LIMIT. Falls back
 * to the defaults when there are no (valid) stored preferences.
 */
export function resolvePinnedTabs(
  mobileTabIds: readonly string[],
  accessiblePages: ReadonlySet<string>
): NavItemDef[] {
  const ids =
    mobileTabIds.length > 0 ? mobileTabIds : DEFAULT_MOBILE_TAB_IDS;
  const byPageId = new Map<string, NavItemDef>(
    [...navItems, adminNavItem].map((item) => [item.pageId, item])
  );

  return ids
    .slice(0, MOBILE_TAB_LIMIT)
    .map((pageId) => byPageId.get(pageId))
    .filter(
      (item): item is NavItemDef =>
        item != null && isPageAccessible(item.pageId, accessiblePages)
    );
}
