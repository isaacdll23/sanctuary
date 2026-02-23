import { getUserAccessiblePages } from "./PageAccessService";
import type { FeatureCard } from "~/types/dashboard.types";

/**
 * Feature Registry - Maps all available features in Sanctuary
 * Each feature corresponds to a navigable section and is controlled by page access
 */
export const FEATURE_REGISTRY: Record<string, Omit<FeatureCard, "isAccessible">> = {
  tasks: {
    id: "tasks",
    pageId: "tasks",
    title: "Tasks",
    description: "Create, track, and manage your tasks with steps and due dates",
    icon: "CheckCircleIcon",
    route: "/tasks",
  },
  "day-planner": {
    id: "day-planner",
    pageId: "day-planner",
    title: "Day Planner",
    description: "Schedule your day with time-based task planning and calendar view",
    icon: "CalendarIcon",
    route: "/day-planner",
  },
  notes: {
    id: "notes",
    pageId: "notes",
    title: "Notes",
    description: "Write, organize, and manage your notes with folders and encryption",
    icon: "BookOpenIcon",
    route: "/notes",
  },
  finance: {
    id: "finance",
    pageId: "finance",
    title: "Finance",
    description: "Track expenses, manage budgets, and collaborate on shared finances",
    icon: "CurrencyDollarIcon",
    route: "/finance/expenses",
  },
  "utilities/commands": {
    id: "utilities/commands",
    pageId: "utilities/commands",
    title: "Commands",
    description: "Create and manage command snippets for quick access to common workflows",
    icon: "CommandLineIcon",
    route: "/utilities/commands",
  },
  settings: {
    id: "settings",
    pageId: "settings",
    title: "Settings",
    description: "Manage your account settings, preferences, and profile",
    icon: "Cog8ToothIcon",
    route: "/settings",
  },
  admin: {
    id: "admin",
    pageId: "admin",
    title: "Admin",
    description: "Manage users, permissions, and system-wide settings",
    icon: "ShieldCheckIcon",
    route: "/admin",
  },
};

/**
 * Get all features accessible to a user based on their role and page access
 * Returns feature cards sorted by default order with access status
 */
export async function getAccessibleFeatures(
  userId: number
): Promise<FeatureCard[]> {
  // Get user's accessible pages from PageAccessService
  const accessiblePages = await getUserAccessiblePages(userId);

  // Map registry to feature cards, checking access for each
  const features: FeatureCard[] = Object.values(FEATURE_REGISTRY).map((feature) => ({
    ...feature,
    isAccessible: accessiblePages.includes(feature.pageId),
  }));

  // Filter to only show accessible features
  const accessibleFeatures = features.filter((f) => f.isAccessible);

  // Sort by a default order (maintain sidebar order)
  const featureOrder = [
    "tasks",
    "day-planner",
    "notes",
    "finance",
    "utilities/commands",
    "settings",
    "admin",
  ];

  accessibleFeatures.sort((a, b) => {
    const indexA = featureOrder.indexOf(a.id);
    const indexB = featureOrder.indexOf(b.id);
    return indexA - indexB;
  });

  return accessibleFeatures;
}

/**
 * Get a single feature by ID with access status
 */
export async function getFeature(
  userId: number,
  featureId: string
): Promise<FeatureCard | null> {
  const feature = FEATURE_REGISTRY[featureId];
  if (!feature) {
    return null;
  }

  const accessiblePages = await getUserAccessiblePages(userId);
  const isAccessible = accessiblePages.includes(feature.pageId);

  return {
    ...feature,
    isAccessible,
  };
}

/**
 * Check if a user has access to a specific feature
 */
export async function hasFeatureAccess(
  userId: number,
  featureId: string
): Promise<boolean> {
  const feature = await getFeature(userId, featureId);
  return feature?.isAccessible ?? false;
}
