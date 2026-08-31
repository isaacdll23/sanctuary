import { redirect } from "react-router";
import { getUserFromSession, requireAuth } from "../auth.server";
import { hasPageAccess } from "../services/PageAccessService";
import { featureIdForPageId, parseFeatureOverrides, resolveFeatureEnabled, type FeatureId } from "../featureFlags";
import { usersTable } from "~/db/schema";

export type AuthenticatedUser = typeof usersTable.$inferSelect;

/**
 * Middleware to ensure users have access to a specific page
 * Redirects unauthorized users to a specified path (defaults to "/dashboard")
 *
 * @param pageId - The ID of the page being accessed
 * @param redirectPath - The path to redirect to if access is denied
 */
export async function requirePageAccess(
  request: Request,
  pageId: string,
  redirectPath: string = "/dashboard",
  featureId?: FeatureId
) {
  // First ensure the user is authenticated
  await requireAuth(request);

  // Then get the user
  const user = await getUserFromSession(request);

  // Disabled features are blocked for every role, including admins.
  // The user's own overrides count too, so a user who hid a feature for
  // themselves cannot reach it by URL.
  const gatedFeature = featureId ?? featureIdForPageId(pageId);
  if (
    gatedFeature &&
    !resolveFeatureEnabled(gatedFeature, parseFeatureOverrides(user.featureOverrides))
  ) {
    throw redirect(redirectPath);
  }

  // Admin users always have access to all pages
  if (user.role === "admin") {
    return user;
  }

  // Check if the user has access to the specific page
  const hasAccess = await hasPageAccess(user.id, pageId);

  if (!hasAccess) {
    // Redirect unauthorized users
    throw redirect(redirectPath);
  }

  // Return the user for convenience
  return user;
}

/**
 * React Router v7 loader middleware for page access control
 * Uses the auto-generated types from React Router v7
 *
 * @param pageId - The ID of the page being accessed
 * @param loaderFn - The actual loader function to call if access is granted
 */
export function pageAccessLoader<LoaderData>(
  pageId: string,
  loaderFn: (
    user: AuthenticatedUser,
    request: Request,
    params: Record<string, string | undefined>
  ) => Promise<LoaderData> | LoaderData,
  featureId?: FeatureId
) {
  return async ({ request, params }: { request: Request; params: Record<string, string | undefined> }) => {
    // Get user with page access or redirect
    const user = await requirePageAccess(request, pageId, "/dashboard", featureId);

    // Call the actual loader function with the user
    return loaderFn(user, request, params);
  };
}

/**
 * React Router v7 action middleware for page access control
 * Uses the auto-generated types from React Router v7
 *
 * @param pageId - The ID of the page being accessed
 * @param actionFn - The actual action function to call if access is granted
 */
export function pageAccessAction<ActionData>(
  pageId: string,
  actionFn: (
    user: AuthenticatedUser,
    request: Request,
    params: Record<string, string | undefined>
  ) => Promise<ActionData> | ActionData,
  featureId?: FeatureId
) {
  return async ({ request, params }: { request: Request; params: Record<string, string | undefined> }) => {
    // Get user with page access or redirect
    const user = await requirePageAccess(request, pageId, "/dashboard", featureId);

    // Call the actual action function with the user
    return actionFn(user, request, params);
  };
}
