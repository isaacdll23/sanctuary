import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import {
  getUserFromSession,
  isSessionCreated,
  isUserAdmin,
} from "./modules/auth.server";
import { getUserAccessiblePages } from "./modules/services/PageAccessService";
import {
  parseFeatureOverrides,
  platformAvailableFeatureIds,
  resolveFeatureEnabled,
} from "./modules/featureFlags";
import "@fontsource-variable/inter";
import "./app.css";
import Sidebar from "./components/sidebar/Sidebar";
import { ToastProvider } from "~/context/ToastContext";
import MobileTabBar from "./components/navigation/MobileTabBar";
import OfflineBanner from "./components/pwa/OfflineBanner";
import ServiceWorkerRegistrar from "./components/pwa/ServiceWorkerRegistrar";
import { appleStartupImageLinks } from "./components/pwa/startupImages";

export const links: Route.LinksFunction = () => [
  // Inter is self-hosted (bundled by Vite) so the app shell is fully
  // self-contained and works offline in the installed PWA.
  ...appleStartupImageLinks(),
  { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
];

export async function loader({ request }: Route.LoaderArgs) {
  try {
    let isAuthenticated = await isSessionCreated(request);
    let isAdmin = false;
    let accessiblePages: string[] = [];
    let enabledFeatures: string[] = [];

    if (isAuthenticated) {
      try {
        isAdmin = await isUserAdmin(request);

        // Get the user and their accessible pages
        const user = await getUserFromSession(request);
        accessiblePages = await getUserAccessiblePages(user.id);

        // Effective per-user feature state: user overrides win over platform defaults
        const overrides = parseFeatureOverrides(user.featureOverrides);
        enabledFeatures = platformAvailableFeatureIds().filter((featureId) =>
          resolveFeatureEnabled(featureId, overrides)
        );
      } catch (error) {
        // If there's an error getting the user or their pages, fallback to defaults
        console.error("Error fetching user data:", error);
        isAuthenticated = false;
        isAdmin = false;
        accessiblePages = [];
        enabledFeatures = [];
      }
    }

    return { isAuthenticated, isAdmin, accessiblePages, enabledFeatures };
  } catch (error) {
    console.error("Error in root loader:", error);
    // Return default values to prevent the app from crashing
    return {
      isAuthenticated: false,
      isAdmin: false,
      accessiblePages: [],
      enabledFeatures: [],
    };
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  const loaderData = useLoaderData<{
    isAuthenticated: boolean;
    isAdmin: boolean;
    accessiblePages: string[];
    enabledFeatures: string[];
  }>();

  // Provide fallback values if loader data is undefined
  const {
    isAuthenticated = false,
    isAdmin = false,
    accessiblePages = [],
    enabledFeatures = [],
  } = loaderData || {};

  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <Meta />
        <Links />
        <link rel="icon" href="/sanctuary-logo-192.png" type="image/png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0c10" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Sanctuary" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black"
        />
      </head>
      <body
        className="m-0 p-0 min-h-dvh flex bg-gray-950 text-gray-100"
        style={{
          paddingTop: "var(--safe-area-inset-top)",
          paddingBottom: "var(--safe-area-inset-bottom)",
        }}
      >
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 bg-gray-800 text-gray-100 py-2 px-4 z-50">
          Skip to main content
        </a>
        <OfflineBanner />
        <ServiceWorkerRegistrar />
        <ToastProvider>
          <Sidebar
            isAuthenticated={isAuthenticated}
            isAdmin={isAdmin}
            accessiblePages={accessiblePages}
            enabledFeatures={enabledFeatures}
          />
          <div
            // pb-[84px] is an explicit px value on purpose: the compact
            // --spacing scale (0.22rem) makes pb-20 only ~62px, which does not
            // clear the ~70px fixed mobile tab bar. 84px clears it with room
            // to spare so the deepest page content never tucks under the bar.
            className={`flex-1 flex flex-col overflow-hidden ${
              isAuthenticated ? "pb-[84px] md:pb-0" : ""
            }`}
          >
            {children}
          </div>
          <MobileTabBar
            isAuthenticated={isAuthenticated}
            isAdmin={isAdmin}
            accessiblePages={accessiblePages}
          />
          <ScrollRestoration />
          <Scripts />
        </ToastProvider>
      </body>
    </html>
  );
}

export default function App() {
  return (
    <main id="main-content" className="flex-1 overflow-y-auto p-0 bg-gray-950 text-gray-100 safe-bottom-pad">
      <Outlet />
    </main>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (error && error instanceof Error) {
    // Failed router data fetches (e.g. while offline) surface here as
    // network errors — give them a clear, actionable message in all envs.
    if (/failed to fetch|networkerror|load failed|network request failed/i.test(error.message)) {
      message = "You're offline";
      details =
        "Sanctuary requires an internet connection. Reconnect and try again.";
    } else if (import.meta.env.DEV) {
      details = error.message;
      stack = error.stack;
    }
  }

  return (
    <main className="pt-12 p-3 container mx-auto bg-gray-950 text-gray-100">
      <h1 className="text-2xl font-bold mb-4">{message}</h1>
      <p className="mb-4">{details}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-gray-100 hover:bg-gray-600"
      >
        Try again
      </button>
      {stack && (
        <pre className="mt-4 w-full p-4 overflow-x-auto bg-gray-100 dark:bg-gray-800 rounded-lg">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
