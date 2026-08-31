/**
 * Feature flags for Sanctuary — two levels, one resolution rule.
 *
 * Platform level (this file, in code):
 *   PLATFORM_DISABLED_FEATURES is the global default and the "revisit later"
 *   switch. Removing an entry re-enables the feature for everyone on deploy.
 *
 * User level (users.feature_overrides in the database, managed in Settings):
 *   Per-user "enabled" | "disabled" overrides for optional features.
 *
 * Resolution rule: the user override wins; otherwise the platform default
 * applies. A single uniform rule with no special cases — it lets a user hide
 * a feature the platform enables, and lets an admin canary a feature the
 * platform disables.
 *
 * Everything in this module is pure and dependency-free so client components,
 * middleware, and tests can share the same core.
 */

export type FeatureId =
  | "dashboard"
  | "settings"
  | "admin"
  | "notes"
  | "finance"
  | "tasks"
  | "day-planner"
  | "shared-budgets"
  | "utilities/commands";

export type FeatureOverride = "enabled" | "disabled";

export type FeatureOverrides = Partial<Record<FeatureId, FeatureOverride>>;

export interface ToggleableFeature {
  id: FeatureId;
  title: string;
  description: string;
}

/**
 * Features that are off for everyone right now. To revisit a feature,
 * remove it from this set (or leave it here and enable it per-user in
 * Settings — user overrides win over this default).
 */
export const PLATFORM_DISABLED_FEATURES: ReadonlySet<FeatureId> = new Set([
  "tasks",
  "day-planner",
  "shared-budgets",
  "utilities/commands",
] satisfies FeatureId[]);

/**
 * Features a user may toggle for themselves in Settings. Deliberately
 * excludes core infrastructure (dashboard, settings, admin, finance
 * expenses/income) that the app depends on or that is not optional.
 */
export const USER_TOGGLEABLE_FEATURES: readonly ToggleableFeature[] = [
  {
    id: "tasks",
    title: "Tasks",
    description: "Task lists with steps, due dates, and progress tracking",
  },
  {
    id: "day-planner",
    title: "Day Planner",
    description: "Time-based day planning with Google Calendar sync",
  },
  {
    id: "notes",
    title: "Notes",
    description: "Encrypted notes with folders and markdown editing",
  },
  {
    id: "shared-budgets",
    title: "Shared Budgets",
    description: "Collaborative budgets shared with other members",
  },
  {
    id: "utilities/commands",
    title: "Commands",
    description: "Command snippets with version timelines",
  },
];

const ALL_FEATURE_IDS: readonly FeatureId[] = [
  "dashboard",
  "settings",
  "admin",
  "notes",
  "finance",
  "tasks",
  "day-planner",
  "shared-budgets",
  "utilities/commands",
];

const FEATURE_ID_SET: ReadonlySet<string> = new Set(ALL_FEATURE_IDS);

const OVERRIDES: ReadonlySet<string> = new Set(["enabled", "disabled"]);

export function isFeatureId(value: string): value is FeatureId {
  return FEATURE_ID_SET.has(value);
}

/**
 * Platform-level availability: is the feature on by default for everyone?
 * This is not the effective state for a specific user — use
 * resolveFeatureEnabled for that.
 */
export function isFeatureAvailable(featureId: FeatureId): boolean {
  return !PLATFORM_DISABLED_FEATURES.has(featureId);
}

/**
 * The single resolution rule: a user override wins; otherwise the feature's
 * platform default applies.
 */
export function resolveFeatureEnabled(
  featureId: FeatureId,
  overrides?: FeatureOverrides | null
): boolean {
  const override = overrides?.[featureId];
  if (override === "enabled") return true;
  if (override === "disabled") return false;
  return isFeatureAvailable(featureId);
}

/**
 * Filter a list of page or feature IDs down to those enabled for a user.
 * Unknown IDs pass through unchanged: they are not gated by flags.
 */
export function filterEnabledFeatures(
  ids: readonly string[],
  overrides?: FeatureOverrides | null
): string[] {
  return ids.filter((id) => {
    if (!isFeatureId(id)) return true;
    return resolveFeatureEnabled(id, overrides);
  });
}

/**
 * Route pageIds do not all match feature IDs ("commands" is the route pageId
 * while "utilities/commands" is the registry and sidebar ID); map them so a
 * single gate covers both spellings.
 */
const PAGE_ID_TO_FEATURE: Record<string, FeatureId> = {
  dashboard: "dashboard",
  settings: "settings",
  admin: "admin",
  notes: "notes",
  finance: "finance",
  tasks: "tasks",
  "day-planner": "day-planner",
  commands: "utilities/commands",
  "utilities/commands": "utilities/commands",
};

export function featureIdForPageId(pageId: string): FeatureId | null {
  return PAGE_ID_TO_FEATURE[pageId] ?? null;
}

/**
 * Validate untrusted JSON from the database or a request into FeatureOverrides.
 * Unknown keys and values are dropped rather than trusted.
 */
export function parseFeatureOverrides(value: unknown): FeatureOverrides {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const overrides: FeatureOverrides = {};
  for (const [key, override] of Object.entries(value)) {
    if (FEATURE_ID_SET.has(key) && OVERRIDES.has(override)) {
      overrides[key as FeatureId] = override as FeatureOverride;
    }
  }
  return overrides;
}

/**
 * Platform default state for every toggleable feature, for clients that have
 * no per-user context.
 */
export function platformAvailableFeatureIds(): FeatureId[] {
  return ALL_FEATURE_IDS.filter(isFeatureAvailable);
}
