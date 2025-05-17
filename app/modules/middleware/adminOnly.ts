import { redirect } from "react-router";
import { getUserFromSession, requireAuth } from "../auth.server";

/**
 * Middleware to ensure only admin users can access a route
 * Redirects non-admin users to a specified path (defaults to "/dashboard")
 */
export async function requireAdminUser(
  request: Request,
  redirectPath: string = "/dashboard"
) {
  // First ensure the user is authenticated
  await requireAuth(request);

  // Then get the user
  const user = await getUserFromSession(request);

  // Check if the user has admin role
  if (user.role !== "admin") {
    // Redirect non-admin users
    throw redirect(redirectPath);
  }

  // Return the admin user for convenience
  return user;
}

/**
 * React Router v7 loader middleware for admin-only routes
 * Uses the auto-generated types from React Router v7
 */
export function adminOnlyLoader<LoaderData>(
  loaderFn: (user: any, request: Request) => Promise<LoaderData> | LoaderData
) {
  return async ({ request }: { request: Request }) => {
    // Get admin user or redirect
    const adminUser = await requireAdminUser(request);

    // Call the actual loader function with the admin user
    return loaderFn(adminUser, request);
  };
}

/**
 * React Router v7 action middleware for admin-only routes
 * Uses the auto-generated types from React Router v7
 */
export function adminOnlyAction<ActionData>(
  actionFn: (user: any, request: Request) => Promise<ActionData> | ActionData
) {
  return async ({ request }: { request: Request }) => {
    // Get admin user or redirect
    const adminUser = await requireAdminUser(request);

    // Call the actual action function with the admin user
    return actionFn(adminUser, request);
  };
}
