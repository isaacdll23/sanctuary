import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData, // Added useLoaderData import
} from "react-router";

import type { Route } from "./+types/root";
import { isSessionCreated } from "./modules/auth.server";
import "./app.css";
// import Header from "./components/header/header"; // Remove old header
import Sidebar from "./components/sidebar/Sidebar"; // Import new Sidebar

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

  return { isAuthenticated };
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useLoaderData<{ isAuthenticated: boolean }>(); // Get isAuthenticated from loader

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
        />
      </head>
      <body className="m-0 p-0 h-screen flex"> {/* Modified body to use flex */}
        <Sidebar isAuthenticated={isAuthenticated} /> {/* Add Sidebar */}
        <div className="flex-1 flex flex-col overflow-hidden"> {/* Added wrapper for main content */}
          {/* <Header /> */} {/* Remove old header */}
          {children}
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6"> {/* Adjusted padding and overflow */}
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
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
