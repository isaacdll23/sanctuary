/**
 * Navigation preference model for Sanctuary — pure and dependency-free so
 * client components, the root loader, and tests share the same core
 * (mirrors the featureFlags module layout).
 *
 * Storage: users.navigation_preferences in the database, shaped as
 * { mobileTabIds: ["tasks", ...] } — the ordered list of pages pinned to the
 * mobile bottom tab bar (at most MOBILE_TAB_LIMIT entries). Everything the
 * user can access but did not pin lands in the bar's "More" sheet.
 *
 * Stored preferences are never an authorization path: the tab bar and the
 * settings UI always intersect them with the user's accessible pages.
 */

export type NavPageId =
  | "dashboard"
  | "tasks"
  | "day-planner"
  | "notes"
  | "finance"
  | "utilities/commands"
  | "settings"
  | "admin"
  | "logout";

/**
 * Pages a user may pin to the mobile tab bar. Logout is deliberately not
 * pinnable — it always stays in the "More" sheet.
 */
export const PINNABLE_PAGE_IDS: readonly NavPageId[] = [
  "dashboard",
  "tasks",
  "day-planner",
  "notes",
  "finance",
  "utilities/commands",
  "settings",
  "admin",
];

const PINNABLE_PAGE_ID_SET: ReadonlySet<string> = new Set(PINNABLE_PAGE_IDS);

/** How many tabs fit in the mobile bottom bar alongside the "More" button. */
export const MOBILE_TAB_LIMIT = 4;

/** Default pinned tabs for users who never customized the bar. */
export const DEFAULT_MOBILE_TAB_IDS: readonly NavPageId[] = [
  "dashboard",
  "tasks",
  "notes",
  "day-planner",
];

export interface NavigationPreferences {
  mobileTabIds: readonly NavPageId[];
}

export function isPinnablePageId(value: string): value is NavPageId {
  return PINNABLE_PAGE_ID_SET.has(value);
}

/**
 * Keep only pinnable ids, drop duplicates (first occurrence wins), and cap
 * the result at MOBILE_TAB_LIMIT.
 */
export function normalizeMobileTabIds(
  ids: readonly string[]
): NavPageId[] {
  const seen = new Set<string>();
  const tabIds: NavPageId[] = [];
  for (const id of ids) {
    if (!isPinnablePageId(id) || seen.has(id)) continue;
    seen.add(id);
    tabIds.push(id);
    if (tabIds.length === MOBILE_TAB_LIMIT) break;
  }
  return tabIds;
}

/**
 * Validate untrusted JSON from the database (or a request body) into
 * NavigationPreferences. Unknown or invalid values are dropped rather than
 * trusted; when nothing valid remains the defaults apply.
 */
export function parseNavigationPreferences(value: unknown): NavigationPreferences {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { mobileTabIds: DEFAULT_MOBILE_TAB_IDS };
  }

  const rawTabIds = (value as { mobileTabIds?: unknown }).mobileTabIds;
  if (!Array.isArray(rawTabIds)) {
    return { mobileTabIds: DEFAULT_MOBILE_TAB_IDS };
  }

  const tabIds = normalizeMobileTabIds(
    rawTabIds.filter((id): id is string => typeof id === "string")
  );
  if (tabIds.length === 0) {
    return { mobileTabIds: DEFAULT_MOBILE_TAB_IDS };
  }
  return { mobileTabIds: tabIds };
}

export type ParsedMobileTabIdsInput =
  | { ok: true; tabIds: NavPageId[] }
  | { ok: false; error: string };

/**
 * Validate the "tabIds" form input (comma-separated page ids) from the
 * settings form. Unlike the lenient database parse, invalid input is
 * rejected with an error the user sees.
 */
export function parseMobileTabIdsInput(
  value: string
): ParsedMobileTabIdsInput {
  const ids = value
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  if (ids.length === 0) {
    return { ok: false, error: "Select at least one tab." };
  }

  const unknown = ids.find((id) => !isPinnablePageId(id));
  if (unknown) {
    return { ok: false, error: `Unknown page "${unknown}".` };
  }

  const duplicates = ids.length !== new Set(ids).size;
  if (duplicates) {
    return { ok: false, error: "Each page can only be pinned once." };
  }

  if (ids.length > MOBILE_TAB_LIMIT) {
    return {
      ok: false,
      error: `Pin at most ${MOBILE_TAB_LIMIT} tabs.`,
    };
  }

  return { ok: true, tabIds: ids as NavPageId[] };
}
