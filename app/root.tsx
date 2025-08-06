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
import { ToastProvider } from "./context/ToastContext";

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
];

export async function loader({ request }: Route.LoaderArgs) {
  let isAuthenticated = await isSessionCreated(request);
  let isAdmin = false;
  let accessiblePages: string[] = [];

  if (isAuthenticated) {
    isAdmin = await isUserAdmin(request);

    // Get the user and their accessible pages
    try {
      const user = await getUserFromSession(request);
      accessiblePages = await getUserAccessiblePages(user.id);
    } catch (error) {
      // If there's an error getting the user or their pages, fallback to an empty list
      console.error("Error fetching user accessible pages:", error);
    }
  }

  return { isAuthenticated, isAdmin, accessiblePages };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, accessiblePages } = useLoaderData<{
    isAuthenticated: boolean;
    isAdmin: boolean;
    accessiblePages: string[];
  }>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />{" "}
      </head>
      <body className="m-0 p-0 h-screen flex bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <ToastProvider>
          <Sidebar
            isAuthenticated={isAuthenticated}
            isAdmin={isAdmin}
            accessiblePages={accessiblePages}
          />
          <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
          <ScrollRestoration />
          <Scripts />
        </ToastProvider>
      </body>
    </html>
  );
}

export default function App() {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
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
    <main className="pt-16 p-4 container mx-auto bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
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
