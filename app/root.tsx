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
import "./app.css";
import Sidebar from "./components/sidebar/Sidebar";
import { ToastProvider } from "~/context/ToastContext";
import MobileTabBar from "./components/navigation/MobileTabBar";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  { rel: "apple-touch-icon", href: "/sanctuary-logo-192.png" },
];

export async function loader({ request }: Route.LoaderArgs) {
  try {
    let isAuthenticated = await isSessionCreated(request);
    let isAdmin = false;
    let accessiblePages: string[] = [];

    if (isAuthenticated) {
      try {
        isAdmin = await isUserAdmin(request);

        // Get the user and their accessible pages
        const user = await getUserFromSession(request);
        accessiblePages = await getUserAccessiblePages(user.id);
      } catch (error) {
        // If there's an error getting the user or their pages, fallback to defaults
        console.error("Error fetching user data:", error);
        isAuthenticated = false;
        isAdmin = false;
        accessiblePages = [];
      }
    }

    return { isAuthenticated, isAdmin, accessiblePages };
  } catch (error) {
    console.error("Error in root loader:", error);
    // Return default values to prevent the app from crashing
    return {
      isAuthenticated: false,
      isAdmin: false,
      accessiblePages: [],
    };
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  const loaderData = useLoaderData<{
    isAuthenticated: boolean;
    isAdmin: boolean;
    accessiblePages: string[];
  }>();

  // Provide fallback values if loader data is undefined
  const {
    isAuthenticated = false,
    isAdmin = false,
    accessiblePages = [],
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
        <ToastProvider>
          <Sidebar
            isAuthenticated={isAuthenticated}
            isAdmin={isAdmin}
            accessiblePages={accessiblePages}
          />
          <div
            className={`flex-1 flex flex-col overflow-hidden ${
              isAuthenticated ? "pb-20 md:pb-0" : ""
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
    <main className="flex-1 overflow-y-auto p-0 bg-gray-950 text-gray-100 safe-bottom-pad">
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
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-12 p-3 container mx-auto bg-gray-950 text-gray-100">
      <h1 className="text-2xl font-bold mb-4">{message}</h1>
      <p className="mb-4">{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto bg-gray-100 dark:bg-gray-800 rounded-lg">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
