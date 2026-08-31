import { useEffect } from "react";

/**
 * Registers the service worker in production builds only, so development is
 * never affected by caching (HMR etc.). Kept as a component so registration
 * happens after hydration on the client.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service worker registration failed:", error);
      });
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
